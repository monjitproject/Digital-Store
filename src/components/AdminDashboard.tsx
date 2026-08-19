import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Package,
  GraduationCap,
  FileArchive,
  ShoppingBag,
  Users,
  Tag,
  Star,
  CreditCard,
  Download,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Search,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { Item, Order, Coupon, AnalyticsSummary, ItemType, User, CustomerReview, StoreSettings } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AdminOrdersTab } from './admin/AdminOrdersTab';
import { AdminSettingsTab } from './admin/AdminSettingsTab';
import { AdminItemModal } from './admin/AdminItemModal';

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin, ownerEmail, logout, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'products' | 'courses' | 'themes' | 'orders' | 'customers' | 'coupons' | 'reviews' | 'settings'
  >('dashboard');

  // Analytics & Data
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter in Catalogs
  const [catalogSearch, setCatalogSearch] = useState('');

  // Item Modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [modalItemType, setModalItemType] = useState<ItemType>('product');
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Coupon Modal
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'percent' | 'flat'>('percent');
  const [couponValue, setCouponValue] = useState<number>(15);
  const [couponMinOrder, setCouponMinOrder] = useState<number>(500);

  // Delete Confirmation
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [anRes, itRes, ordRes, custRes, coupRes, revRes] = await Promise.all([
        api.getAdminAnalytics(),
        api.getItems({ status: 'all' }),
        api.getOrders(),
        api.getAdminCustomers(),
        api.getCoupons(),
        api.getReviews(),
      ]);

      if (anRes.success) setAnalytics(anRes.analytics);
      if (itRes.success) setItems(itRes.items);
      if (ordRes.success) setOrders(ordRes.orders);
      if (custRes.success) setCustomers(custRes.customers);
      if (coupRes.success) setCoupons(coupRes.coupons);
      if (revRes.success) setReviews(revRes.reviews);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  // Access Control Guard
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 rounded-3xl bg-slate-900 border border-rose-500/40 text-center space-y-6 shadow-2xl text-slate-100">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 mx-auto flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">Access Denied: Owner Protected</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            The Owner Panel is restricted exclusively to the authenticated Google account matching:
          </p>
          <p className="text-sm font-mono text-amber-300 font-bold bg-slate-950 py-2 px-4 rounded-xl border border-slate-800 inline-block">
            {ownerEmail || 'vmanjeet773@gmail.com'}
          </p>
        </div>
        <p className="text-xs text-slate-500">
          Currently signed in as: <strong className="text-slate-300">{user?.email || 'Guest / Unauthenticated'}</strong>
        </p>
        <button
          onClick={logout}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg transition-all cursor-pointer"
        >
          Sign in as Store Owner
        </button>
      </div>
    );
  }

  const handleOpenItemForm = (type: ItemType, itemToEdit?: Item) => {
    setModalItemType(type);
    setEditingItem(itemToEdit || null);
    setIsItemModalOpen(true);
  };

  const handleDeleteItemConfirm = async () => {
    if (!itemToDelete) return;
    await api.deleteItem(itemToDelete.id);
    setItemToDelete(null);
    await fetchAdminData();
  };

  const handleTogglePublish = async (item: Item) => {
    const newStatus = item.status === 'published' ? 'draft' : 'published';
    await api.updateItem(item.id, { status: newStatus });
    await fetchAdminData();
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    await api.createCoupon({
      code: couponCode.trim().toUpperCase(),
      type: couponType,
      discountValue: couponValue,
      minOrderAmount: couponMinOrder,
      expiryDate: '2027-12-31',
      maxUses: 500,
    });
    setIsCouponModalOpen(false);
    setCouponCode('');
    await fetchAdminData();
  };

  // Filtered item lists
  const productsList = items.filter((i) => i.type === 'product');
  const coursesList = items.filter((i) => i.type === 'course');
  const themesList = items.filter((i) => i.type === 'theme');
  const pendingVerificationCount = orders.filter((o) => o.status === 'PENDING_VERIFICATION').length;

  return (
    <div className="space-y-8 text-slate-100">
      {/* Top Admin Navigation Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">Owner & Admin Management Suite</h1>
              <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                STORE OWNER
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Authenticated Owner: <strong className="text-amber-300 font-mono">{user?.email}</strong>. Manage products, verify payments, and configure your store.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleOpenItemForm('product')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>

          <button
            onClick={() => handleOpenItemForm('course')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Add Course</span>
          </button>

          <button
            onClick={() => handleOpenItemForm('theme')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-lime-600 hover:bg-lime-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <FileArchive className="w-4 h-4" />
            <span>Add Theme</span>
          </button>
        </div>
      </div>

      {/* Admin Horizontal Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'products', label: `Products (${productsList.length})`, icon: Package },
          { id: 'courses', label: `Courses (${coursesList.length})`, icon: GraduationCap },
          { id: 'themes', label: `Website Themes (${themesList.length})`, icon: FileArchive },
          {
            id: 'orders',
            label: `Orders (${orders.length})`,
            icon: ShoppingBag,
            badge: pendingVerificationCount > 0 ? `${pendingVerificationCount} New` : undefined,
          },
          { id: 'customers', label: `Customers (${customers.length})`, icon: Users },
          { id: 'coupons', label: `Coupons (${coupons.length})`, icon: Tag },
          { id: 'reviews', label: `Reviews (${reviews.length})`, icon: Star },
          { id: 'settings', label: 'Store & Payment Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/20'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OWNER DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Real Statistics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Sales</span>
              <div className="text-2xl font-black text-emerald-400">
                ₹{(analytics?.totalRevenue || 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-slate-500 block">Verified Revenue</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Orders</span>
              <div className="text-2xl font-black text-white">{orders.length}</div>
              <span className="text-[10px] text-slate-500 block">
                {orders.filter((o) => o.status === 'PAID').length} Paid Transactions
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Customers</span>
              <div className="text-2xl font-black text-amber-400">{customers.length}</div>
              <span className="text-[10px] text-slate-500 block">Registered Google Users</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pending Verification</span>
              <div className="text-2xl font-black text-amber-400">{pendingVerificationCount}</div>
              <span className="text-[10px] text-slate-500 block">Awaiting Owner Approval</span>
            </div>
          </div>

          {/* Catalog Type Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Digital Products</h4>
                  <p className="text-[11px] text-slate-400">{productsList.length} total ({productsList.filter((p) => p.status === 'published').length} published)</p>
                </div>
              </div>
              <button
                onClick={() => handleOpenItemForm('product')}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Online Courses</h4>
                  <p className="text-[11px] text-slate-400">{coursesList.length} total ({coursesList.filter((c) => c.status === 'published').length} published)</p>
                </div>
              </div>
              <button
                onClick={() => handleOpenItemForm('course')}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-indigo-400"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-lime-500/20 text-lime-400 flex items-center justify-center font-bold">
                  <FileArchive className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Website Themes</h4>
                  <p className="text-[11px] text-slate-400">{themesList.length} total ({themesList.filter((t) => t.status === 'published').length} published)</p>
                </div>
              </div>
              <button
                onClick={() => handleOpenItemForm('theme')}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-lime-400"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2, 3, 4: PRODUCTS, COURSES, THEMES CATALOGS */}
      {(activeTab === 'products' || activeTab === 'courses' || activeTab === 'themes') && (
        <div className="space-y-6">
          {(() => {
            const currentType: ItemType = activeTab === 'products' ? 'product' : activeTab === 'courses' ? 'course' : 'theme';
            const list = items.filter((i) => i.type === currentType);

            return (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-white capitalize">
                      {currentType === 'product' ? 'Digital Products' : currentType === 'course' ? 'Online Courses' : 'Website Themes'} ({list.length})
                    </h2>
                    <p className="text-xs text-slate-400">
                      Create, edit pricing, upload deliverables, and publish to the live storefront.
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenItemForm(currentType)}
                    className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-yellow-300 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create {currentType === 'product' ? 'Product' : currentType === 'course' ? 'Course' : 'Theme'}</span>
                  </button>
                </div>

                {list.length === 0 ? (
                  <div className="p-16 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                    <Package className="w-12 h-12 text-slate-600 mx-auto" />
                    <h3 className="text-base font-bold text-slate-300">No {currentType}s created yet</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Click the button above to publish your first item with custom pricing and downloadable deliverable package.
                    </p>
                    <button
                      onClick={() => handleOpenItemForm(currentType)}
                      className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-yellow-300 text-slate-950 font-black text-xs"
                    >
                      Publish First {currentType}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {list.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={item.coverImage}
                            alt=""
                            className="w-16 h-16 rounded-xl object-cover bg-slate-950 border border-slate-800 shrink-0"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                                  item.status === 'published'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {item.status.toUpperCase()}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded">
                                {item.category}
                              </span>
                            </div>
                            <h3 className="font-bold text-sm text-white line-clamp-1">{item.title}</h3>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span className="text-yellow-400 font-black">₹{item.finalPrice}</span>
                              <span className="line-through text-slate-500 text-[11px]">₹{item.mrp}</span>
                              <span className="text-emerald-400 font-bold text-[10px]">{item.discountPercent}% OFF</span>
                              <span>•</span>
                              <span>{item.salesCount || 0} Sales</span>
                              <span>•</span>
                              <span>{item.downloadCount || 0} Downloads</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                          <button
                            onClick={() => handleTogglePublish(item)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                              item.status === 'published'
                                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                                : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500'
                            }`}
                          >
                            {item.status === 'published' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{item.status === 'published' ? 'Unpublish' : 'Publish'}</span>
                          </button>

                          <button
                            onClick={() => handleOpenItemForm(item.type, item)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setItemToDelete(item)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 5: ORDERS MANAGEMENT (Dedicated Verification Subcomponent) */}
      {activeTab === 'orders' && (
        <AdminOrdersTab orders={orders} onRefresh={fetchAdminData} />
      )}

      {/* TAB 6: CUSTOMERS MANAGEMENT */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-white">Registered Google Customers ({customers.length})</h2>

          {customers.length === 0 ? (
            <p className="text-xs text-slate-500 py-12 text-center">No registered customers yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customers.map((cust) => (
                <div key={cust.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <img src={cust.avatar || ''} alt="" className="w-12 h-12 rounded-xl object-cover bg-slate-950" />
                    <div>
                      <h4 className="font-bold text-sm text-white">{cust.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">{cust.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Orders</span>
                      <span className="font-bold text-emerald-400">{cust.ordersCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Spent</span>
                      <span className="font-bold text-yellow-400">₹{cust.totalSpent || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Downloads</span>
                      <span className="font-bold text-lime-400">{cust.downloadsCount || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: COUPONS */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white">Promo Discount Coupons</h2>
            <button
              onClick={() => setIsCouponModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Coupon</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coupons.map((c) => (
              <div key={c.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-black text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">
                    {c.code}
                  </span>
                  <span className="text-xs text-emerald-400 font-bold">
                    {c.type === 'percent' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Min Order: ₹{c.minOrderAmount} • Used: {c.usedCount} times</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-white">Customer Reviews & Ratings ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <p className="text-xs text-slate-500 py-12 text-center">No customer reviews submitted yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((r) => (
                <div key={r.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{r.userName}</span>
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(r.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 italic">"{r.comment}"</p>
                  <p className="text-[10px] text-slate-500">For item: {r.itemTitle}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 9: SETTINGS (Dedicated Settings Subcomponent) */}
      {activeTab === 'settings' && (
        <AdminSettingsTab ownerEmail={ownerEmail} onSettingsUpdated={fetchAdminData} />
      )}

      {/* ITEM CREATION / EDIT MODAL */}
      <AdminItemModal
        isOpen={isItemModalOpen}
        itemType={modalItemType}
        editingItem={editingItem}
        onClose={() => setIsItemModalOpen(false)}
        onSaved={async () => {
          await fetchAdminData();
          await refreshUserData();
        }}
      />

      {/* DELETE CONFIRMATION MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 text-center space-y-4">
            <Trash2 className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="text-lg font-black text-white">Confirm Deletion</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to permanently delete <strong className="text-white">"{itemToDelete.title}"</strong>?
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteItemConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Yes, Delete Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COUPON MODAL */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-black text-white">Create Promo Coupon</h3>
            <form onSubmit={handleSaveCoupon} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="e.g. FLASH30"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Discount Type</label>
                  <select
                    value={couponType}
                    onChange={(e) => setCouponType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={couponValue}
                    onChange={(e) => setCouponValue(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Min Order Amount (₹)</label>
                <input
                  type="number"
                  value={couponMinOrder}
                  onChange={(e) => setCouponMinOrder(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-3 py-2 text-xs text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs"
                >
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
