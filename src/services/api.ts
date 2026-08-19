import { Item, Order, Coupon, AnalyticsSummary, DownloadTokenResponse, CartItem, CustomerReview, User, StoreSettings, PaymentMethod } from '../types';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('digivault_auth_token') || '';
  const email = localStorage.getItem('digivault_user_email') || '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (email) {
    headers['x-user-email'] = email;
  }
  return headers;
}

export const api = {
  // Auth & Google OAuth
  async getGoogleAuthUrl() {
    const res = await fetch('/api/auth/google/url');
    return res.json() as Promise<{
      success: boolean;
      url: string;
      redirectUri: string;
      isConfigured: boolean;
      message?: string;
    }>;
  },

  async googleLogin(params: { email: string; name?: string; avatar?: string }) {
    const res = await fetch('/api/auth/google/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json() as Promise<{
      success: boolean;
      user: User;
      token: string;
      isOwner: boolean;
      message?: string;
    }>;
  },

  async getMe() {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<{
      success: boolean;
      user: User | null;
      isOwner: boolean;
      ownerEmail?: string;
    }>;
  },

  // Items Catalog
  async getItems(params?: { type?: string; status?: string; search?: string; category?: string }) {
    const query = new URLSearchParams();
    if (params?.type) query.append('type', params.type);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);

    const res = await fetch(`/api/items?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<{ success: boolean; items: Item[] }>;
  },

  async getItemById(id: string) {
    const res = await fetch(`/api/items/${id}`, {
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<{ success: boolean; item?: Item; message?: string }>;
  },

  async createItem(itemData: Partial<Item>) {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(itemData),
    });
    return res.json() as Promise<{ success: boolean; item?: Item; message?: string }>;
  },

  async updateItem(id: string, itemData: Partial<Item>) {
    const res = await fetch(`/api/items/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(itemData),
    });
    return res.json() as Promise<{ success: boolean; item?: Item; message?: string }>;
  },

  async deleteItem(id: string) {
    const res = await fetch(`/api/items/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<{ success: boolean; message?: string }>;
  },

  // Cart
  async getCart() {
    const res = await fetch('/api/cart', {
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<{ success: boolean; cart: CartItem[] }>;
  },

  async addToCart(itemId: string, quantity: number = 1) {
    const res = await fetch('/api/cart/add', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ itemId, quantity }),
    });
    return res.json() as Promise<{ success: boolean; cart: CartItem[]; message?: string }>;
  },

  async removeFromCart(itemId: string) {
    const res = await fetch('/api/cart/remove', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ itemId }),
    });
    return res.json() as Promise<{ success: boolean; cart: CartItem[]; message?: string }>;
  },

  async clearCart() {
    const res = await fetch('/api/cart/clear', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<{ success: boolean; cart: CartItem[] }>;
  },

  // Reviews
  async getReviews(itemId?: string) {
    const query = itemId ? `?itemId=${encodeURIComponent(itemId)}` : '';
    const res = await fetch(`/api/reviews${query}`, {
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<{ success: boolean; reviews: CustomerReview[] }>;
  },

  async addReview(params: { itemId: string; rating: number; comment: string; userName?: string }) {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    return res.json() as Promise<{ success: boolean; review?: CustomerReview; item?: Item; message?: string }>;
  },

  // Coupons
  async getCoupons() {
    const res = await fetch('/api/coupons', {
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<{ success: boolean; coupons: Coupon[] }>;
  },

  async createCoupon(couponData: Partial<Coupon>) {
    const res = await fetch('/api/coupons', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(couponData),
    });
    return res.json() as Promise<{ success: boolean; coupon?: Coupon; message?: string }>;
  },

  async applyCoupon(code: string, orderAmount: number) {
    const res = await fetch('/api/coupons/apply', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ code, orderAmount }),
    });
    return res.json() as Promise<{
      success: boolean;
      code?: string;
      discountAmount?: number;
      finalAmount?: number;
      message?: string;
    }>;
  },

  // Settings
  async getSettings() {
    const res = await fetch('/api/settings', {
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<{ success: boolean; settings: StoreSettings }>;
  },

  async updateSettings(settings: Partial<StoreSettings>) {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });
    return res.json() as Promise<{ success: boolean; settings: StoreSettings; message?: string }>;
  },

  // Checkout & Manual Payment (WhatsApp & PhonePe QR)
  async initiateCheckout(params: {
    itemId: string;
    customerEmail: string;
    customerName: string;
    customerPhone?: string;
    couponCode?: string;
    paymentMethod?: PaymentMethod;
  }) {
    const res = await fetch('/api/checkout/initiate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    return res.json() as Promise<{
      success: boolean;
      orderId?: string;
      merchantTransactionId?: string;
      amount?: number;
      itemTitle?: string;
      paymentMethod?: PaymentMethod;
      settings?: StoreSettings;
      message?: string;
    }>;
  },

  async submitPaymentProof(params: {
    orderId: string;
    transactionId: string;
    paymentProof: string;
    customerPhone?: string;
  }) {
    const res = await fetch('/api/checkout/submit-proof', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    return res.json() as Promise<{
      success: boolean;
      message?: string;
      order?: Order;
    }>;
  },

  async verifyOrder(orderId: string, action: 'APPROVE' | 'REJECT', notes?: string, reason?: string) {
    const res = await fetch(`/api/admin/orders/${orderId}/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action, notes, reason }),
    });
    return res.json() as Promise<{
      success: boolean;
      message?: string;
      order?: Order;
    }>;
  },

  async completePayment(orderId: string, success: boolean = true, paymentMode: string = 'PhonePe UPI', transactionId?: string) {
    const res = await fetch('/api/checkout/complete', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ orderId, success, paymentMode, transactionId }),
    });
    return res.json() as Promise<{ success: boolean; status: string; order?: Order; message?: string }>;
  },

  async checkOrderStatus(orderId: string) {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<{
      success: boolean;
      orderId: string;
      merchantTransactionId: string;
      status: 'PENDING' | 'PENDING_VERIFICATION' | 'PAID' | 'REJECTED' | 'FAILED';
      amount: number;
      itemTitle: string;
      itemType: string;
      itemId: string;
      paidAt?: string;
      paymentDetails?: any;
    }>;
  },

  async getOrders(email?: string) {
    const query = email ? `?email=${encodeURIComponent(email)}` : '';
    const res = await fetch(`/api/orders${query}`, {
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<{ success: boolean; orders: Order[] }>;
  },

  // Signed Download
  async generateDownloadToken(orderId: string, customerEmail?: string) {
    const res = await fetch('/api/downloads/token', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ orderId, customerEmail }),
    });
    return res.json() as Promise<DownloadTokenResponse & { success: boolean; message?: string }>;
  },

  // Admin Analytics & Customers
  async getAdminAnalytics() {
    const res = await fetch('/api/admin/analytics', {
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<{ success: boolean; analytics: AnalyticsSummary; message?: string }>;
  },

  async getAdminCustomers() {
    const res = await fetch('/api/admin/customers', {
      headers: getAuthHeaders(),
    });
    return res.json() as Promise<{ success: boolean; customers: User[]; message?: string }>;
  },

  // File Upload (Direct Streaming Binary + Progress Tracking)
  async uploadBinary(
    file: File | Blob,
    options?: {
      filename?: string;
      isPublic?: boolean;
      onProgress?: (percent: number, loaded: number, total: number, speedMbps: number) => void;
      signal?: AbortSignal;
    }
  ) {
    return new Promise<{
      success: boolean;
      filename?: string;
      originalName?: string;
      filesize?: string;
      url?: string;
      isImage?: boolean;
      message?: string;
    }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const token = localStorage.getItem('digivault_auth_token') || '';
      const email = localStorage.getItem('digivault_user_email') || '';

      const isPublic = options?.isPublic ? 'true' : 'false';
      xhr.open('POST', `/api/upload?isPublic=${isPublic}`, true);

      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      if (email) xhr.setRequestHeader('x-user-email', email);

      let startTime = Date.now();

      if (xhr.upload && options?.onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && event.total > 0) {
            const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
            const elapsedSec = Math.max(0.1, (Date.now() - startTime) / 1000);
            const speedMbps = Number(((event.loaded * 8) / (elapsedSec * 1024 * 1024)).toFixed(2));
            options.onProgress?.(percent, event.loaded, event.total, speedMbps);
          }
        };
      }

      if (options?.signal) {
        options.signal.addEventListener('abort', () => {
          xhr.abort();
          resolve({ success: false, message: 'Upload cancelled by user' });
        });
      }

      xhr.onload = () => {
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            const json = JSON.parse(xhr.responseText);
            resolve(json);
          } else {
            let errMsg = 'Upload failed with status ' + xhr.status;
            try {
              const errJson = JSON.parse(xhr.responseText);
              if (errJson.message) errMsg = errJson.message;
            } catch {}
            resolve({ success: false, message: errMsg });
          }
        } catch (err: any) {
          resolve({ success: false, message: err.message || 'Failed to parse upload response' });
        }
      };

      xhr.onerror = () => {
        resolve({ success: false, message: 'Network connection failed during upload' });
      };

      xhr.ontimeout = () => {
        resolve({ success: false, message: 'Upload timed out' });
      };

      const formData = new FormData();
      const filename = options?.filename || (file instanceof File ? file.name : 'upload.bin');
      formData.append('file', file, filename);
      if (options?.isPublic) formData.append('isPublic', 'true');

      xhr.send(formData);
    });
  },

  // File Upload (Backwards-compatible wrapper)
  async uploadFile(filenameOrFile: string | File, fileData?: string, isPublic?: boolean) {
    if (filenameOrFile instanceof File) {
      return this.uploadBinary(filenameOrFile, { isPublic: isPublic ?? false });
    }

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ filename: filenameOrFile, fileData, isPublic }),
    });
    return res.json() as Promise<{
      success: boolean;
      filename?: string;
      filesize?: string;
      url?: string;
      dataUrl?: string;
      message?: string;
    }>;
  },
};
