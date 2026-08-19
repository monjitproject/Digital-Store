import fs from 'fs';
import path from 'path';
import { Item, Order, OrderStatus, Coupon, User, CartItem, CustomerReview, AnalyticsSummary, StoreSettings, PaymentMethod } from '../src/types';

const DB_FILE = path.join(process.cwd(), 'server_db.json');

interface DatabaseData {
  items: Item[];
  orders: Order[];
  coupons: Coupon[];
  users: User[];
  carts: Record<string, CartItem[]>; // userEmail -> CartItem[]
  reviews: CustomerReview[];
  settings: StoreSettings;
  downloadTokens: Record<string, { orderId: string; expiresAt: number; filename: string; userEmail: string }>;
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'DigiVault Marketplace',
  storeTagline: 'Premium Digital Products, Courses & Themes',
  storeLogo: '',
  storeDescription: 'Direct owner-verified digital marketplace for world-class web templates, UI kits, masterclasses, and code assets.',
  ownerEmail: process.env.OWNER_EMAIL || 'vmanjeet773@gmail.com',
  whatsappNumber: '+919876543210',
  whatsappBuyLink: 'https://wa.me/919876543210',
  phonepeQrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=vmanjeet773@ybl%26pn=DigiVault%26cu=INR',
  upiId: 'vmanjeet773@ybl',
  paymentInstructions: 'Scan the PhonePe QR code with your PhonePe or any UPI app, complete the payment, and submit your 12-digit UTR/Transaction ID with screenshot below.',
  downloadExpiryMinutes: 60,
};

const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coup_1',
    code: 'WELCOME10',
    type: 'percent',
    discountValue: 10,
    minOrderAmount: 500,
    expiryDate: '2027-12-31',
    usedCount: 0,
    maxUses: 1000,
    isActive: true
  },
  {
    id: 'coup_2',
    code: 'LAUNCH500',
    type: 'flat',
    discountValue: 500,
    minOrderAmount: 2000,
    expiryDate: '2027-12-31',
    usedCount: 0,
    maxUses: 500,
    isActive: true
  },
  {
    id: 'coup_3',
    code: 'DIGI20',
    type: 'percent',
    discountValue: 20,
    minOrderAmount: 1000,
    expiryDate: '2027-12-31',
    usedCount: 0,
    maxUses: 200,
    isActive: true
  }
];

class Store {
  private data: DatabaseData;

  constructor() {
    this.data = this.loadData();
  }

  public getOwnerEmail(): string {
    const configured = this.data?.settings?.ownerEmail || process.env.OWNER_EMAIL || 'vmanjeet773@gmail.com';
    return configured.trim().toLowerCase();
  }

  public isOwner(email?: string): boolean {
    if (!email) return false;
    return email.trim().toLowerCase() === this.getOwnerEmail();
  }

  public getSettings(): StoreSettings {
    return {
      ...DEFAULT_SETTINGS,
      ...(this.data.settings || {}),
      ownerEmail: this.getOwnerEmail(),
    };
  }

  public updateSettings(partial: Partial<StoreSettings>): StoreSettings {
    this.data.settings = {
      ...this.getSettings(),
      ...partial,
    };
    this.saveData();
    return this.data.settings;
  }

