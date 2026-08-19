import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  MessageCircle,
  QrCode,
  Lock,
  Save,
  Upload,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  Sparkles,
  ExternalLink,
  Store,
} from 'lucide-react';
import { StoreSettings } from '../../types';
import { api } from '../../services/api';

interface AdminSettingsTabProps {
  ownerEmail?: string;
  onSettingsUpdated?: (settings: StoreSettings) => void;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({ ownerEmail, onSettingsUpdated }) => {
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'DigiVault Marketplace',
    storeTagline: 'Premium Digital Products, Courses & Themes',
    storeLogo: '',
    storeDescription: 'Direct owner-verified digital marketplace for world-class web templates, UI kits, masterclasses, and code assets.',
    ownerEmail: ownerEmail || 'vmanjeet773@gmail.com',
    whatsappNumber: '+919876543210',
    whatsappBuyLink: 'https://wa.me/919876543210',
    phonepeQrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=vmanjeet773@ybl%26pn=DigiVault%26cu=INR',
    upiId: 'vmanjeet773@ybl',
    paymentInstructions: 'Scan the PhonePe QR code with PhonePe, GPay, Paytm, or any UPI app, complete payment, and submit your 12-digit UTR/Transaction ID with screenshot.',
    downloadExpiryMinutes: 60,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const qrFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.getSettings();
      if (res.success && res.settings) {
        setSettings(res.settings);
      }
    } catch (err: any) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (PNG, JPG, JPEG, WebP).');
      return;
    }

    setUploadingQr(true);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const fileData = reader.result as string;
        const uploadRes = await api.uploadFile(file.name, fileData, true);
        if (uploadRes.success && uploadRes.url) {
          setSettings((prev) => ({
            ...prev,
            phonepeQrCodeUrl: uploadRes.dataUrl || uploadRes.url,
          }));
        } else {
          // Fallback to data url directly
          setSettings((prev) => ({
            ...prev,
            phonepeQrCodeUrl: fileData,
          }));
        }
      } catch (err: any) {
        setErrorMsg('Failed to process QR code image.');
      } finally {
        setUploadingQr(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSaveSuccess(false);

    try {
      const res = await api.updateSettings(settings);
      if (res.success && res.settings) {
        setSettings(res.settings);
        setSaveSuccess(true);
        if (onSettingsUpdated) onSettingsUpdated(res.settings);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error(res.message || 'Failed to update settings');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-500">Loading store settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-400" />
          Store & Payment Gateway Settings
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure your WhatsApp instant purchase contact, PhonePe UPI QR code image, and digital deliverable download rules.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-bold">Settings saved successfully! Updated configuration is live across the store.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: STORE BRANDING */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-400" />
            Store Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Store Name</label>
              <input
                type="text"
                required
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Store Tagline</label>
              <input
                type="text"
                value={settings.storeTagline}
                onChange={(e) => setSettings({ ...settings, storeTagline: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">Store Owner Google Email</label>
              <input
                type="text"
                disabled
                value={settings.ownerEmail || ownerEmail || 'vmanjeet773@gmail.com'}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">Configured for Google Authentication admin access.</p>
            </div>
          </div>
        </div>

        {/* SECTION 2: WHATSAPP DIRECT PURCHASE */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/30 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              WhatsApp Checkout Configuration
            </h3>
            <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
              Active on Checkout
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">WhatsApp Business Number *</label>
              <input
                type="text"
                required
                value={settings.whatsappNumber}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                placeholder="+919876543210"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
              />
              <p className="text-[10px] text-slate-500 mt-1">Include country code (e.g. +91 for India).</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">WhatsApp Buy Link *</label>
              <input
                type="url"
                required
                value={settings.whatsappBuyLink}
                onChange={(e) => setSettings({ ...settings, whatsappBuyLink: e.target.value })}
                placeholder="https://wa.me/919876543210"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
              />
              <p className="text-[10px] text-slate-500 mt-1">Direct wa.me link clicked by customers.</p>
            </div>
          </div>
        </div>

        {/* SECTION 3: PHONEPE UPI QR CODE */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-purple-500/30 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <QrCode className="w-4 h-4 text-purple-400" />
              PhonePe & UPI QR Code Configuration
            </h3>
            <span className="text-[10px] uppercase font-bold text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
              Manual Verification
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">UPI ID (VPA) *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={settings.upiId}
                    onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                    placeholder="vmanjeet773@ybl"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-400"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(settings.upiId)}
                    className="px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Your registered PhonePe / BHIM UPI ID.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Upload Your Custom PhonePe QR Code</label>
                <input
                  ref={qrFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleQrUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => qrFileInputRef.current?.click()}
                  disabled={uploadingQr}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-dashed border-purple-500/50 hover:border-purple-400 text-xs font-bold text-purple-300 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploadingQr ? 'Uploading QR Code...' : 'Upload PhonePe QR Image'}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Or QR Code Image URL</label>
                <input
                  type="url"
                  value={settings.phonepeQrCodeUrl}
                  onChange={(e) => setSettings({ ...settings, phonepeQrCodeUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Live QR Preview */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Customer Preview</span>
              <div className="p-3 bg-white rounded-2xl shadow-xl">
                <img
                  src={settings.phonepeQrCodeUrl || 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=DigiVault'}
                  alt="PhonePe QR Preview"
                  className="w-36 h-36 object-contain rounded-lg"
                />
              </div>
              <span className="text-xs font-mono text-purple-300 font-bold">{settings.upiId}</span>
            </div>
          </div>
        </div>

        {/* SECTION 4: PAYMENT INSTRUCTIONS & TOKEN EXPIRY */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-yellow-400" />
            Instructions & Download Token Security
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Checkout Payment Instructions</label>
              <textarea
                rows={2}
                value={settings.paymentInstructions}
                onChange={(e) => setSettings({ ...settings, paymentInstructions: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Signed Download Token Validity (Minutes)
                </label>
                <input
                  type="number"
                  min={5}
                  max={1440}
                  value={settings.downloadExpiryMinutes}
                  onChange={(e) => setSettings({ ...settings, downloadExpiryMinutes: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-slate-500 mt-1">Short-lived tokens prevent unauthorized link sharing.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Vault Deliverables Security:</span>
                  <span className="text-emerald-400 font-bold">Protected / Restricted</span>
                </div>
                <div className="flex justify-between">
                  <span>Verification Policy:</span>
                  <span className="text-amber-400 font-bold">Owner Signed Only</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/20 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Settings...' : 'Save & Publish Store Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
