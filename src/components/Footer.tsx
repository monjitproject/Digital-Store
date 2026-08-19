import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface FooterProps {
  onSelectCategory: (category: 'store' | 'products' | 'courses' | 'themes') => void;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectCategory, onOpenAdmin }) => {
  return (
    <footer className="mt-20 border-t border-yellow-200/90 dark:border-emerald-900/60 bg-amber-50/90 dark:bg-slate-950 text-slate-700 dark:text-slate-400 text-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-yellow-400 via-lime-400 to-emerald-500 p-0.5 shadow-md shadow-lime-500/20">
              <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <span className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">DigiVault</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px] font-medium">
            Digital storefront with a light yellow & green theme for selling UI kits, video masterclasses, and ready-to-deploy website themes with instant downloads.
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-2">
          <h4 className="font-extrabold text-slate-900 dark:text-slate-200 text-xs uppercase tracking-wider">Catalog Collections</h4>
          <ul className="space-y-1.5 text-[11px] font-semibold">
            <li>
              <button onClick={() => onSelectCategory('store')} className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                All Digital Assets
              </button>
            </li>
            <li>
              <button onClick={() => onSelectCategory('products')} className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                Digital Products & UI Systems
              </button>
            </li>
            <li>
              <button onClick={() => onSelectCategory('courses')} className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                Video Masterclass Courses
              </button>
            </li>
            <li>
              <button onClick={() => onSelectCategory('themes')} className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                Website Themes & Zip Packages
              </button>
            </li>
            {onOpenAdmin && (
              <li className="pt-1">
                <button onClick={onOpenAdmin} className="text-amber-700 dark:text-amber-400 font-extrabold hover:underline">
                  Owner / Admin Management Panel
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Security & PG */}
        <div className="space-y-2">
          <h4 className="font-extrabold text-slate-900 dark:text-slate-200 text-xs uppercase tracking-wider">Payment Security</h4>
          <div className="p-3.5 rounded-2xl bg-yellow-100/80 dark:bg-emerald-950/40 border border-yellow-300 dark:border-emerald-800/50 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-extrabold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> 256-Bit Secure Gateway
            </div>
            <p className="text-[10px] text-slate-700 dark:text-slate-400 font-medium">
              Integrated with server-verified payment processing & immediate digital download tokens.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-yellow-200 dark:border-slate-900 py-6 text-center text-[11px] text-slate-600 dark:text-slate-500 font-medium">
        © {new Date().getFullYear()} DigiVault Digital Downloads & Themes. Light Yellow & Light Green Edition.
      </div>
    </footer>
  );
};

