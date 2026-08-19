import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CategoryFilter } from './components/CategoryFilter';
import { ItemCard } from './components/ItemCard';
import { ItemDetailModal } from './components/ItemDetailModal';
import { CheckoutModal } from './components/CheckoutModal';
import { CustomerAccount } from './components/CustomerAccount';
import { AdminDashboard } from './components/AdminDashboard';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { Footer } from './components/Footer';
import { Item, Order } from './types';
import { api } from './services/api';
import { Zap, ShieldCheck, PlusCircle, ShoppingBag, Sparkles } from 'lucide-react';

function StoreApp() {
  const { isAdmin, isAuthenticated, user, pendingCheckoutItemId, setPendingCheckoutItemId } = useAuth();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<'store' | 'products' | 'courses' | 'themes' | 'my-purchases' | 'admin'>('store');
  const [activeCategory, setActiveCategory] = useState<'all' | 'products' | 'courses' | 'themes'>('all');
  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | 'product' | 'course' | 'theme'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');

  // Items State
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Active Flows
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<Item | null>(null);
  const [itemForCheckout, setItemForCheckout] = useState<Item | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTitle, setAuthModalTitle] = useState<string | undefined>(undefined);
  const [authModalSubtitle, setAuthModalSubtitle] = useState<string | undefined>(undefined);

  // Fetch Items Catalog
  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await api.getItems({ status: 'published' });
      if (res.success) {
        setItems(res.items);
      }
    } catch (err) {
      console.error('Failed to load catalog items:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [currentTab]);

  // Handle pending checkout upon sign-in
  useEffect(() => {
    if (isAuthenticated && pendingCheckoutItemId) {
      const targetItem = items.find((i) => i.id === pendingCheckoutItemId);
      if (targetItem) {
        setItemForCheckout(targetItem);
        setPendingCheckoutItemId(null);
      }
    }
  }, [isAuthenticated, pendingCheckoutItemId, items]);

  const handleOpenAdmin = () => {
    if (isAdmin) {
      setCurrentTab('admin');
    } else {
      setAuthModalTitle('Owner & Admin Sign In');
      setAuthModalSubtitle('Sign in with your configured Google Owner account (vmanjeet773@gmail.com) to access store management.');
      setShowAuthModal(true);
    }
  };

  const handleOpenAuth = () => {
    setAuthModalTitle('Sign in to DigiVault');
    setAuthModalSubtitle('Access your digital purchases, persistent cart, and instant download vault.');
    setShowAuthModal(true);
  };

  const handleBuyNow = (item: Item) => {
    if (!isAuthenticated) {
      setPendingCheckoutItemId(item.id);
      setAuthModalTitle('Sign in to Checkout');
      setAuthModalSubtitle(`Sign in with your Google account to unlock "${item.title}".`);
      setShowAuthModal(true);
      return;
    }
    setSelectedItemForDetail(null);
    setItemForCheckout(item);
  };

  // Sync category filter with navbar selection
  const handleSelectTab = (tab: 'store' | 'products' | 'courses' | 'themes' | 'my-purchases' | 'admin') => {
    if (tab === 'admin') {
      handleOpenAdmin();
      return;
    }
    setCurrentTab(tab);
    if (tab === 'products') {
      setActiveCategory('products');
      setActiveTypeFilter('product');
    } else if (tab === 'courses') {
      setActiveCategory('courses');
      setActiveTypeFilter('course');
    } else if (tab === 'themes') {
      setActiveCategory('themes');
      setActiveTypeFilter('theme');
    } else if (tab === 'store') {
      setActiveCategory('all');
      setActiveTypeFilter('all');
    }
  };

  const handleHeroSelectCategory = (cat: 'all' | 'products' | 'courses' | 'themes') => {
    setActiveCategory(cat);
    setCurrentTab(cat === 'all' ? 'store' : (cat as any));
    if (cat === 'products') setActiveTypeFilter('product');
    else if (cat === 'courses') setActiveTypeFilter('course');
    else if (cat === 'themes') setActiveTypeFilter('theme');
    else setActiveTypeFilter('all');
  };

  // Filter and Sort Items
  const filteredItems = items
    .filter((item) => {
      // Type filter
      if (activeTypeFilter !== 'all' && item.type !== activeTypeFilter) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesTag = item.tags.some((t) => t.toLowerCase().includes(q));
        const matchesCat = item.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesTag && !matchesCat) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.finalPrice - b.finalPrice;
      if (sortBy === 'price-high') return b.finalPrice - a.finalPrice;
      if (sortBy === 'rating') return b.rating - a.rating;
      return b.salesCount - a.salesCount; // popular
    });

  return (
    <div className="min-h-screen bg-[#FEFDF0] dark:bg-[#0b140e] text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-lime-400 selection:text-slate-950 transition-colors">
      {/* Header Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAdmin={handleOpenAdmin}
        onOpenAuthModal={handleOpenAuth}
        onOpenCart={() => {
          if (!isAuthenticated) {
            handleOpenAuth();
          } else {
            setCurrentTab('my-purchases');
          }
        }}
      />

      {/* Main View Router */}
      {currentTab === 'admin' ? (
        /* Owner Admin Management View */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AdminDashboard />
        </main>
      ) : currentTab === 'my-purchases' ? (
        /* Customer Portal View */
        <main className="flex-1">
          <CustomerAccount
            onProceedToCheckout={(itemId) => {
              const it = items.find((i) => i.id === itemId);
              if (it) handleBuyNow(it);
            }}
            onOpenItemDetail={(itemId) => {
              const it = items.find((i) => i.id === itemId);
              if (it) setSelectedItemForDetail(it);
            }}
            onContinueShopping={() => setCurrentTab('store')}
          />
        </main>
      ) : (
        /* Marketplace Storefront View */
        <main className="flex-1 space-y-8">
          {/* Hero Banner */}
          <Hero onSelectCategory={handleHeroSelectCategory} activeCategory={activeCategory} />

          {/* Main Catalog Container */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            {/* Filter and Sorting Header */}
            <CategoryFilter
              activeType={activeTypeFilter}
              onSelectType={(type) => {
                setActiveTypeFilter(type);
                if (type === 'product') setCurrentTab('products');
                else if (type === 'course') setCurrentTab('courses');
                else if (type === 'theme') setCurrentTab('themes');
                else setCurrentTab('store');
              }}
              sortBy={sortBy}
              onSortChange={setSortBy}
              itemCount={filteredItems.length}
            />

            {/* Catalog Items Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-80 rounded-3xl bg-yellow-100/80 dark:bg-slate-900 border border-yellow-200/80 dark:border-slate-800 animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              /* Requirement 2: Clean Empty Storefront for Owner */
              <div className="p-16 text-center rounded-3xl bg-white/90 dark:bg-slate-900/60 border-2 border-dashed border-yellow-300 dark:border-emerald-800/80 space-y-4 shadow-md my-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-yellow-400 via-lime-400 to-emerald-500 p-0.5 mx-auto shadow-lg shadow-lime-500/20">
                  <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[14px] flex items-center justify-center">
                    <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <div className="space-y-2 max-w-lg mx-auto">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                    Your DigiVault Store Is Ready
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    No items are published yet. Sign in as Store Owner to add your first Digital Product, Online Course, or Website Theme.
                  </p>
                </div>
                <button
                  onClick={handleOpenAdmin}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-lime-600 to-emerald-600 hover:from-emerald-500 hover:to-lime-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-yellow-200" />
                  <span>Owner Panel • Publish First Product</span>
                </button>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-16 text-center rounded-3xl bg-white/80 dark:bg-slate-900/40 border border-yellow-200/90 dark:border-slate-800 space-y-3 shadow-sm">
                <Zap className="w-12 h-12 text-amber-500 mx-auto" />
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">No items match your filter</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto font-medium">
                  Try clearing your search query or selecting a different category.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveTypeFilter('all');
                    setCurrentTab('store');
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-lime-600 text-xs text-white font-extrabold shadow-md hover:from-emerald-500 hover:to-lime-500 transition-all cursor-pointer"
                >
                  Reset Catalog Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {filteredItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onPreview={(it) => setSelectedItemForDetail(it)}
                    onBuyNow={(it) => handleBuyNow(it)}
                    onOpenAuthModal={handleOpenAuth}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      )}

      {/* Footer */}
      <Footer
        onSelectCategory={(cat) => handleSelectTab(cat as any)}
        onOpenAdmin={handleOpenAdmin}
      />

      {/* Google Authentication Modal */}
      {showAuthModal && (
        <GoogleAuthModal
          onClose={() => setShowAuthModal(false)}
          customTitle={authModalTitle}
          customSubtitle={authModalSubtitle}
          onSuccess={() => {
            if (pendingCheckoutItemId) {
              const target = items.find((i) => i.id === pendingCheckoutItemId);
              if (target) setItemForCheckout(target);
              setPendingCheckoutItemId(null);
            }
          }}
        />
      )}

      {/* Item Detail & Preview Modal */}
      {selectedItemForDetail && (
        <ItemDetailModal
          item={selectedItemForDetail}
          onClose={() => setSelectedItemForDetail(null)}
          onBuyNow={(it) => handleBuyNow(it)}
          onOpenAuthModal={handleOpenAuth}
        />
      )}

      {/* Direct PhonePe Checkout & Instant Download Modal */}
      {itemForCheckout && (
        <CheckoutModal
          item={itemForCheckout}
          onClose={() => setItemForCheckout(null)}
          onSuccess={(order) => {
            fetchItems();
          }}
          onGoToDownloads={() => {
            setItemForCheckout(null);
            setCurrentTab('my-purchases');
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StoreApp />
    </AuthProvider>
  );
}
