import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Smartphone, QrCode, CreditCard, Building2, CheckCircle2, AlertCircle, X, Lock } from 'lucide-react';
import { api } from '../services/api';

interface PaymentModalProps {
  paymentData: {
    orderId: string;
    merchantTransactionId: string;
    amount: number;
  };
  onClose: () => void;
  onPaymentSubmitted: (orderId: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ paymentData, onClose, onPaymentSubmitted }) => {
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'upi' | 'qr' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCompletePayment = async (shouldSucceed: boolean) => {
    setIsProcessing(true);
    setErrorMsg('');

    try {
      const res = await api.completePayment(paymentData.orderId, shouldSucceed, selectedMethod.toUpperCase());
      if (res.success) {
        onPaymentSubmitted(paymentData.orderId);
      } else {
        setErrorMsg('Payment request was declined. Please check details and retry.');
      }
    } catch (err) {
      setErrorMsg('Failed to process payment gateway response.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md my-auto rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl overflow-hidden"
      >
        {/* Gateway Header */}
        <div className="p-4 bg-indigo-950/80 border-b border-indigo-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-base shadow-md">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                Secure Payment Gateway
                <span className="text-[9px] bg-emerald-500/30 text-emerald-300 font-extrabold px-1.5 py-0.5 rounded border border-emerald-400/30">
                  VERIFIED
                </span>
              </h3>
              <p className="text-[10px] text-indigo-300">Merchant: DigiVault Digital Store</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Order Summary Ribbon */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Order Reference ID</span>
            <span className="text-xs font-mono font-bold text-indigo-400">{paymentData.merchantTransactionId}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Amount Payable</span>
            <span className="text-xl font-extrabold text-emerald-400">₹{paymentData.amount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Payment Methods Tabs */}
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-bold">
            <button
              onClick={() => setSelectedMethod('upi')}
              className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                selectedMethod === 'upi' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              UPI App
            </button>

            <button
              onClick={() => setSelectedMethod('card')}
              className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                selectedMethod === 'card' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Card
            </button>

            <button
              onClick={() => setSelectedMethod('qr')}
              className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                selectedMethod === 'qr' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <QrCode className="w-4 h-4" />
              UPI QR
            </button>

            <button
              onClick={() => setSelectedMethod('netbanking')}
              className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                selectedMethod === 'netbanking' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              NetBank
            </button>
          </div>

          {/* Method Content */}
          {selectedMethod === 'upi' && (
            <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                <span>Direct UPI Authorization</span>
                <span className="text-emerald-400 text-[10px]">Instant Download Unlock</span>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Enter UPI VPA / ID (Optional)</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="username@upi"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {selectedMethod === 'card' && (
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3 text-xs text-slate-300">
              <p className="font-semibold text-indigo-300">Credit / Debit Card Payment</p>
              <p className="text-slate-400">
                Supports Visa, Mastercard, RuPay, and American Express with 256-bit encryption.
              </p>
            </div>
          )}

          {selectedMethod === 'qr' && (
            <div className="text-center p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
              <p className="text-xs font-bold text-slate-300">Scan QR with any UPI Payment App</p>
              <div className="w-36 h-36 mx-auto bg-white p-2 rounded-2xl flex items-center justify-center shadow-md">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=digivault@bank%26pn=DigiVault%26am=${paymentData.amount}%26tr=${paymentData.merchantTransactionId}`}
                  alt="UPI QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-[11px] text-slate-400">Scan to authorize ₹{paymentData.amount}</p>
            </div>
          )}

          {selectedMethod === 'netbanking' && (
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3 text-xs text-slate-300">
              <p className="font-semibold text-indigo-300">NetBanking Transfer</p>
              <p className="text-slate-400">
                Direct bank portal checkout with instant confirmation.
              </p>
            </div>
          )}

          {/* Error notice */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => handleCompletePayment(true)}
              disabled={isProcessing}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              {isProcessing ? 'Verifying Transaction...' : `Complete Payment (₹${paymentData.amount.toLocaleString('en-IN')})`}
            </button>

            <button
              onClick={() => handleCompletePayment(false)}
              disabled={isProcessing}
              className="w-full py-2 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors"
            >
              Cancel Payment
            </button>
          </div>

          <div className="text-center text-[10px] text-slate-500 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-indigo-400" /> 256-Bit Encrypted Secure Checkout
          </div>
        </div>
      </motion.div>
    </div>
  );
};
