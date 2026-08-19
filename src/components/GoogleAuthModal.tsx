import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, ShieldCheck, UserCheck, Sparkles, CheckCircle2, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface GoogleAuthModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  customTitle?: string;
  customSubtitle?: string;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  onClose,
  onSuccess,
  customTitle,
  customSubtitle,
}) => {
  const { loginWithGoogle, openGoogleOAuth, ownerEmail } = useAuth();
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDirectInput, setShowDirectInput] = useState(false);

  const handleQuickLogin = async (email: string, name: string) => {
    setIsSubmitting(true);
    const success = await loginWithGoogle(email, name);
    setIsSubmitting(false);
    if (success) {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customEmail.includes('@')) return;
    setIsSubmitting(true);
    const name = customName.trim() || customEmail.split('@')[0];
    const success = await loginWithGoogle(customEmail.trim(), name);
    setIsSubmitting(false);
    if (success) {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 overflow-hidden"
      >
        {/* Background ambient glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-yellow-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-yellow-400 via-lime-400 to-emerald-500 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <svg className="w-7 h-7" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
          </div>

          <h2 className="text-xl font-black text-white">
            {customTitle || 'Sign in to DigiVault'}
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {customSubtitle || 'Use your Google account to access downloads, manage purchases, and checkout.'}
          </p>
        </div>

        {/* Primary Action: Google OAuth Popup */}
        <div className="space-y-3">
          <button
            onClick={openGoogleOAuth}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-bold text-sm shadow-xl shadow-white/5 active:scale-[0.98] transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative py-2 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <span className="relative bg-slate-900 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Or Choose Account
            </span>
          </div>

          {/* Quick Select for Testing / Preview */}
          <div className="grid grid-cols-1 gap-2.5">
            {/* Store Owner Quick Select */}
            <button
              onClick={() => handleQuickLogin(ownerEmail || 'vmanjeet773@gmail.com', 'Store Owner (Admin)')}
              disabled={isSubmitting}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-md">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-amber-300">Sign in as Store Owner</span>
                    <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-black">ADMIN</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">{ownerEmail || 'vmanjeet773@gmail.com'}</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 opacity-70 group-hover:translate-x-1 transition-all" />
            </button>

            {/* Customer Quick Select */}
            <button
              onClick={() => handleQuickLogin('customer@example.com', 'Valued Customer')}
              disabled={isSubmitting}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700 hover:bg-slate-800 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-xs">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-200">Sign in as Customer</span>
                    <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded font-bold">BUYER</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">customer@example.com</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 opacity-70 group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          {/* Toggle Direct Email Entry */}
          <div className="pt-2">
            {!showDirectInput ? (
              <button
                onClick={() => setShowDirectInput(true)}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-200 underline decoration-slate-600 transition-colors"
              >
                Sign in with custom Google / Gmail address
              </button>
            ) : (
              <form onSubmit={handleCustomSubmit} className="space-y-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Your Google / Gmail Email</label>
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Your Full Name (Optional)</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Alex Sharma"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-500 hover:to-lime-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Authenticating...' : 'Sign In Now'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Security Footer Notice */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <Lock className="w-3.5 h-3.5 text-emerald-500" />
          <span>Server-verified session & authenticated downloads.</span>
        </div>
      </motion.div>
    </div>
  );
};
