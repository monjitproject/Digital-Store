import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Item, CustomerReview } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  X,
  Star,
  CheckCircle2,
  ExternalLink,
  Play,
  FileArchive,
  Lock,
  Tag,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Download,
  ShoppingCart,
  Sparkles,
  Plus,
  Check,
  GraduationCap,
  Package,
} from 'lucide-react';

interface ItemDetailModalProps {
  item: Item | null;
  onClose: () => void;
  onBuyNow: (item: Item) => void;
  onOpenAuthModal?: () => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, onClose, onBuyNow, onOpenAuthModal }) => {
  if (!item) return null;

  const { addToCart, isAuthenticated } = useAuth();
  const [selectedMediaIdx, setSelectedMediaIdx] = useState(0);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(
    item.curriculum && item.curriculum.length > 0 ? item.curriculum[0].id : null
  );
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [addedAnimation, setAddedAnimation] = useState(false);

  useEffect(() => {
    if (item) {
      api.getReviews(item.id).then((res) => {
        if (res.success) setReviews(res.reviews);
      });
    }
  }, [item]);

  const handleAddToCart = async () => {
    if (!isAuthenticated && onOpenAuthModal) {
      onOpenAuthModal();
      return;
    }
    const success = await addToCart(item.id);
    if (success) {
      setAddedAnimation(true);
      setTimeout(() => setAddedAnimation(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl max-h-[90vh] flex flex-col my-auto rounded-3xl bg-slate-900 border border-slate-700/80 text-slate-100 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900/95 sticky top-0 z-20">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider shrink-0">
                {item.type}
              </span>
              <h2 className="text-base sm:text-lg font-black text-white truncate">{item.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Media & Item Information */}
            <div className="lg:col-span-7 space-y-6">
              {/* Media Preview Box */}
              <div className="space-y-3">
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner">
                  {previewVideoUrl ? (
                    <iframe
                      src={previewVideoUrl}
                      title="Lesson Preview"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <img
                      src={item.previewMedia[selectedMediaIdx] || item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {previewVideoUrl && (
                    <button
                      onClick={() => setPreviewVideoUrl(null)}
                      className="absolute top-3 right-3 px-3 py-1 rounded-lg bg-slate-900/90 text-xs text-white border border-slate-700 cursor-pointer"
                    >
                      Close Video Preview
                    </button>
                  )}
                </div>

                {/* Thumbnail gallery */}
                {item.previewMedia.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {item.previewMedia.map((media, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedMediaIdx(idx);
                          setPreviewVideoUrl(null);
                        }}
                        className={`w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                          selectedMediaIdx === idx && !previewVideoUrl
                            ? 'border-emerald-500 scale-105'
                            : 'border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={media} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Theme Live Demo Button */}
              {item.type === 'theme' && item.liveDemoUrl && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-300">Live Website Theme Demo</h4>
                    <p className="text-[11px] text-slate-400">Test all responsive layouts and interactive pages live</p>
                  </div>
                  <a
                    href={item.liveDemoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Live Demo
                  </a>
                </div>
              )}

              {/* Course Curriculum Accordion */}
              {item.type === 'course' && item.curriculum && item.curriculum.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Play className="w-4 h-4 text-emerald-400" />
                    Course Curriculum & Free Lesson Previews
                  </h3>
                  <div className="space-y-2 border border-slate-800 rounded-2xl p-2 bg-slate-950/60">
                    {item.curriculum.map((mod) => (
                      <div key={mod.id} className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
                        <button
                          onClick={() => setActiveModuleId(activeModuleId === mod.id ? null : mod.id)}
                          className="w-full p-3 flex items-center justify-between text-xs font-bold text-slate-200 hover:bg-slate-800/50 transition-colors"
                        >
                          <span>{mod.title}</span>
                          {activeModuleId === mod.id ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </button>

                        {activeModuleId === mod.id && (
                          <div className="p-3 pt-0 space-y-2 border-t border-slate-800/60">
                            {mod.lessons.map((les) => (
                              <div
                                key={les.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 text-xs text-slate-300"
                              >
                                <span className="flex items-center gap-2">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  {les.title}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-500">{les.duration}</span>
                                  {les.isFreePreview ? (
                                    <button
                                      onClick={() =>
                                        setPreviewVideoUrl(les.videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ')
                                      }
                                      className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold hover:bg-emerald-500/30 cursor-pointer"
                                    >
                                      Watch Preview
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                                      <Lock className="w-3 h-3" /> Locked
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-200">About this Digital Asset</h3>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{item.description}</p>
              </div>

              {/* Key Features */}
              {item.keyFeatures && item.keyFeatures.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-200">Key Deliverable Highlights</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {item.keyFeatures.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Specifications */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Deliverable File</span>
                  <span className="font-bold text-slate-200 flex items-center gap-1">
                    <FileArchive className="w-3.5 h-3.5 text-emerald-400" />
                    {item.downloadFileName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Download Size</span>
                  <span className="font-bold text-slate-200">{item.downloadFileSize}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Access License</span>
                  <span className="font-bold text-emerald-400">Lifetime Unlimited</span>
                </div>
              </div>

              {/* Customer Reviews Section */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    Customer Reviews ({reviews.length})
                  </h3>
                </div>

                {reviews.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No reviews yet for this product. Verified buyers can submit a review from their customer portal.</p>
                ) : (
                  <div className="space-y-2">
                    {reviews.map((r) => (
                      <div key={r.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">{r.userName}</span>
                          <div className="flex items-center gap-0.5 text-amber-400">
                            {[...Array(r.rating)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-400">"{r.comment}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Checkout & Action Box */}
            <div className="lg:col-span-5 bg-slate-950/90 rounded-3xl p-6 border border-slate-800 flex flex-col justify-between space-y-6 h-fit">
              <div className="space-y-4">
                <div className="space-y-1 border-b border-slate-800 pb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Instant Access Deliverable</span>
                  <h3 className="text-xl font-black text-white">{item.title}</h3>
                  <div className="flex items-center gap-2.5 pt-2">
                    <span className="text-3xl font-black text-yellow-400">₹{item.finalPrice.toLocaleString('en-IN')}</span>
                    {item.mrp > item.finalPrice && (
                      <span className="text-sm text-slate-500 line-through">₹{item.mrp.toLocaleString('en-IN')}</span>
                    )}
                    {item.discountPercent > 0 && (
                      <span className="text-xs font-black text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                        {item.discountPercent}% OFF
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Instant signed file download after PhonePe verification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Stored permanently in your Customer Portal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Single-user commercial use license</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => onBuyNow(item)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-lime-500 to-yellow-400 hover:from-emerald-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-900/30 flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Buy Now with PhonePe</span>
                </button>

                <button
                  onClick={handleAddToCart}
                  className={`w-full py-3 px-4 rounded-2xl font-bold text-xs border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    addedAnimation
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                  }`}
                >
                  {addedAnimation ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4 text-emerald-400" />}
                  <span>{addedAnimation ? 'Added to Cart!' : 'Add to Cart'}</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
