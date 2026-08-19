import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileArchive,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  Layers,
  RotateCcw,
  Loader2,
  Trash2,
  FileCheck,
} from 'lucide-react';
import { Item, ItemType } from '../../types';
import { api } from '../../services/api';

interface AdminItemModalProps {
  isOpen: boolean;
  itemType: ItemType;
  editingItem: Item | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

type UploadState = 'IDLE' | 'UPLOADING' | 'COMPLETED' | 'FAILED';

export const AdminItemModal: React.FC<AdminItemModalProps> = ({
  isOpen,
  itemType,
  editingItem,
  onClose,
  onSaved,
}) => {
  if (!isOpen) return null;

  const draftKey = `digivault_item_draft_${itemType}`;

  // Form states
  const [formTitle, setFormTitle] = useState(editingItem?.title || '');
  const [formShortDesc, setFormShortDesc] = useState(editingItem?.shortDescription || '');
  const [formDesc, setFormDesc] = useState(editingItem?.description || '');
  const [formCategory, setFormCategory] = useState(
    editingItem?.category || (itemType === 'course' ? 'Masterclass' : itemType === 'theme' ? 'Web Templates' : 'UI Kit')
  );
  const [formTags, setFormTags] = useState(editingItem?.tags?.join(', ') || '');
  const [formCover, setFormCover] = useState(
    editingItem?.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'
  );
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(formCover);

  const [formRegularPrice, setFormRegularPrice] = useState<number>(editingItem?.mrp || 1999);
  const [formSalePrice, setFormSalePrice] = useState<number>(editingItem?.finalPrice || 999);
  const [formFileName, setFormFileName] = useState(editingItem?.downloadFileName || `${itemType}-package.zip`);
  const [formFileSize, setFormFileSize] = useState(editingItem?.downloadFileSize || '15 MB');
  const [formVersion, setFormVersion] = useState(editingItem?.version || '1.0.0');
  const [formFeatures, setFormFeatures] = useState(
    editingItem?.keyFeatures?.join('\n') || 'Instant Protected Access\nComplete Production Code\nLifetime License Updates'
  );

  // Course Specific
  const [formInstructor, setFormInstructor] = useState(editingItem?.instructor || 'Store Instructor');
  const [formDuration, setFormDuration] = useState(editingItem?.duration || '6.5 Hours');
  const [formPreviewVideo, setFormPreviewVideo] = useState(editingItem?.previewVideoUrl || '');

  // Theme Specific
  const [formLiveDemoUrl, setFormLiveDemoUrl] = useState(editingItem?.liveDemoUrl || '');
  const [formDocUrl, setFormDocUrl] = useState(editingItem?.documentationUrl || '');
  const [formFramework, setFormFramework] = useState(editingItem?.framework || 'React / Tailwind / Next.js');

  // Upload progress states
  const [coverUploadState, setCoverUploadState] = useState<UploadState>('IDLE');
  const [coverProgress, setCoverProgress] = useState(0);

  const [packageUploadState, setPackageUploadState] = useState<UploadState>(editingItem ? 'COMPLETED' : 'IDLE');
  const [packageProgress, setPackageProgress] = useState(0);
  const [packageUploadInfo, setPackageUploadInfo] = useState<{ loadedStr: string; totalStr: string; speedMbps: number } | null>(null);
  const [packageError, setPackageError] = useState('');

  // Saving / Publishing states
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'PUBLISHING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  const [hasDraftNotice, setHasDraftNotice] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check for local draft on mount (only if not editing an existing item)
  useEffect(() => {
    if (!editingItem) {
      try {
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed.title && parsed.title.trim()) {
            setHasDraftNotice(true);
          }
        }
      } catch {}
    }
  }, [editingItem, draftKey]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (coverPreviewUrl && coverPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [coverPreviewUrl]);