  private loadData(): DatabaseData {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          items: parsed.items || [],
          orders: parsed.orders || [],
          coupons: parsed.coupons || INITIAL_COUPONS,
          users: parsed.users || [],
          carts: parsed.carts || {},
          reviews: parsed.reviews || [],
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
          downloadTokens: parsed.downloadTokens || {},
        };
      } catch (err) {
        console.error('Error reading db.json, using defaults:', err);
      }
    }

    const defaultData: DatabaseData = {
      items: [],
      orders: [],
      coupons: INITIAL_COUPONS,
      users: [],
      carts: {},
      reviews: [],
      settings: DEFAULT_SETTINGS,
      downloadTokens: {},
    };

    this.saveData(defaultData);
    return defaultData;
  }

  private saveData(dataToSave?: DatabaseData) {
    const d = dataToSave || this.data;
    fs.writeFileSync(DB_FILE, JSON.stringify(d, null, 2));
  }

  // --- USERS & AUTH ---
  public getOrCreateUser(email: string, name?: string, avatar?: string): User {
    const cleanEmail = email.trim().toLowerCase();
    let user = this.data.users.find((u) => u.email.toLowerCase() === cleanEmail);
    const role = this.isOwner(cleanEmail) ? 'admin' : 'customer';

    if (!user) {
      user = {
        id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: name || (this.isOwner(cleanEmail) ? 'Store Owner' : 'Valued Customer'),
        email: cleanEmail,
        role,
        avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`,
        createdAt: new Date().toISOString(),
        ordersCount: 0,
        totalSpent: 0,
        downloadsCount: 0,
      };
      this.data.users.unshift(user);
      this.saveData();
    } else {
      // Sync role dynamically if owner config changed
      user.role = role;
      if (name && name !== user.name) user.name = name;
      if (avatar && avatar !== user.avatar) user.avatar = avatar;
      this.saveData();
    }

    return user;
  }

  public getUsers(): User[] {
    return this.data.users.map((u) => {
      const userOrders = this.data.orders.filter((o) => o.customerEmail.toLowerCase() === u.email.toLowerCase() && o.status === 'PAID');
      const totalSpent = userOrders.reduce((sum, o) => sum + o.amount, 0);
      const downloadsCount = userOrders.reduce((sum, o) => sum + (o.downloadCount || 0), 0);
      return {
        ...u,
        ordersCount: userOrders.length,
        totalSpent,
        downloadsCount,
      };
    });
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  // --- CART PERSISTENCE ---
  public getCart(userEmail: string): CartItem[] {
    const clean = userEmail.trim().toLowerCase();
    const cartItems = this.data.carts[clean] || [];
    // Ensure items are still published/exist
    return cartItems.map((ci) => {
      const liveItem = this.getItemById(ci.itemId);
      return liveItem ? { ...ci, item: liveItem } : ci;
    });
  }

  public addToCart(userEmail: string, itemId: string, quantity: number = 1): CartItem[] {
    const clean = userEmail.trim().toLowerCase();
    if (!this.data.carts[clean]) {
      this.data.carts[clean] = [];
    }

    const item = this.getItemById(itemId);
    if (!item) return this.getCart(clean);

    const existingIdx = this.data.carts[clean].findIndex((c) => c.itemId === itemId);
    if (existingIdx >= 0) {
      // Digital products typically have quantity 1
      this.data.carts[clean][existingIdx].quantity = 1;
    } else {
      this.data.carts[clean].push({
        id: 'cart_' + Date.now(),
        itemId,
        item,
        quantity: 1,
        addedAt: new Date().toISOString(),
      });
    }

    this.saveData();
    return this.getCart(clean);
  }

  public removeFromCart(userEmail: string, itemId: string): CartItem[] {
    const clean = userEmail.trim().toLowerCase();
    if (this.data.carts[clean]) {
      this.data.carts[clean] = this.data.carts[clean].filter((c) => c.itemId !== itemId);
      this.saveData();
    }
    return this.getCart(clean);
  }

  public clearCart(userEmail: string): void {
    const clean = userEmail.trim().toLowerCase();
    this.data.carts[clean] = [];
    this.saveData();
  }

  // --- ITEMS CATALOG ---
  public getItems(type?: string, status?: string): Item[] {
    let list = this.data.items;
    if (type && type !== 'all') {
      list = list.filter((i) => i.type === type);
    }
    if (status && status !== 'all') {
      list = list.filter((i) => i.status === status);
    }
    return list;
  }

  public getItemById(id: string): Item | undefined {
    return this.data.items.find((i) => i.id === id || i.slug === id);
  }

  public saveItem(item: Item): Item {
    const idx = this.data.items.findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      this.data.items[idx] = { ...item, updatedAt: new Date().toISOString() };
    } else {
      this.data.items.unshift(item);
    }
    this.saveData();
    return item;
  }

  public deleteItem(id: string): boolean {
    const initialLen = this.data.items.length;
    this.data.items = this.data.items.filter((i) => i.id !== id);
    this.saveData();
    return this.data.items.length < initialLen;
  }

  // --- REVIEWS ---
  public getReviewsByItemId(itemId: string): CustomerReview[] {
    return this.data.reviews.filter((r) => r.itemId === itemId);
  }

  public addReview(review: CustomerReview): CustomerReview {
    this.data.reviews.unshift(review);

    // Update item aggregate rating and reviewCount
    const item = this.getItemById(review.itemId);
    if (item) {
      const itemReviews = this.getReviewsByItemId(review.itemId);
      const totalRating = itemReviews.reduce((sum, r) => sum + r.rating, 0);
      item.reviewCount = itemReviews.length;
      item.rating = Number((totalRating / itemReviews.length).toFixed(1));
      this.saveItem(item);
    }

    this.saveData();
    return review;
  }

  public getAllReviews(): CustomerReview[] {
    return this.data.reviews;
  }

  // --- ORDERS ---
  public createOrder(order: Order): Order {
    this.data.orders.unshift(order);
    this.saveData();
    return order;
  }

  public getOrderById(id: string): Order | undefined {
    return this.data.orders.find((o) => o.id === id || o.merchantTransactionId === id);
  }

  public submitOrderPaymentProof(orderId: string, utr: string, screenshot: string, customerPhone?: string): Order | undefined {
    const order = this.data.orders.find((o) => o.id === orderId || o.merchantTransactionId === orderId);
    if (order) {
      order.transactionId = utr;
      order.paymentProof = screenshot;
      if (customerPhone) order.customerPhone = customerPhone;
      order.status = 'PENDING_VERIFICATION';
      order.submittedAt = new Date().toISOString();
      order.paymentDetails = {
        ...order.paymentDetails,
        transactionId: utr,
        utrNumber: utr,
        screenshotUrl: screenshot,
      };
      this.saveData();
    }
    return order;
  }

  public verifyOrder(orderId: string, action: 'APPROVE' | 'REJECT', notes?: string, reason?: string): Order | undefined {
    const order = this.data.orders.find((o) => o.id === orderId || o.merchantTransactionId === orderId);
    if (!order) return undefined;

    if (action === 'APPROVE') {
      order.status = 'PAID';
      order.approvedAt = new Date().toISOString();
      order.paidAt = order.approvedAt;
      order.rejectionReason = undefined;
      if (notes) {
        order.paymentDetails = { ...order.paymentDetails, notes };
      }

      // Increment sales count on the item
      const item = this.getItemById(order.itemId);
      if (item) {
        item.salesCount = (item.salesCount || 0) + 1;
        this.saveItem(item);
      }

      // Update user order stats
      const user = this.getOrCreateUser(order.customerEmail, order.customerName);
      user.ordersCount = (user.ordersCount || 0) + 1;
      user.totalSpent = (user.totalSpent || 0) + order.amount;
    } else {
      order.status = 'REJECTED';
      order.rejectedAt = new Date().toISOString();
      order.rejectionReason = reason || notes || 'Transaction ID / UTR or Payment screenshot could not be verified.';
    }

    this.saveData();
    return order;
  }

  public updateOrderStatus(id: string, status: OrderStatus, paymentDetails?: any): Order | undefined {
    const order = this.data.orders.find((o) => o.id === id || o.merchantTransactionId === id);
    if (order) {
      order.status = status;
      if (paymentDetails) {
        order.paymentDetails = { ...order.paymentDetails, ...paymentDetails };
      }
      if (status === 'PAID') {
        order.paidAt = new Date().toISOString();
        // Increment sales count on the item
        const item = this.getItemById(order.itemId);
        if (item) {
          item.salesCount = (item.salesCount || 0) + 1;
          this.saveItem(item);
        }
        // Update user stats
        const user = this.getOrCreateUser(order.customerEmail, order.customerName);
        user.ordersCount = (user.ordersCount || 0) + 1;
        user.totalSpent = (user.totalSpent || 0) + order.amount;
      }
      this.saveData();
    }
    return order;
  }

  public getOrders(userEmail?: string): Order[] {
    if (userEmail) {
      return this.data.orders.filter((o) => o.customerEmail.toLowerCase() === userEmail.toLowerCase());
    }
    return this.data.orders;
  }

  // --- COUPONS ---
  public getCoupons(): Coupon[] {
    return this.data.coupons;
  }

  public getCouponByCode(code: string): Coupon | undefined {
    return this.data.coupons.find((c) => c.code.toUpperCase() === code.toUpperCase() && c.isActive);
  }

  public saveCoupon(coupon: Coupon): Coupon {
    const idx = this.data.coupons.findIndex((c) => c.id === coupon.id);
    if (idx >= 0) {
      this.data.coupons[idx] = coupon;
    } else {
      this.data.coupons.unshift(coupon);
    }
    this.saveData();
    return coupon;
  }

  public deleteCoupon(id: string): boolean {
    this.data.coupons = this.data.coupons.filter((c) => c.id !== id);
    this.saveData();
    return true;
  }

  // --- DOWNLOAD TOKENS ---
  public createDownloadToken(orderId: string, filename: string, userEmail: string, durationMinutes: number = 60): string {
    const token = 'dt_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = Date.now() + durationMinutes * 60 * 1000;
    this.data.downloadTokens[token] = { orderId, expiresAt, filename, userEmail: userEmail.toLowerCase() };
    this.saveData();
    return token;
  }

  public verifyDownloadToken(token: string): { orderId: string; filename: string; userEmail: string } | null {
    const record = this.data.downloadTokens[token];
    if (!record) return null;
    if (Date.now() > record.expiresAt) {
      delete this.data.downloadTokens[token];
      this.saveData();
      return null;
    }

    // Increment download counter on the order & item
    const order = this.getOrderById(record.orderId);
    if (order) {
      order.downloadCount = (order.downloadCount || 0) + 1;
      const item = this.getItemById(order.itemId);
      if (item) {
        item.downloadCount = (item.downloadCount || 0) + 1;
        this.saveItem(item);
      }
      this.saveData();
    }

    return { orderId: record.orderId, filename: record.filename, userEmail: record.userEmail };
  }

  // --- OWNER ANALYTICS ---
  public getAnalytics(): AnalyticsSummary {
    const paidOrders = this.data.orders.filter((o) => o.status === 'PAID');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.amount, 0);
    const totalSalesCount = paidOrders.length;
    const totalOrdersCount = this.data.orders.length;
    const totalDownloadsCount = paidOrders.reduce((sum, o) => sum + (o.downloadCount || 0), 0);

    const totalProductsCount = this.data.items.filter((i) => i.type === 'product' && i.status === 'published').length;
    const totalCoursesCount = this.data.items.filter((i) => i.type === 'course' && i.status === 'published').length;
    const totalThemesCount = this.data.items.filter((i) => i.type === 'theme' && i.status === 'published').length;
    const activeItemsCount = this.data.items.filter((i) => i.status === 'published').length;
    const draftItemsCount = this.data.items.filter((i) => i.status === 'draft').length;

    // Unique customers
    const customers = this.getUsers().filter((u) => u.role === 'customer' || u.ordersCount > 0);
    const totalCustomersCount = customers.length;

    // Monthly revenue
    const monthMap: Record<string, { revenue: number; orders: number }> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const currentMonthIdx = new Date().getMonth();
    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonthIdx - i + 12) % 12;
      monthMap[months[idx]] = { revenue: 0, orders: 0 };
    }

    paidOrders.forEach((o) => {
      const d = new Date(o.paidAt || o.createdAt);
      const mName = months[d.getMonth()];
      if (monthMap[mName]) {
        monthMap[mName].revenue += o.amount;
        monthMap[mName].orders += 1;
      }
    });

    const monthlyRevenue = Object.entries(monthMap).map(([month, val]) => ({
      month,
      revenue: val.revenue,
      orders: val.orders
    }));

    // Best sellers
    const itemSalesMap: Record<string, { itemId: string; title: string; sales: number; revenue: number; coverImage: string; type: any }> = {};
    this.data.items.forEach((item) => {
      itemSalesMap[item.id] = {
        itemId: item.id,
        title: item.title,
        sales: item.salesCount || 0,
        revenue: (item.salesCount || 0) * item.finalPrice,
        coverImage: item.coverImage,
        type: item.type
      };
    });

    const bestSellers = Object.values(itemSalesMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    return {
      totalSalesCount,
      totalRevenue,
      totalOrdersCount,
      activeItemsCount,
      totalProductsCount,
      totalCoursesCount,
      totalThemesCount,
      totalCustomersCount,
      totalDownloadsCount,
      draftItemsCount,
      monthlyRevenue,
      bestSellers,
      recentOrders: this.data.orders.slice(0, 8),
      recentCustomers: customers.slice(0, 8),
    };
  }
}

export const dbStore = new Store();
