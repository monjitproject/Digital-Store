import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Item } from '../types';
import { Star, Eye, ShoppingCart, ExternalLink, Play, FileArchive, GraduationCap, Package, Sparkles, Plus, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ItemCardProps {
  item: Item;
  onPreview: (item: Item) => void;
  onBuyNow: (item: Item) => void;
  onOpenAuthModal?: () => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onPreview, onBuyNow, onOpenAuthModal }) => {
  const { addToCart, isAuthenticated } = useAuth();
  const [addedAnimation, setAddedAnimation] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const getTypeBadge = () => {
    switch (item.type) {
      case 'product':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-yellow-100/90 dark:bg-yellow-950/90 text-yellow-900 dark:text-yellow-300 border border-yellow-300/90 dark:border-yellow-700/80 backdrop-blur-md shadow-xs">
            <Package className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Digital Product
          </span>
        );
      case 'course':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100/90 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-300 border border-emerald-300/90 dark:border-emerald-700/80 backdrop-blur-md shadow-xs">
            <GraduationCap className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Video Course
          </span>
        );
      case 'theme':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-lime-100/90 dark:bg-lime-950/90 text-lime-950 dark:text-lime-300 border border-lime-300/90 dark:border-lime-700/80 backdrop-blur-md shadow-xs">
            <FileArchive className="w-3 h-3 text-lime-700 dark:text-lime-400" /> Website Theme
          </span>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className="group relative flex flex-col rounded-3xl bg-white/95 dark:bg-slate-900 border border-yellow-200/90 dark:border-emerald-900/60 hover:border-lime-400 dark:hover:border-emerald-500 overflow-hidden shadow-md hover:shadow-2xl hover:shadow-lime-500/20 transition-all duration-300"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950 cursor-pointer" onClick={() => onPreview(item)}>
        <motion.img
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.5 }}
          src={item.coverImage}
          alt={item.title}
          className="w-full h-full object-cover object-center"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent opacity-70" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
          {getTypeBadge()}
          {item.discountPercent > 0 && (
            <motion.span
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="text-[11px] font-black px-2.5 py-1 rounded-full bg-rose-500 text-white shadow-md uppercase tracking-wider"
            >
              {item.discountPercent}% OFF
            </motion.span>
          )}
        </div>

        {/* Category & Demo Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
          <span className="text-[11px] text-slate-800 dark:text-slate-200 font-bold bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-yellow-200 dark:border-slate-800 shadow-xs">
            {item.category}
          </span>
          {item.type === 'theme' && item.liveDemoUrl && (
            <a
              href={item.liveDemoUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-900 dark:text-emerald-300 bg-lime-200/90 dark:bg-emerald-950/90 hover:bg-lime-300 px-2.5 py-1 rounded-xl border border-lime-400/80 backdrop-blur-md transition-colors shadow-xs"
            >
              <ExternalLink className="w-3 h-3 text-emerald-700 dark:text-emerald-400" /> Live Demo
            </a>
          )}
          {item.type === 'course' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-900 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/90 px-2.5 py-1 rounded-xl border border-emerald-300/80 backdrop-blur-md shadow-xs">
              <Play className="w-3 h-3 text-emerald-600 dark:text-emerald-400 fill-emerald-600" /> Preview
            </span>
          )}
        </div>
      </div>

      {/* Content Info */}
      <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Title */}
          <h3
            onClick={() => onPreview(item)}
            className="text-base font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-lime-400 transition-colors line-clamp-2 cursor-pointer leading-snug"
          >
            {item.title}
          </h3>

          {/* Rating & Sales */}
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            {item.reviewCount > 0 ? (
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-extrabold text-slate-900 dark:text-slate-100">{item.rating.toFixed(1)}</span>
                <span className="text-slate-500">({item.reviewCount})</span>
              </div>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/60">
                ★ 5.0 (Owner Verified)
              </span>
            )}
            <span className="text-emerald-800/80 dark:text-emerald-400 text-[11px] font-bold">{item.salesCount || 0} purchases</span>
          </div>

          {/* Short Description */}
          {item.shortDescription && (
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {item.shortDescription}
            </p>
          )}

          {/* Short Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {item.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-yellow-100/70 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-yellow-200 dark:border-slate-700/60">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Pricing & Action CTAs */}
        <div className="pt-3 border-t border-yellow-200/90 dark:border-emerald-900/60 flex items-center justify-between gap-2">
          {/* Prices */}
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">₹{item.finalPrice.toLocaleString('en-IN')}</span>
              {item.mrp > item.finalPrice && (
                <span className="text-xs text-slate-400 line-through">₹{item.mrp.toLocaleString('en-IN')}</span>
              )}
            </div>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Single License
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {/* Add to Cart */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleAddToCart}
              className={`p-2.5 rounded-xl transition-colors border cursor-pointer ${
                addedAnimation
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-yellow-100/90 dark:bg-slate-800 hover:bg-yellow-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-yellow-300/80 dark:border-slate-700'
              }`}
              title="Add to Cart"
            >
              {addedAnimation ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />}
            </motion.button>

            {/* Quick Preview */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => onPreview(item)}
              className="p-2.5 rounded-xl bg-yellow-100/90 dark:bg-slate-800 hover:bg-yellow-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors border border-yellow-300/80 dark:border-slate-700 cursor-pointer"
              title="Quick Preview"
            >
              <Eye className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
            </motion.button>

            {/* Buy Now */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onBuyNow(item)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-lime-600 to-emerald-600 hover:from-emerald-500 hover:to-lime-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-yellow-200" />
              <span>Buy Now</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
