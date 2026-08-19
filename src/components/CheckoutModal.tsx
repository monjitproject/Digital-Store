import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Download,
  QrCode,
  Smartphone,
  Tag,
  ArrowRight,
  Lock,
  Sparkles,
  MessageCircle,
  Copy,
  Check,
  Upload,
  Clock,
  ExternalLink,
  ChevronLeft,
  FileImage,
  RefreshCw,
} from 'lucide-react';
import { Item, Order, StoreSettings } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface CheckoutModalProps {
  item: Item;
  onClose: () => void;
  onSuccess: (order: Order) => void;
  onGoToDownloads?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  item,
  onClose,
  onSuccess,
  onGoToDownloads,
}) => {
  const { user, refreshUserData } = useAuth();

  // Settings
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  // Form Fields
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Steps: 'select_method' | 'phonepe_proof_form' | 'awaiting_verification' | 'verified_success'
  const [checkoutStep, setCheckoutStep] = useState<'select_method' | 'phonepe_proof_form' | 'awaiting_verification' | 'verified_success'>('select_method');

  // Proof Form Fields
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>('');
  const [screenshotFileName, setScreenshotFileName] = useState<string>('');
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // UI helpers
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [downloading, setDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URL
  useEffect(() => {
    return () => {
      if (screenshotPreview && screenshotPreview.startsWith('blob:')) {
        URL.revokeObjectURL(screenshotPreview);
      }
    };
  }, [screenshotPreview]);

  // Fetch store settings on mount
  useEffect(() => {
    api.getSettings().then((res) => {
      if (res.success && res.settings) {
        setSettings(res.settings);
      }
    }).catch(console.error);
  }, []);

  // Sync user email and name
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name || '');
      if (!customerEmail) setCustomerEmail(user.email || '');
    }
  }, [user]);

  // Calculate Price
  const baseAmount = item.finalPrice;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const payableAmount = Math.max(0, baseAmount - discountAmount);

  // Real-time polling when order is in 'awaiting_verification'
  useEffect(() => {
    let interval: any = null;
    if (checkoutStep === 'awaiting_verification' && activeOrderId) {
      interval = setInterval(async () => {
        try {
          const statusRes = await api.checkOrderStatus(activeOrderId);
          if (statusRes.success) {
            if (statusRes.status === 'PAID') {
              setCheckoutStep('verified_success');
              await refreshUserData();
              const ordersRes = await api.getOrders(customerEmail);
              if (ordersRes.success) {
                const found = ordersRes.orders.find((o) => o.id === activeOrderId);
                if (found) {
                  setActiveOrder(found);
                  onSuccess(found);
                }
              }
            } else if (statusRes.status === 'REJECTED') {
              setErrorMsg('Payment verification rejected. Please check your UTR or contact store owner.');
            }
          }
        } catch (err) {
          console.error('Polling order error:', err);
        }
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [checkoutStep, activeOrderId, customerEmail, refreshUserData, onSuccess]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError('');
    try {
      const res = await api.applyCoupon(couponCode.trim().toUpperCase(), baseAmount);
      if (res.success && res.discountAmount !== undefined) {
        setAppliedCoupon({ code: res.code || couponCode.toUpperCase(), discountAmount: res.discountAmount });
      } else {
        setCouponError(res.message || 'Invalid or expired coupon');
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError('Failed to validate coupon');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // WhatsApp Checkout Action
  const handleWhatsAppCheckout = async () => {
    if (!customerEmail.trim() || !customerName.trim()) {
      setErrorMsg('Please enter customer name and Google email.');
      return;
    }

    try {
      const initRes = await api.initiateCheckout({
        itemId: item.id,
        customerEmail: customerEmail.trim(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        couponCode: appliedCoupon?.code,
        paymentMethod: 'WHATSAPP',
      });

      if (initRes.success && initRes.orderId) {
        setActiveOrderId(initRes.orderId);
      }

      const waPhone = (settings?.whatsappNumber || '919876543210').replace(/[^0-9]/g, '');
      const message = `Hello, I want to buy:\nProduct: ${item.title}\nPrice: ₹${payableAmount}\nProduct ID: ${item.id}\nCustomer Email: ${customerEmail}`;
      const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to open WhatsApp.');
    }
  };

  // PhonePe QR Code Checkout Action -> Proceed to Proof Form
  const handleProceedToPhonePeProof = async () => {
    if (!customerEmail.trim() || !customerName.trim()) {
      setErrorMsg('Please enter customer name and Google email.');
      return;
    }

    setErrorMsg('');
    setIsSubmittingProof(true);

    try {
      const initRes = await api.initiateCheckout({
        itemId: item.id,
        customerEmail: customerEmail.trim(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        couponCode: appliedCoupon?.code,
        paymentMethod: 'PHONEPE_QR',
      });

      if (initRes.success && initRes.orderId) {
        setActiveOrderId(initRes.orderId);
        setCheckoutStep('phonepe_proof_form');
      } else {
        throw new Error(initRes.message || 'Could not initiate PhonePe QR order.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create order.');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  // Handle File Upload (Screenshot)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload an image file (PNG, JPG, JPEG, WebP).');
      return;
    }

    setScreenshotFile(file);
    setScreenshotFileName(file.name);
    if (screenshotPreview && screenshotPreview.startsWith('blob:')) {
      URL.revokeObjectURL(screenshotPreview);
    }
    const blobUrl = URL.createObjectURL(file);
    setScreenshotPreview(blobUrl);
    setErrorMsg('');
  };

  // Submit Payment Proof (UTR + Screenshot)
  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrderId) {
      setErrorMsg('Order session expired. Please start again.');
      return;
    }
    if (!utrNumber.trim()) {
      setErrorMsg('Please enter the 12-digit UTR or Transaction ID.');
      return;
    }
    if (!screenshotFile && !screenshotPreview) {
      setErrorMsg('Please upload a screenshot of your completed payment.');
      return;
    }

    setErrorMsg('');
    setIsSubmittingProof(true);

    try {
      let finalProofUrl = screenshotPreview;
      if (screenshotFile) {
        const uploadRes = await api.uploadBinary(screenshotFile, { isPublic: true });
        if (uploadRes.success && uploadRes.url) {
          finalProofUrl = uploadRes.url;
        }
      }

      const submitRes = await api.submitPaymentProof({
        orderId: activeOrderId,
        transactionId: utrNumber.trim(),
        paymentProof: finalProofUrl,
        customerPhone: customerPhone.trim() || undefined,
      });

      if (submitRes.success && submitRes.order) {
        setActiveOrder(submitRes.order);
        setCheckoutStep('awaiting_verification');
      } else {
        throw new Error(submitRes.message || 'Proof submission failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit payment proof.');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  // Instant Download Action for Verified Orders
  const handleInstantDownload = async () => {
    if (!activeOrder && !activeOrderId) return;
    const orderIdToUse = activeOrder?.id || activeOrderId;
    if (!orderIdToUse) return;

    setDownloading(true);
    try {
      const res = await api.generateDownloadToken(orderIdToUse, customerEmail);
      if (res.success && res.downloadUrl) {
        const link = document.createElement('a');
        link.href = res.downloadUrl;
        link.setAttribute('download', res.filename || item.downloadFileName || 'deliverable.zip');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(res.message || 'Unable to stream deliverable. Order must be verified by store owner.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const upiIdDisplay = settings?.upiId || 'vmanjeet773@ybl';
  const qrCodeUrl = settings?.phonepeQrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=upi://pay?pa=${encodeURIComponent(upiIdDisplay)}%26pn=DigiVault%26am=${payableAmount}%26cu=INR`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-7 shadow-2xl text-slate-100 my-6 overflow-hidden max-h-[92vh] overflow-y-auto"
      >
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Product Summary */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3.5 mb-5">
          <img
            src={item.coverImage}
            alt=""
            className="w-14 h-14 rounded-xl object-cover bg-slate-900 border border-slate-800 shrink-0"
          />
          <div className="space-y-0.5 flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">{item.type}</span>
            <h3 className="font-bold text-xs sm:text-sm text-white truncate">{item.title}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-black text-yellow-400">₹{payableAmount}</span>
              {item.mrp > item.finalPrice && (
                <span className="text-xs text-slate-500 line-through">₹{item.mrp}</span>
              )}
              <span className="text-[10px] text-emerald-400 font-extrabold bg-emerald-500/10 px-1.5 py-0.2 rounded">
                {item.discountPercent}% OFF
              </span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: PAYMENT METHOD SELECTION (WHATSAPP & PHONEPE QR) */}
          {checkoutStep === 'select_method' && (
            <motion.div
              key="select_method"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-5"
            >
              {/* Customer Google Account Details & Coupon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Google Email (Vault Account) *</label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Coupon Bar */}
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Discount Coupon (e.g. WELCOME10)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white uppercase placeholder-slate-500 font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon || !couponCode.trim()}
                    className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 border border-amber-500/30 disabled:opacity-50"
                  >
                    {isApplyingCoupon ? '...' : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="text-[10px] text-rose-400 mt-1">{couponError}</p>}
                {appliedCoupon && (
                  <p className="text-[10px] text-emerald-400 font-bold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Coupon {appliedCoupon.code} applied! Saved ₹{appliedCoupon.discountAmount}
                  </p>
                )}
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-sm font-extrabold text-white">Choose Your Direct Payment Method</h3>
                <p className="text-[11px] text-slate-400">Owner-verified secure checkout with instant digital deliverable</p>
              </div>

              {/* OPTION 1: WHATSAPP CARD */}
              <div className="relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-900 border border-emerald-500/30 space-y-3 shadow-lg">
                {/* Floating Lightning Badge */}
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold shadow-sm animate-pulse">
                  <Sparkles className="w-3 h-3 text-yellow-300" />
                  <span>कोई भी Theme Buy करने के लिये इस Whatsapp Link पर Click करें और Buy करें</span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <MessageCircle className="w-6 h-6 fill-emerald-400 text-slate-950" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">WhatsApp Instant Purchase</h4>
                      <p className="text-[11px] text-slate-400">Chat directly with the store owner & receive instant files</p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleWhatsAppCheckout}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Buy via WhatsApp (₹{payableAmount})</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* OPTION 2: PHONEPE QR CODE CARD */}
              <div className="relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-950 to-slate-900 border border-purple-500/30 space-y-4 shadow-lg">
                {/* Floating Lightning Badge */}
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-extrabold shadow-sm animate-pulse">
                  <Sparkles className="w-3 h-3 text-yellow-300" />
                  <span>ये QR Code स्कैन करें payment करें</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950/70 p-4 rounded-2xl border border-purple-500/20">
                  {/* QR Code display */}
                  <div className="p-2 bg-white rounded-2xl shadow-xl shrink-0">
                    <img
                      src={qrCodeUrl}
                      alt="PhonePe QR Code"
                      className="w-36 h-36 object-contain rounded-lg"
                    />
                  </div>

                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <QrCode className="w-4 h-4 text-purple-400" />
                      <h4 className="text-sm font-bold text-white">Scan & Pay with PhonePe</h4>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Scan using PhonePe, GPay, Paytm, or any UPI app to pay <strong className="text-yellow-400">₹{payableAmount}</strong>.
                    </p>

                    {/* Copyable UPI ID */}
                    <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                      <span className="text-[11px] font-mono text-purple-300 bg-purple-900/40 px-2.5 py-1 rounded-lg border border-purple-500/30">
                        {upiIdDisplay}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(upiIdDisplay)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Copy UPI ID"
                      >
                        {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToPhonePeProof}
                  disabled={isSubmittingProof}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <span>I Have Completed Payment • Submit Proof</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: PHONEPE PAYMENT PROOF VERIFICATION FORM */}
          {checkoutStep === 'phonepe_proof_form' && (
            <motion.div
              key="proof_form"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('select_method')}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white font-bold"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Payment
                </button>
                <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  Verification Step
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black text-white">Submit Payment Details for Verification</h3>
                <p className="text-xs text-slate-400">
                  Enter your 12-digit UTR/Transaction ID and upload the payment screenshot.
                </p>
              </div>

              <form onSubmit={handleSubmitProof} className="space-y-4">
                {/* Product & Amount confirmation */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-400">Product:</span>
                    <span className="font-bold text-white ml-2">{item.title}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Amount:</span>
                    <span className="font-black text-yellow-400 ml-2">₹{payableAmount}</span>
                  </div>
                </div>

                {/* Customer Google Account auto-fill */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Customer Name</label>
                    <input
                      type="text"
                      disabled
                      value={customerName}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Google Email</label>
                    <input
                      type="email"
                      disabled
                      value={customerEmail}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono"
                    />
                  </div>
                </div>

                {/* UTR / Transaction ID */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-200 mb-1">
                    12-Digit Transaction ID / UTR Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="e.g. 328491823901 or UPI Reference"
                    className="w-full bg-slate-950 border border-purple-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono tracking-wider focus:border-purple-400 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Found in your PhonePe / UPI payment history receipts.</p>
                </div>

                {/* Payment Screenshot File Upload */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-200 mb-1">
                    Upload Payment Screenshot *
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {screenshotPreview ? (
                    <div className="relative p-3 rounded-2xl bg-slate-950 border border-emerald-500/40 flex items-center gap-3">
                      <img
                        src={screenshotPreview}
                        alt="Screenshot Preview"
                        className="w-14 h-14 object-cover rounded-xl border border-slate-700 bg-slate-900"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-white block truncate">{screenshotFileName || 'payment-screenshot.png'}</span>
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Screenshot Ready
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-6 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-700 hover:border-purple-500 text-center cursor-pointer transition-colors space-y-2"
                    >
                      <Upload className="w-7 h-7 text-purple-400 mx-auto" />
                      <div className="text-xs font-bold text-slate-200">
                        Click or drag screenshot here to upload
                      </div>
                      <p className="text-[10px] text-slate-500">Supports PNG, JPG, JPEG, WebP</p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingProof || !utrNumber.trim() || !screenshotPreview}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-purple-900/30 disabled:opacity-50 cursor-pointer active:scale-[0.99] transition-all"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isSubmittingProof ? 'Submitting Proof...' : 'Submit Payment for Verification'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 3: AWAITING OWNER VERIFICATION */}
          {checkoutStep === 'awaiting_verification' && (
            <motion.div
              key="awaiting_verification"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-6 space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20 animate-pulse">
                <Clock className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-black text-white">Payment Submitted Successfully!</h2>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Your order is currently <strong className="text-amber-400 font-extrabold">Awaiting Owner Verification</strong>. As soon as the store owner confirms your UTR and screenshot, your deliverable download link will automatically unlock.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Order ID:</span>
                  <span className="font-mono font-bold text-slate-200">{activeOrderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">UTR / Reference:</span>
                  <span className="font-mono text-purple-300">{utrNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Google Account:</span>
                  <span className="font-mono text-emerald-400">{customerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                    PENDING VERIFICATION
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Checking status in real-time...</span>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onGoToDownloads) onGoToDownloads();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                >
                  View My Orders & Account
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: PAYMENT VERIFIED & INSTANT DOWNLOAD UNLOCKED */}
          {checkoutStep === 'verified_success' && (
            <motion.div
              key="verified_success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-black text-white">Payment Verified!</h2>
                <p className="text-xs text-emerald-400 font-bold">
                  Your purchase is ready for instant download.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Order ID:</span>
                  <span className="font-mono font-bold text-slate-200">{activeOrder?.id || activeOrderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="font-bold text-yellow-400">₹{payableAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Authorized Google Email:</span>
                  <span className="font-mono text-emerald-400">{customerEmail}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleInstantDownload}
                  disabled={downloading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloading ? 'Streaming Deliverable...' : 'Download Digital Deliverable Package Now'}</span>
                </button>

                {onGoToDownloads && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onGoToDownloads();
                    }}
                    className="w-full py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                  >
                    Go to My Downloads Vault
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