  const restoreDraft = () => {
    try {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const p = JSON.parse(savedDraft);
        if (p.title) setFormTitle(p.title);
        if (p.shortDesc) setFormShortDesc(p.shortDesc);
        if (p.desc) setFormDesc(p.desc);
        if (p.category) setFormCategory(p.category);
        if (p.tags) setFormTags(p.tags);
        if (p.mrp) setFormRegularPrice(Number(p.mrp));
        if (p.salePrice) setFormSalePrice(Number(p.salePrice));
        if (p.cover) {
          setFormCover(p.cover);
          setCoverPreviewUrl(p.cover);
        }
        if (p.features) setFormFeatures(p.features);
      }
    } catch {}
    setHasDraftNotice(false);
  };

  const discardDraft = () => {
    localStorage.removeItem(draftKey);
    setHasDraftNotice(false);
  };

  // Save lightweight form draft on change
  useEffect(() => {
    if (!editingItem && formTitle.trim()) {
      const draftData = {
        title: formTitle,
        shortDesc: formShortDesc,
        desc: formDesc,
        category: formCategory,
        tags: formTags,
        mrp: formRegularPrice,
        salePrice: formSalePrice,
        cover: formCover,
        features: formFeatures,
      };
      try {
        localStorage.setItem(draftKey, JSON.stringify(draftData));
      } catch {}
    }
  }, [formTitle, formShortDesc, formDesc, formCategory, formTags, formRegularPrice, formSalePrice, formCover, formFeatures, editingItem, draftKey]);

  // Dynamic Discount Calculation
  const calculatedDiscount =
    formRegularPrice > 0 && formSalePrice <= formRegularPrice
      ? Math.max(0, Math.round(((formRegularPrice - formSalePrice) / formRegularPrice) * 100))
      : 0;

  // Optimized Cover Image Upload (Offscreen Canvas downscale + WebP compression)
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview
    if (coverPreviewUrl && coverPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(coverPreviewUrl);
    }
    const blobUrl = URL.createObjectURL(file);
    setCoverPreviewUrl(blobUrl);
    setCoverUploadState('UPLOADING');
    setCoverProgress(10);

    try {
      // Offscreen canvas compression if image > 1200px
      const imageBitmap = await createImageBitmap(file);
      const maxDim = 1200;
      let targetWidth = imageBitmap.width;
      let targetHeight = imageBitmap.height;

      if (targetWidth > maxDim || targetHeight > maxDim) {
        if (targetWidth > targetHeight) {
          targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
          targetWidth = maxDim;
        } else {
          targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
          targetHeight = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
      }

      const uploadBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob || file),
          'image/webp',
          0.88
        );
      });

      setCoverProgress(40);

      const safeName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
      const res = await api.uploadBinary(uploadBlob, {
        filename: safeName,
        isPublic: true,
        onProgress: (pct) => setCoverProgress(40 + Math.round(pct * 0.6)),
      });

      if (res.success && res.url) {
        setFormCover(res.url);
        setCoverPreviewUrl(res.url);
        setCoverUploadState('COMPLETED');
      } else {
        throw new Error(res.message || 'Image upload failed');
      }
    } catch (err: any) {
      console.error('Cover upload error:', err);
      setCoverUploadState('FAILED');
      setErrorMessage('Image upload failed: ' + (err.message || 'Unknown error'));
    }
  };

  // Deliverable Package Streaming Upload with true progress
  const handleDeliverableUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPackageUploadState('UPLOADING');
    setPackageProgress(0);
    setPackageError('');
    setErrorMessage('');

    abortControllerRef.current = new AbortController();

    try {
      const res = await api.uploadBinary(file, {
        filename: file.name,
        isPublic: false,
        signal: abortControllerRef.current.signal,
        onProgress: (pct, loaded, total, speed) => {
          setPackageProgress(pct);
          setPackageUploadInfo({
            loadedStr: (loaded / (1024 * 1024)).toFixed(1) + ' MB',
            totalStr: (total / (1024 * 1024)).toFixed(1) + ' MB',
            speedMbps: speed,
          });
        },
      });

      if (res.success && res.filename) {
        setFormFileName(res.filename);
        setFormFileSize(res.filesize || `${(file.size / (1024 * 1024)).toFixed(1)} MB`);
        setPackageUploadState('COMPLETED');
      } else {
        throw new Error(res.message || 'Failed to upload deliverable file to vault');
      }
    } catch (err: any) {
      console.error('Package upload error:', err);
      setPackageUploadState('FAILED');
      setPackageError(err.message || 'Upload error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Safe Non-Blocking Publish Workflow
  const handleSave = async (e: React.FormEvent, status: 'draft' | 'published') => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setErrorMessage('Please enter a product title.');
      return;
    }
    if (formRegularPrice <= 0) {
      setErrorMessage('Regular price must be greater than 0.');
      return;
    }
    if (packageUploadState === 'UPLOADING') {
      setErrorMessage('Please wait for the deliverable package upload to complete.');
      return;
    }

    setIsSaving(true);
    setSaveStatus('PUBLISHING');
    setErrorMessage('');

    // 15 second client timeout safety
    const timeoutPromise = new Promise<{ success: boolean; message: string }>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out. Please try again.')), 15000)
    );

    try {
      const featuresArray = formFeatures
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      const payload: Partial<Item> = {
        type: itemType,
        title: formTitle.trim(),
        shortDescription: formShortDesc.trim(),
        description: formDesc.trim(),
        category: formCategory.trim() || 'General',
        tags: formTags.split(',').map((t) => t.trim()).filter(Boolean),
        coverImage: formCover.trim(),
        previewMedia: [formCover.trim()],
        mrp: formRegularPrice,
        salePrice: formSalePrice,
        finalPrice: formSalePrice > 0 ? formSalePrice : formRegularPrice,
        discountPercent: calculatedDiscount,
        status,
        downloadFileName: formFileName.trim(),
        downloadFileSize: formFileSize.trim(),
        version: formVersion.trim(),
        keyFeatures: featuresArray,
      };

      if (itemType === 'course') {
        payload.instructor = formInstructor;
        payload.duration = formDuration;
        payload.previewVideoUrl = formPreviewVideo;
      } else if (itemType === 'theme') {
        payload.liveDemoUrl = formLiveDemoUrl;
        payload.documentationUrl = formDocUrl;
        payload.framework = formFramework;
      }

      let savePromise: Promise<any>;
      if (editingItem) {
        savePromise = api.updateItem(editingItem.id, payload);
      } else {
        savePromise = api.createItem(payload);
      }

      const res = await Promise.race([savePromise, timeoutPromise]);

      if (res && res.success) {
        setSaveStatus('SUCCESS');
        localStorage.removeItem(draftKey);
        await onSaved();
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        throw new Error(res?.message || 'Failed to save product to database');
      }
    } catch (err: any) {
      console.error('Save item error:', err);
      setSaveStatus('ERROR');
      setErrorMessage(err.message || 'Failed to publish item.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 my-8 max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-white">
              {editingItem ? 'Edit' : 'Publish New'}{' '}
              {itemType === 'product' ? 'Digital Product' : itemType === 'course' ? 'Online Course' : 'Website Theme'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure product details, live preview media, pricing, and protected vault package.
            </p>
          </div>
        </div>

        {/* Draft Notice */}
        <AnimatePresence>
          {hasDraftNotice && (
            <motion.div
              key="draft-notice"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2 text-amber-300">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Found an unsaved draft for this item.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={restoreDraft}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 text-[11px]"
                >
                  Restore Draft
                </button>
                <button
                  type="button"
                  onClick={discardDraft}
                  className="px-2 py-1 text-slate-400 hover:text-slate-200 text-[11px]"
                >
                  Discard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Notice */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={(e) => handleSave(e, 'published')} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">Product Title *</label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Modern Fast Next.js SaaS Starter Template"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
              <input
                type="text"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="Web Templates / UI Kits / Masterclass"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Tags (Comma Separated)</label>
              <input
                type="text"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                placeholder="React, Next.js, Tailwind, SEO"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* Pricing Section */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Regular MRP (₹) *</label>
              <input
                type="number"
                required
                min={1}
                value={formRegularPrice}
                onChange={(e) => setFormRegularPrice(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">Customer Sale Price (₹) *</label>
                <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                  {calculatedDiscount}% OFF
                </span>
              </div>
              <input
                type="number"
                required
                min={1}
                value={formSalePrice}
                onChange={(e) => setFormSalePrice(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            {/* Cover Thumbnail with Instant Preview & Optimized Upload */}
            <div className="md:col-span-2 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  Cover Image & Thumbnail *
                </label>
                {coverUploadState === 'UPLOADING' && (
                  <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Uploading & compressing ({coverProgress}%)...
                  </span>
                )}
                {coverUploadState === 'COMPLETED' && (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Image optimized & stored
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4">
                <img
                  src={coverPreviewUrl}
                  alt="Thumbnail Preview"
                  className="w-20 h-20 rounded-2xl object-cover border border-slate-700 bg-slate-950 shrink-0 shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
                  }}
                />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formCover}
                      onChange={(e) => {
                        setFormCover(e.target.value);
                        setCoverPreviewUrl(e.target.value);
                      }}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    />
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={coverUploadState === 'UPLOADING'}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 shrink-0 transition-colors flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>{coverUploadState === 'UPLOADING' ? 'Uploading...' : 'Browse Image'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Supports JPG, PNG, WebP. Automatically optimized for lightning-fast catalog loading.
                  </p>
                </div>
              </div>
            </div>

            {/* Short Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">Short Description (1-liner)</label>
              <input
                type="text"
                value={formShortDesc}
                onChange={(e) => setFormShortDesc(e.target.value)}
                placeholder="High-converting website theme with 10+ pre-built landing sections."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* Full Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">Full Description *</label>
              <textarea
                rows={3}
                required
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Detailed breakdown of features, setup instructions, and deliverables..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* Vault Protected Deliverable Package Upload */}
            <div className="md:col-span-2 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                  <FileArchive className="w-4 h-4 text-emerald-400" />
                  Protected Vault Deliverable File (ZIP / RAR / PDF)
                </h4>
                {packageUploadState === 'COMPLETED' && (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ready in Vault ({formFileSize})
                  </span>
                )}
              </div>

              {/* Upload Progress Bar */}
              {packageUploadState === 'UPLOADING' && (
                <div className="space-y-1.5 bg-slate-900/80 p-3 rounded-xl border border-emerald-500/30">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" /> Uploading to Secure Vault...
                    </span>
                    <span>{packageProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-150 rounded-full"
                      style={{ width: `${packageProgress}%` }}
                    />
                  </div>
                  {packageUploadInfo && (
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{packageUploadInfo.loadedStr} / {packageUploadInfo.totalStr}</span>
                      <span>{packageUploadInfo.speedMbps} MB/s</span>
                    </div>
                  )}
                </div>
              )}

              {packageError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 flex items-center justify-between">
                  <span>{packageError}</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold underline hover:text-white"
                  >
                    Retry
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Deliverable Filename</label>
                  <input
                    type="text"
                    value={formFileName}
                    onChange={(e) => setFormFileName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">File Size</label>
                  <input
                    type="text"
                    value={formFileSize}
                    onChange={(e) => setFormFileSize(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,.rar,.pdf,.tar,.gz,.7z"
                onChange={handleDeliverableUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={packageUploadState === 'UPLOADING'}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-dashed border-emerald-500/40 text-xs font-bold text-emerald-300 flex items-center justify-center gap-2 cursor-pointer transition-all hover:border-emerald-400"
              >
                <Upload className="w-4 h-4" />
                <span>
                  {packageUploadState === 'UPLOADING'
                    ? 'Uploading Deliverable...'
                    : packageUploadState === 'COMPLETED'
                    ? 'Replace Deliverable Package (.zip / .rar / .pdf)'
                    : 'Upload Deliverable Package (.zip / .rar / .pdf)'}
                </span>
              </button>
            </div>

            {/* Specific Fields for Theme */}
            {itemType === 'theme' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Live Demo Preview URL</label>
                  <input
                    type="url"
                    value={formLiveDemoUrl}
                    onChange={(e) => setFormLiveDemoUrl(e.target.value)}
                    placeholder="https://example.com/demo"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Documentation URL</label>
                  <input
                    type="url"
                    value={formDocUrl}
                    onChange={(e) => setFormDocUrl(e.target.value)}
                    placeholder="https://example.com/docs"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </>
            )}

            {/* Specific Fields for Course */}
            {itemType === 'course' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Instructor Name</label>
                  <input
                    type="text"
                    value={formInstructor}
                    onChange={(e) => setFormInstructor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Course Duration</label>
                  <input
                    type="text"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </>
            )}

            {/* Key Features */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">Key Features (One per line)</label>
              <textarea
                rows={3}
                value={formFeatures}
                onChange={(e) => setFormFeatures(e.target.value)}
                placeholder="Instant Download Deliverable\nFull TypeScript Code\nLifetime License Updates"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={(e) => handleSave(e, 'draft')}
              disabled={isSaving || packageUploadState === 'UPLOADING'}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors disabled:opacity-50"
            >
              Save Draft
            </button>

            <button
              type="button"
              onClick={(e) => handleSave(e, 'published')}
              disabled={isSaving || packageUploadState === 'UPLOADING'}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : saveStatus === 'SUCCESS' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Published ✓</span>
                </>
              ) : packageUploadState === 'UPLOADING' ? (
                <span>Uploading ({packageProgress}%)...</span>
              ) : (
                <span>Publish to Store</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
