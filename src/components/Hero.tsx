import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Zap, Download, Code2, GraduationCap, PackageCheck, Sparkles, Flame, CheckCircle2 } from 'lucide-react';

interface HeroProps {
  onSelectCategory: (category: 'all' | 'products' | 'courses' | 'themes') => void;
  activeCategory: string;
}

export const Hero: React.FC<HeroProps> = ({ onSelectCategory, activeCategory }) => {
  return (
    <div className="relative overflow-hidden pt-10 pb-16 bg-gradient-to-b from-amber-100/80 via-yellow-50/90 to-emerald-50/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 border-b border-yellow-200/90 dark:border-emerald-900/60 transition-colors">
      {/* Animated Light Yellow & Light Green Floating Orbs */}
      <motion.div
        animate={{
          y: [0, -25, 0],
          x: [0, 15, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 8,
          ease: 'easeInOut',
        }}
        className="absolute -top-20 left-1/4 w-[450px] h-[350px] bg-yellow-300/45 dark:bg-amber-500/10 blur-[110px] rounded-full pointer-events-none"
      />
      <motion.div
        animate={{
          y: [0, 20, 0],
          x: [0, -20, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 10,
          ease: 'easeInOut',
        }}
        className="absolute top-1/3 -right-16 w-[400px] h-[400px] bg-lime-400/40 dark:bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"
      />
      <motion.div
        animate={{
          y: [-15, 15, -15],
          rotate: [0, 180, 360],
        }}
        transition={{
          repeat: Infinity,
          duration: 14,
          ease: 'linear',
        }}
        className="absolute bottom-4 left-10 w-24 h-24 border-2 border-dashed border-emerald-400/30 rounded-full pointer-events-none hidden md:block"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Animated Security & Store Badge */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 border border-yellow-300 dark:border-emerald-700/80 text-xs font-bold text-slate-800 dark:text-slate-200 mb-6 shadow-md shadow-lime-500/10 backdrop-blur-md"
        >
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-80"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <motion.div animate={{ rotate: [0, 12, -12, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
          </motion.div>
          <span>Light Yellow & Green Vault — <strong>Instant Digital Delivery</strong></span>
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </motion.div>

        {/* Hero Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none text-slate-900 dark:text-slate-100"
        >
          Premium Digital Store for <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-emerald-700 via-lime-600 to-amber-600 dark:from-emerald-400 dark:via-lime-300 dark:to-yellow-300 bg-clip-text text-transparent drop-shadow-xs">
            Products, Courses & Themes
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-4 text-sm sm:text-base text-slate-700 dark:text-slate-300 max-w-2xl mx-auto font-medium"
        >
          Owner-curated UI systems, video masterclasses, and ready-to-deploy web templates. Pay securely via Card or UPI & access instant downloads immediately.
        </motion.p>

        {/* Interactive Category Buttons with Smooth Hover Motion */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          {[
            { id: 'all', label: 'All Digital Vault', icon: Zap, iconColor: 'text-amber-500' },
            { id: 'products', label: 'Digital Products', icon: PackageCheck, iconColor: 'text-emerald-600' },
            { id: 'courses', label: 'Video Courses', icon: GraduationCap, iconColor: 'text-lime-600' },
            { id: 'themes', label: 'Website Themes', icon: Code2, iconColor: 'text-teal-600' },
          ].map((cat) => {
            const IconComp = cat.icon;
            const isSelected = activeCategory === cat.id;

            return (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelectCategory(cat.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-200 ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-600 via-lime-600 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-lime-400/50'
                    : 'bg-white/90 dark:bg-slate-800/90 hover:bg-yellow-100/90 dark:hover:bg-slate-800 border border-yellow-200/90 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 shadow-xs'
                }`}
              >
                <motion.div
                  animate={isSelected ? { scale: [1, 1.25, 1], rotate: [0, 10, -10, 0] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <IconComp className={`w-4 h-4 ${isSelected ? 'text-yellow-200' : cat.iconColor}`} />
                </motion.div>
                <span>{cat.label}</span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Animated Feature Highlights Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 border-t border-yellow-200/90 dark:border-emerald-900/60 text-left"
        >
          {[
            {
              icon: Download,
              color: 'text-emerald-600 dark:text-emerald-400',
              bg: 'bg-emerald-100 dark:bg-emerald-950/60',
              title: 'Instant Download',
              desc: 'Signed download token',
            },
            {
              icon: ShieldCheck,
              color: 'text-amber-600 dark:text-amber-400',
              bg: 'bg-amber-100 dark:bg-amber-950/60',
              title: '256-Bit Encrypted',
              desc: 'Verified payment gateway',
            },
            {
              icon: PackageCheck,
              color: 'text-lime-600 dark:text-lime-400',
              bg: 'bg-lime-100 dark:bg-lime-950/60',
              title: 'Private Vault',
              desc: 'Secure non-public store',
            },
            {
              icon: Zap,
              color: 'text-yellow-600 dark:text-yellow-400',
              bg: 'bg-yellow-100 dark:bg-amber-950/60',
              title: 'Lifetime Access',
              desc: 'Re-download anytime',
            },
          ].map((feat, index) => {
            const IconComp = feat.icon;
            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.04, y: -2 }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-yellow-200/80 dark:border-emerald-900/50 shadow-sm backdrop-blur-sm transition-all"
              >
                <div className={`p-2.5 rounded-xl ${feat.bg} shrink-0`}>
                  <IconComp className={`w-4 h-4 ${feat.color}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{feat.title}</p>
                  <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400 font-medium">{feat.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

