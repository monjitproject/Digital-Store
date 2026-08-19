import React, { useState } from 'react';
import { motion } from 'motion/react';
import { KeyRound, Lock, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AdminLoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onClose, onSuccess }) => {
  const { loginWithGoogle, ownerEmail } = useAuth();
  const [email, setEmail] = useState(ownerEmail || 'vmanjeet773@gmail.com');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const ok = await loginWithGoogle(email.trim(), 'Store Owner');
      if (ok) {
        onSuccess();
      } else {
        setErrorMsg('Sign-in failed. Please verify your Google email address.');
      }
    } catch (err) {
      setErrorMsg('Login request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-sm my-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-100 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-white">Store Owner Access</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-emerald-400" /> Owner Google Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. vmanjeet773@gmail.com"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-sm"
            />
            <p className="text-[10px] text-slate-500 mt-1">Configured owner: <code className="text-emerald-400">{ownerEmail || 'vmanjeet773@gmail.com'}</code></p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-[11px] text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-lime-600 hover:from-emerald-500 hover:to-lime-500 text-white font-extrabold text-xs shadow-lg transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In as Owner'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
