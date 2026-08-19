import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ShieldCheck, Download, AlertCircle, ArrowLeft, RefreshCw, FileText, Smartphone, CheckCircle, Mail } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface CheckoutStatusViewProps {
  orderId: string;
  onBackToStore: () => void;
}

export const CheckoutStatusView: React.FC<CheckoutStatusViewProps> = ({ orderId, onBackToStore }) => {
  const { user, refreshUserData } = useAuth();
  const customerEmail = user?.email;
  const [orderState, setOrderState] = useState<{
    status: 'PENDING' | 'PAID' | 'FAILED';
    itemTitle: string;
    itemType: string;
    amount: number;
    merchantTransactionId: string;
    paymentDetails?: any;
    paidAt?: string;
  } | null>(null);

  const [isVerifying, setIsVerifying] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState('');

  // Poll Payment Status API every 1.5 seconds until PAID or FAILED
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const res = await api.checkOrderStatus(orderId);
        if (res.success) {
          setOrderState({
            status: res.status,
            itemTitle: res.itemTitle,
            itemType: res.itemType,
            amount: res.amount,
            merchantTransactionId: res.merchantTransactionId,
            paymentDetails: res.paymentDetails,
            paidAt: res.paidAt,
          });

          if (res.status === 'PAID') {
            setIsVerifying(false);
            // Trigger celebration confetti
            try {
              confetti({
                particleCount: 120,
                spread: 70,
                origin: { y: 0.6 },
              });
            } catch (e) {
              // Fallback
            }
            refreshUserData();
            return;
          }

          if (res.status === 'FAILED') {
            setIsVerifying(false);
            return;
          }
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }

      attempts++;
      if (attempts < 20) {
        timer = setTimeout(checkStatus, 1500);
      } else {
        setIsVerifying(false);
      }
    };

    checkStatus();

    return () => clearTimeout(timer);
  }, [orderId]);

  const handleDownloadDeliverable = async () => {
    setDownloading(true);
    setDownloadError('');
    setDownloadSuccessMsg('');

    try {
      const res = await api.generateDownloadToken(orderId, customerEmail);
      if (res.success && res.downloadUrl) {
        // Trigger browser download via signed endpoint
        const link = document.createElement('a');
        link.href = res.downloadUrl;
        link.setAttribute('download', res.filename || 'deliverable.zip');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setDownloadSuccessMsg(`Download initiated! (${res.filename} - ${res.filesize})`);
      } else {
        setDownloadError(res.message || 'Unable to generate download token. Please verify purchase in your account.');
      }
    } catch (err) {
      setDownloadError('Server communication error during file stream initialization.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-slate-100 text-center space-y-6"
      >
        {/* Verification Loading State */}
        {isVerifying && (
          <div className="py-12 space-y-5">
            <div className="w-16 h-16 mx-auto rounded-full bg-indigo-500/20 border-2 border-indigo-500 border-t-transparent animate-spin flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Verifying Payment Status...</h2>
              <p className="text-xs text-slate-400">
                Connecting to payment gateway verification server. Please do not close or refresh this tab.
              </p>
            </div>
          </div>
        )}

        {/* Success Screen (Paid & Verified) */}
        {!isVerifying && orderState?.status === 'PAID' && (
          <div className="space-y-6">
            {/* Animated Draw-in SVG Checkmark */}
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
              >
                <CheckCircle className="w-12 h-12 text-emerald-400" />
              </motion.div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Payment Verified & Confirmed
              </span>
              <h2 className="text-2xl font-black text-white">Payment Successful!</h2>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Your payment transaction is verified. Your digital deliverable is unlocked and ready for download.
              </p>
            </div>

            {/* Order Invoice Summary */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-800 pb-2 font-semibold">
                <span className="text-slate-400">Digital Item</span>
                <span className="text-slate-100 font-bold">{orderState.itemTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Merchant Txn ID</span>
                <span className="font-mono text-indigo-400">{orderState.merchantTransactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction ID</span>
                <span className="font-mono text-slate-300">
                  {orderState.paymentDetails?.transactionId || 'TXN_' + orderId}
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-2 border-t border-slate-800">
                <span className="text-slate-300">Total Paid</span>
                <span className="text-emerald-400">₹{orderState.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Email Backup Notice */}
            <div className="p-3 rounded-xl bg-indigo-950/50 border border-indigo-800/60 text-xs text-indigo-200 flex items-center justify-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Invoice receipt & backup download link sent to your registered email.</span>
            </div>

            {/* Download Deliverable Action */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleDownloadDeliverable}
                disabled={downloading}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-extrabold text-base shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                <Download className="w-5 h-5 text-white" />
                {downloading ? 'Generating Signed Token...' : 'Download Deliverable Package Now'}
              </button>

              {downloadSuccessMsg && (
                <p className="text-xs text-emerald-400 font-semibold">{downloadSuccessMsg}</p>
              )}
              {downloadError && (
                <p className="text-xs text-rose-400 font-semibold">{downloadError}</p>
              )}

              <button
                onClick={onBackToStore}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors pt-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Store Catalog
              </button>
            </div>
          </div>
        )}

        {/* Failed Screen */}
        {!isVerifying && orderState?.status === 'FAILED' && (
          <div className="space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Payment Failed or Declined</h2>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Unable to confirm this transaction. No funds were debited or the authorization was declined.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300">
              Digital files remain securely locked. Please try again with a valid UPI / Card method.
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={onBackToStore}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
              >
                Return to Store Catalog
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
