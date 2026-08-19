import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Search,
  Eye,
  X,
  AlertCircle,
  FileImage,
  Sparkles,
  Phone,
  Mail,
  User as UserIcon,
} from 'lucide-react';
import { Order } from '../../types';
import { api } from '../../services/api';

interface AdminOrdersTabProps {
  orders: Order[];
  onRefresh: () => Promise<void>;
}

export const AdminOrdersTab: React.FC<AdminOrdersTabProps> = ({ orders, onRefresh }) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING_VERIFICATION' | 'PAID' | 'REJECTED' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Verification Modal & Image Zoom Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [zoomScreenshot, setZoomScreenshot] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = statusFilter === 'ALL' || o.status === statusFilter;
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.transactionId && o.transactionId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      o.itemTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingVerificationCount = orders.filter((o) => o.status === 'PENDING_VERIFICATION').length;
  const paidCount = orders.filter((o) => o.status === 'PAID').length;
  const rejectedCount = orders.filter((o) => o.status === 'REJECTED').length;

  const handleVerifyOrder = async (orderId: string, action: 'APPROVE' | 'REJECT') => {
    setIsVerifying(true);
    setActionSuccessMsg('');
    try {
      const res = await api.verifyOrder(orderId, action, undefined, action === 'REJECT' ? rejectReason : undefined);
      if (res.success) {
        setActionSuccessMsg(
          action === 'APPROVE'
            ? 'Order approved! Deliverable download unlocked for customer.'
            : 'Order rejected.'
        );
        await onRefresh();
        setTimeout(() => {
          setSelectedOrder(null);
          setIsRejecting(false);
          setRejectReason('');
          setActionSuccessMsg('');
        }, 1200);
      } else {
        alert(res.message || 'Action failed.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              Store Orders & Payment Verification
            </h2>
            {pendingVerificationCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black animate-pulse">
                {pendingVerificationCount} Needs Verification
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Review customer submitted UTRs and screenshot proofs. Approving an order activates customer download token.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order, email, UTR..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'ALL', label: `All Orders (${orders.length})` },
          { id: 'PENDING_VERIFICATION', label: `Pending Proof (${pendingVerificationCount})`, highlight: pendingVerificationCount > 0 },
          { id: 'PAID', label: `Paid & Active (${paidCount})` },
          { id: 'REJECTED', label: `Rejected (${rejectedCount})` },
          { id: 'PENDING', label: `Pending Initiation (${orders.filter((o) => o.status === 'PENDING').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === tab.id
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : tab.highlight
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-300">No orders matching your criteria</p>
          <p className="text-xs text-slate-500">Orders placed by customers will appear here in real time.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Order ID & Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Product / Item</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">UTR / Screenshot</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-slate-200">{ord.id}</div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ord.customerName}</span>
                    </div>
                    <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-500" />
                      <span>{ord.customerEmail}</span>
                    </div>
                    {ord.customerPhone && (
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{ord.customerPhone}</span>
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-200 line-clamp-1 max-w-[200px]">{ord.itemTitle}</div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">{ord.itemType}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                      {ord.paymentMethod === 'WHATSAPP' ? 'WhatsApp Direct' : 'PhonePe QR'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    {ord.transactionId ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 font-mono text-[11px] text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/30 w-fit">
                          <span>{ord.transactionId}</span>
                          <button
                            onClick={() => copyToClipboard(ord.transactionId!, `utr_${ord.id}`)}
                            className="text-slate-400 hover:text-white ml-1"
                          >
                            {copiedText === `utr_${ord.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        {ord.paymentProof && (
                          <button
                            onClick={() => setZoomScreenshot(ord.paymentProof!)}
                            className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 font-bold"
                          >
                            <FileImage className="w-3 h-3" /> View Screenshot
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-600 text-[11px]">No proof attached</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 font-black text-yellow-400 text-sm">
                    ₹{ord.amount}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase border ${
                        ord.status === 'PAID'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : ord.status === 'PENDING_VERIFICATION'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                          : ord.status === 'REJECTED'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {ord.status.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>

                      {ord.status === 'PENDING_VERIFICATION' && (
                        <button
                          onClick={() => handleVerifyOrder(ord.id, 'APPROVE')}
                          disabled={isVerifying}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md active:scale-95 transition-all"
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* INSPECT / VERIFY ORDER DETAIL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 space-y-6 max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Order Verification Panel
              </span>
              <h2 className="text-xl font-black text-white">Order Details: {selectedOrder.id}</h2>
            </div>

            {actionSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{actionSuccessMsg}</span>
              </div>
            )}

            {/* Customer & Item Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <h4 className="font-bold text-slate-400 uppercase text-[10px]">Customer Info</h4>
                <div>
                  <span className="text-slate-500 block text-[10px]">Name:</span>
                  <span className="font-bold text-white text-sm">{selectedOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Google Email:</span>
                  <span className="font-mono text-emerald-400 font-bold">{selectedOrder.customerEmail}</span>
                </div>
                {selectedOrder.customerPhone && (
                  <div>
                    <span className="text-slate-500 block text-[10px]">Phone:</span>
                    <span className="text-slate-200">{selectedOrder.customerPhone}</span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <h4 className="font-bold text-slate-400 uppercase text-[10px]">Purchased Asset</h4>
                <div>
                  <span className="text-slate-500 block text-[10px]">Title:</span>
                  <span className="font-bold text-white text-sm">{selectedOrder.itemTitle}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Payable Amount:</span>
                    <span className="font-black text-yellow-400 text-base">₹{selectedOrder.amount}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Current Status:</span>
                    <span className="font-bold text-xs uppercase text-amber-400">{selectedOrder.status}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Proof Section */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <h4 className="font-black text-sm text-white flex items-center gap-2">
                <FileImage className="w-4 h-4 text-purple-400" />
                Submitted Payment Proof
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">12-Digit UTR / Transaction ID:</span>
                  <div className="flex items-center gap-2 bg-slate-900 border border-purple-500/40 rounded-xl p-2.5 font-mono text-purple-300 font-bold text-sm">
                    <span>{selectedOrder.transactionId || 'No UTR specified'}</span>
                    {selectedOrder.transactionId && (
                      <button
                        onClick={() => copyToClipboard(selectedOrder.transactionId!, 'modal_utr')}
                        className="ml-auto p-1 text-slate-400 hover:text-white"
                      >
                        {copiedText === 'modal_utr' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Cross-check this UTR in your PhonePe merchant account.</p>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block mb-1">Screenshot Proof:</span>
                  {selectedOrder.paymentProof ? (
                    <div
                      onClick={() => setZoomScreenshot(selectedOrder.paymentProof!)}
                      className="cursor-pointer group relative rounded-xl overflow-hidden border border-slate-700 aspect-video bg-slate-900 flex items-center justify-center"
                    >
                      <img
                        src={selectedOrder.paymentProof}
                        alt="Proof screenshot"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                        <Eye className="w-4 h-4 mr-1" /> Click to Zoom
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-500 text-center">
                      No screenshot uploaded
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Rejection reason box if rejecting */}
            {isRejecting && (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-3">
                <h4 className="text-xs font-bold text-rose-300">Reason for Rejection (Optional for Customer Notice)</h4>
                <textarea
                  rows={2}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. UTR number does not match receipt amount, please resubmit with correct reference."
                  className="w-full bg-slate-950 border border-rose-500/50 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRejecting(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerifyOrder(selectedOrder.id, 'REJECT')}
                    disabled={isVerifying}
                    className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-xs"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}

            {/* Verification Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Close
              </button>

              {selectedOrder.status !== 'REJECTED' && !isRejecting && (
                <button
                  type="button"
                  onClick={() => setIsRejecting(true)}
                  className="px-5 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-xs transition-all"
                >
                  Reject Order
                </button>
              )}

              {selectedOrder.status !== 'PAID' && (
                <button
                  type="button"
                  onClick={() => handleVerifyOrder(selectedOrder.id, 'APPROVE')}
                  disabled={isVerifying}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-slate-950 font-black text-xs shadow-xl shadow-emerald-900/30 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isVerifying ? 'Approving...' : 'Approve & Unlock Deliverable'}</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* FULL SCREENSHOT ZOOM MODAL */}
      {zoomScreenshot && (
        <div
          onClick={() => setZoomScreenshot(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={zoomScreenshot}
              alt="Full screenshot"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-slate-700 shadow-2xl"
            />
            <button
              onClick={() => setZoomScreenshot(null)}
              className="absolute top-4 right-4 p-2.5 rounded-xl bg-slate-900/90 text-white hover:bg-slate-800 border border-slate-700 shadow-xl"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
