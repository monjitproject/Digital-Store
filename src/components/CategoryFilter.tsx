import React from 'react';
import { motion } from 'motion/react';
import { Package, GraduationCap, FileArchive, Layers, SlidersHorizontal, Sparkles } from 'lucide-react';

interface CategoryFilterProps {
  activeType: string;
  onSelectType: (type: 'all' | 'product' | 'course' | 'theme') => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  itemCount: number;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  activeType,
  onSelectType,
  sortBy,
  onSortChange,
  itemCount,
}) => {
  const tabs = [
    { id: 'all', label: 'All Catalog', icon: Layers, color: 'text-amber-600 dark:text-amber-400' },
    { id: 'product', label: 'Products', icon: Package, color: 'text-emerald-600 dark:text-emerald-400' },
    { id: 'course', label: 'Courses', icon: GraduationCap, color: 'text-lime-600 dark:text-lime-400' },
    { id: 'theme', label: 'Website Themes', icon: FileArchive, color: 'text-teal-600 dark:text-teal-400' },
  ];

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 py-4 border-b border-yellow-200/90 dark:border-emerald-900/60 text-slate-800 dark:text-slate-200">
      {/* Category Tabs with Motion */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        {tabs.map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeType === tab.id;

          return (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelectType(tab.id as any)}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'text-slate-900 dark:text-white shadow-md'
                  : 'bg-white/80 dark:bg-slate-900/80 hover:bg-yellow-100/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-yellow-200 dark:border-slate-800'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="filterActiveTab"
                  className="absolute inset-0 bg-gradient-to-r from-amber-300 via-lime-300 to-emerald-400 dark:from-emerald-600 dark:to-lime-600 rounded-xl z-0 shadow-xs"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <IconComp className={`relative z-10 w-3.5 h-3.5 ${isActive ? 'text-slate-950 dark:text-white' : tab.color}`} />
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Counter & Sorting Options */}
      <div className="flex items-center justify-between md:justify-end gap-3 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 bg-yellow-100/70 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-yellow-200 dark:border-emerald-800/60">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          <span>
            Showing <strong className="text-emerald-800 dark:text-emerald-300 font-extrabold">{itemCount}</strong> items
          </span>
        </div>

        <div className="flex items-center gap-2 bg-white/90 dark:bg-slate-900 border border-yellow-300/80 dark:border-emerald-800/80 px-3 py-1.5 rounded-xl shadow-xs">
          <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-transparent text-slate-800 dark:text-slate-200 text-xs font-bold focus:outline-none cursor-pointer"
          >
            <option value="popular" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
              Most Popular
            </option>
            <option value="price-low" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
              Price: Low to High
            </option>
            <option value="price-high" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
              Price: High to Low
            </option>
            <option value="rating" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
              Highest Rated
            </option>
          </select>
        </div>
      </div>
    </div>
  );
};

