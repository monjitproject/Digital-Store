import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Sun, Moon, ShoppingBag, ShoppingCart, Search, Sparkles, User, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentTab: 'store' | 'products' | 'courses' | 'themes' | 'my-purchases' | 'admin';
  onSelectTab: (tab: 'store' | 'products' | 'courses' | 'themes' | 'my-purchases' | 'admin') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenAdmin: () => void;
  onOpenAuthModal: () => void;
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  onOpenAdmin,
  onOpenAuthModal,
  onOpenCart,
}) => {
  const { themeMode, toggleTheme, myOrders, isAdmin, user, isAuthenticated, cartCount } = useAuth();
  const paidCount = myOrders.filter((o) => o.status === 'PAID').length;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-amber-50/90 dark:bg-slate-950/90 border-b border-yellow-200/90 dark:border-emerald-900/60 text-slate-800 dark:text-slate-100 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo with Animated Motion */}
        <motion.div
          onClick={() => onSelectTab('store')}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-400 via-lime-400 to-emerald-500 p-0.5 shadow-lg shadow-lime-500/25 group-hover:shadow-lime-500/40 transition-all">
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center">
              <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}>
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </motion.div>
            </div>
            <motion.div
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="absolute -top-1 -right-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            </motion.div>
          </div>
          <div>
            <div className="font-extrabold text-lg leading-tight tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              DigiVault <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-amber-200/90 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-400/40 shadow-xs">PRO</span>
            </div>
            <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400 font-medium hidden sm:block">Digital Store • Yellow & Green Edition</p>
          </div>
        </motion.div>

        {/* Catalog Navigation Tabs with Smooth Motions */}
        <nav className="hidden md:flex items-center gap-1 bg-yellow-100/70 dark:bg-slate-900/80 p-1 rounded-2xl border border-yellow-200/80 dark:border-emerald-800/50 shadow-inner">
          {[
            { id: 'store', label: 'All Items' },
            { id: 'products', label: 'Products' },
            { id: 'courses', label: 'Courses' },
            { id: 'themes', label: 'Website Themes' },
          ].map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id as any)}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'text-slate-900 dark:text-white shadow-md'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-yellow-200/50 dark:hover:bg-emerald-950/40'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavTab"
                    className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-lime-300 to-emerald-400 dark:from-emerald-600 dark:to-lime-600 rounded-xl z-0 shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Instant Search Bar */}
        <div className="relative flex-1 max-w-xs hidden lg:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-700/60 dark:text-emerald-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products, courses, themes..."
            className="w-full bg-white/90 dark:bg-slate-900/90 border border-yellow-300/80 dark:border-emerald-800/70 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/30 transition-all shadow-xs"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Cart Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenCart}
            className="relative p-2 rounded-xl bg-yellow-100/90 dark:bg-slate-900 hover:bg-yellow-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-yellow-300/80 dark:border-slate-700/80 transition-colors cursor-pointer"
            title="Shopping Cart"
          >
            <ShoppingCart className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-emerald-500 to-lime-500 text-slate-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                {cartCount}
              </span>
            )}
          </motion.button>

          {/* Theme Mode Toggle */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-yellow-100/80 dark:bg-slate-800 hover:bg-yellow-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors border border-yellow-300/70 dark:border-slate-700/60 shadow-xs cursor-pointer"
            title="Toggle theme"
          >
            {themeMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" /> : <Moon className="w-4 h-4 text-emerald-700" />}
          </motion.button>

          {/* Google Auth / Customer Account Button */}
          {isAuthenticated ? (
            <motion.button
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelectTab('my-purchases')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                currentTab === 'my-purchases'
                  ? 'bg-gradient-to-r from-emerald-600 to-lime-600 border-emerald-500 text-white shadow-md'
                  : 'bg-emerald-100/80 dark:bg-slate-900 border-emerald-300/80 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-300'
              }`}
            >
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.email}`}
                alt=""
                className="w-4 h-4 rounded-full"
              />
              <span className="hidden sm:inline max-w-[100px] truncate">{user?.name?.split(' ')[0] || 'Account'}</span>
              {paidCount > 0 && (
                <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                  {paidCount}
                </span>
              )}
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-yellow-300/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-yellow-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Sign In</span>
            </motion.button>
          )}

          {/* Owner / Admin Panel Button */}
          <motion.button
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpenAdmin}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              currentTab === 'admin' || isAdmin
                ? 'bg-amber-400 dark:bg-amber-500 border-amber-500 text-slate-950 font-extrabold shadow-sm'
                : 'bg-yellow-100/90 dark:bg-slate-800 border-yellow-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-yellow-200 dark:hover:bg-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-800 dark:text-emerald-300" />
            <span className="hidden sm:inline">{isAdmin ? 'Owner Panel' : 'Admin'}</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
};
