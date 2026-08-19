import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Download,
  ShoppingBag,
  ShoppingCart,
  CreditCard,
  User,
  LogOut,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  ArrowRight,
  Star,
  Package,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Order, CartItem } from '../types';

interface CustomerAccountProps {
  onProceedToCheckout?: (itemId: string) => void;
  onOpenItemDetail?: (itemId: string) => void;
  onContinueShopping?: () => void;
}

export const CustomerAccount: React.FC<CustomerAccountProps> = ({
  onProceedToCheckout,
  onOpenItemDetail,
  onContinueShopping,
}) => {
  const { user, logout, myOrders, refreshUserData, cart, removeFromCart, clearCart } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'downloads' | 'purchases' | 'cart' | 'payments' | 'profile'>('overview');

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState('');
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState('');

  // Review state
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Selected Order for Detail Modal
  const [selectedOrderForView, setSelectedOrderForView] = useState<Order | null>(null);

  const paidOrders = myOrders.filter((o) => o.status === 'PAID');
  const totalSpent = paidOrders.reduce((sum, o) => sum + o.amount, 0);
  const totalDownloads = paidOrders.reduce((sum, o) => sum + (o.downloadCount || 0), 0);

  const handleDownload = async (orderId: string) => {
    setDownloadingId(orderId);
    setDownloadError('');
    setDownloadSuccessMessage('');

    try {
      const res = await api.generateDownloadToken(orderId, user?.email);
      if (res.success && res.downloadUrl) {
        const link = document.createElement('a');
        link.href = res.downloadUrl;
        link.setAttribute('download', res.filename || 'deliverable.zip');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setDownloadSuccessMessage(`Download started for ${res.filename}`);
        await refreshUserData();
        setTimeout(() => setDownloadSuccessMessage(''), 4000);
      } else {
        setDownloadError(res.message || 'Unable to authorize download. Please contact support.');
      }
    } catch (err) {
      setDownloadError('Failed to initiate secure file stream.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent, order: Order) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setIsSubmittingReview(true);
    try {
      const res = await api.addReview({
        itemId: order.itemId,
        rating: reviewRating,
        comment: reviewComment,
        userName: user?.name,
      });
      if (res.success) {
        setReviewSuccess(true);
        setTimeout(() => {
          setReviewOrderId(null);
          setReviewComment('');
          setReviewSuccess(false);
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Calculate cart subtotal
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.item ? item.item.finalPrice * item.quantity : 0), 0);
  const cartMrpTotal = cart.reduce((sum, item) => sum + (item.item ? item.item.mrp * item.quantity : 0), 0);
  const cartSavings = Math.max(0, cartMrpTotal - cartSubtotal);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 sm:gap-5 z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-yellow-400 via-lime-400 to-emerald-500 p-0.5 shadow-xl shadow-emerald-900/20 shrink-0">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.email || 'customer'}`}
              alt={user?.name || 'Customer'}
              className="w-full h-full object-cover rounded-[14px] bg-slate-950"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white">{user?.name || 'Valued Customer'}</h1>
              <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Verified Google Account
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-mono mt-0.5">{user?.email}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '2026'}
            </p>
          </div>
        </div>

        {/* Dashboard Sub-navigation Tabs */}
        <div className="flex items-center gap-2 z-10 self-stretch md:self-auto">
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:border-rose-500/40 border border-slate-700 text-xs font-bold text-slate-300 hover:text-rose-300 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'downloads', label: `My Downloads (${paidOrders.length})`, icon: Download },
          { id: 'purchases', label: `My Purchases (${myOrders.length})`, icon: ShoppingBag },
          { id: 'cart', label: `My Cart (${cart.length})`, icon: ShoppingCart },
          { id: 'payments', label: 'Payment History', icon: CreditCard },
          { id: 'profile', label: 'Profile Settings', icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-lime-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Notification Toast Banners */}
      {downloadError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      {downloadSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{downloadSuccessMessage}</span>
        </div>
      )}

      {/* TAB 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-8">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Purchases</span>
              <div className="text-2xl font-black text-white">{paidOrders.length}</div>
              <span className="text-[10px] text-slate-500 block">Verified Digital Licenses</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Downloads</span>
              <div className="text-2xl font-black text-emerald-400">{totalDownloads}</div>
              <span className="text-[10px] text-slate-500 block">Files Streamed</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Spent</span>
              <div className="text-2xl font-black text-yellow-400">₹{totalSpent.toLocaleString('en-IN')}</div>
              <span className="text-[10px] text-slate-500 block">PhonePe Verified</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Items in Cart</span>
              <div className="text-2xl font-black text-lime-400">{cart.length}</div>
              <span className="text-[10px] text-slate-500 block">Ready for Checkout</span>
            </div>
          </div>

          {/* Quick Actions / Recent Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Purchases Column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  Recent Digital Assets
                </h3>
                {paidOrders.length > 0 && (
                  <button
                    onClick={() => setActiveSubTab('downloads')}
                    className="text-xs text-emerald-400 font-bold hover:underline"
                  >
                    View all ({paidOrders.length})
                  </button>
                )}
              </div>

              {paidOrders.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <Package className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-300">No purchases yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Explore our marketplace of Digital Products, Online Courses, and Website Themes.
                  </p>
                  {onContinueShopping && (
                    <button
                      onClick={onContinueShopping}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all"
                    >
                      Browse Marketplace
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {paidOrders.slice(0, 3).map((order) => (
                    <div
                      key={order.id}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={order.itemCoverImage}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover bg-slate-950 border border-slate-800 shrink-0"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-white line-clamp-1">{order.itemTitle}</h4>
                          <p className="text-[10px] text-slate-400">
                            Purchased on {new Date(order.paidAt || order.createdAt).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(order.id)}
                        disabled={downloadingId === order.id}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 active:scale-95 transition-all shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Cart Summary Column */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-yellow-400" />
                Current Cart
              </h3>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                {cart.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Your cart is empty.</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      {cart.map((ci) => (
                        <div key={ci.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                          <span className="text-slate-200 line-clamp-1 max-w-[160px]">{ci.item?.title}</span>
                          <span className="font-bold text-yellow-400">₹{ci.item?.finalPrice}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-300">Subtotal:</span>
                      <span className="text-emerald-400 text-sm">₹{cartSubtotal}</span>
                    </div>
                    <button
                      onClick={() => setActiveSubTab('cart')}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-lime-400 text-slate-950 font-black text-xs text-center shadow-lg transition-all"
                    >
                      View Cart & Checkout
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY DOWNLOADS */}
      {activeSubTab === 'downloads' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-400" />
                My Downloads
              </h2>
              <p className="text-xs text-slate-400">
                Authorized digital deliverables for your verified purchases. Download anytime.
              </p>
            </div>
            <span className="text-xs font-bold bg-slate-800 px-3 py-1 rounded-xl text-slate-300">
              {paidOrders.length} Deliverables Ready
            </span>
          </div>

          {paidOrders.length === 0 ? (
            <div className="p-16 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <Download className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-200">No Downloadable Assets Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Once you complete a purchase, your signed download links and course guides will automatically appear here.
              </p>
              {onContinueShopping && (
                <button
                  onClick={onContinueShopping}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-lime-600 text-white font-black text-xs shadow-lg shadow-emerald-900/30"
                >
                  Explore Store
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {paidOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={order.itemCoverImage}
                      alt=""
                      className="w-16 h-16 rounded-xl object-cover bg-slate-950 border border-slate-800 shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {order.itemType}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                          VERIFIED PAID
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-100">{order.itemTitle}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                        <span>Purchased: {new Date(order.paidAt || order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-500">Order: {order.id}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold">Downloads: {order.downloadCount || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                    <button
                      onClick={() => setReviewOrderId(reviewOrderId === order.id ? null : order.id)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-all"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      <span>Write Review</span>
                    </button>

                    <button
                      onClick={() => handleDownload(order.id)}
                      disabled={downloadingId === order.id}
                      className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      {downloadingId === order.id ? 'Authorizing...' : 'Download Deliverable'}
                    </button>
                  </div>

                  {/* Review Box Toggle */}
                  {reviewOrderId === order.id && (
                    <div className="w-full pt-4 border-t border-slate-800">
                      <form onSubmit={(e) => handleReviewSubmit(e, order)} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200">Rate your experience:</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewRating(star)}
                                className="p-1 hover:scale-110 transition-transform"
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    star <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <textarea
                          rows={2}
                          required
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="How did this asset help your project or workflow?"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setReviewOrderId(null)}
                            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmittingReview}
                            className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow transition-all"
                          >
                            {reviewSuccess ? 'Review Posted!' : isSubmittingReview ? 'Submitting...' : 'Post Review'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MY PURCHASES / ORDERS */}
      {activeSubTab === 'purchases' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-yellow-400" />
                Purchase & Order History
              </h2>
              <p className="text-xs text-slate-400">Complete record of your transactions and licensing statuses.</p>
            </div>
          </div>

          {myOrders.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">No orders recorded</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {myOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-400">{order.id}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-200">
                        <div className="flex items-center gap-2.5">
                          <img src={order.itemCoverImage} alt="" className="w-8 h-8 rounded-lg object-cover" />
                          <span className="line-clamp-1">{order.itemTitle}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-slate-400">{order.itemType}</td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-yellow-400">₹{order.amount}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            order.status === 'PAID'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : order.status === 'FAILED'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {order.status === 'PAID' ? (
                          <button
                            onClick={() => handleDownload(order.id)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-all"
                          >
                            Download
                          </button>
                        ) : (
                          <button
                            onClick={() => onProceedToCheckout && onProceedToCheckout(order.itemId)}
                            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-all"
                          >
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MY CART */}
      {activeSubTab === 'cart' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-lime-400" />
                Persistent Shopping Cart
              </h2>
              <p className="text-xs text-slate-400">Saved to your account across sessions.</p>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-400 hover:text-rose-300 font-bold hover:underline"
              >
                Clear Cart
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="p-16 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-200">Your Cart is Currently Empty</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Add any Digital Product, Online Masterclass, or Website Theme to checkout instantly.
              </p>
              {onContinueShopping && (
                <button
                  onClick={onContinueShopping}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-lime-600 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
                >
                  Browse Store Catalog
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                {cart.map((ci) => (
                  <div
                    key={ci.id}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={ci.item?.coverImage || ''}
                        alt=""
                        className="w-14 h-14 rounded-xl object-cover bg-slate-950 border border-slate-800 shrink-0"
                      />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block">{ci.item?.type}</span>
                        <h4 className="font-bold text-sm text-white line-clamp-1">{ci.item?.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-black text-yellow-400">₹{ci.item?.finalPrice}</span>
                          {ci.item?.mrp && ci.item.mrp > ci.item.finalPrice && (
                            <span className="text-[11px] text-slate-500 line-through">₹{ci.item?.mrp}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onProceedToCheckout && onProceedToCheckout(ci.itemId)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                      >
                        Buy Now
                      </button>
                      <button
                        onClick={() => removeFromCart(ci.itemId)}
                        className="p-2 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary Card */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 h-fit">
                <h3 className="text-base font-black text-white">Cart Summary</h3>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span>Original Value:</span>
                    <span className="line-through text-slate-500">₹{cartMrpTotal}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Total Discount Savings:</span>
                    <span>-₹{cartSavings}</span>
                  </div>
                  <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-black text-white">
                    <span>Total Pay Amount:</span>
                    <span className="text-yellow-400">₹{cartSubtotal}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  Digital items are licensed for single-user unlimited downloads.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PAYMENT HISTORY */}
      {activeSubTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                Payment Gateway History
              </h2>
              <p className="text-xs text-slate-400">PhonePe and verified payment records for your Google account.</p>
            </div>
          </div>

          {paidOrders.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
              <CreditCard className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">No payment records found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paidOrders.map((order) => (
                <div key={order.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-mono text-emerald-400 font-bold">
                      {order.paymentDetails?.transactionId || order.merchantTransactionId}
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                      PAID
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Order ID:</span>
                      <span className="font-mono text-slate-300">{order.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Product:</span>
                      <span className="font-bold text-white line-clamp-1">{order.itemTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Amount Paid:</span>
                      <span className="font-bold text-yellow-400">₹{order.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Gateway:</span>
                      <span className="text-slate-300 font-bold">{order.paymentDetails?.paymentMode || 'PhonePe UPI'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date:</span>
                      <span className="text-slate-400">{new Date(order.paidAt || order.createdAt).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: PROFILE */}
      {activeSubTab === 'profile' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 max-w-2xl">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" />
            Customer Profile
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Authenticated Google Email</label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-400 font-mono cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-500 mt-1">Google OAuth emails are verified and cannot be edited manually.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Display Name</label>
              <input
                type="text"
                disabled
                value={user?.name || ''}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Account Security Role</span>
              <span className="text-xs font-black uppercase text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-xl">
                {user?.role || 'Customer'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
