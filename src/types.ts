export type ItemType = 'product' | 'course' | 'theme';
export type ItemStatus = 'draft' | 'published';

export interface CurriculumLesson {
  id: string;
  title: string;
  duration: string;
  isFreePreview?: boolean;
  videoUrl?: string;
  contentType?: 'video' | 'pdf' | 'text' | 'resource';
}

export interface CurriculumModule {
  id: string;
  title: string;
  lessons: CurriculumLesson[];
}

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  slug: string;
  shortDescription?: string;
  description: string;
  category: string;
  subcategory?: string;
  tags: string[];
  coverImage: string;
  previewMedia: string[];
  previewVideoUrl?: string;
  liveDemoUrl?: string; // For Themes
  documentationUrl?: string; // For Themes
  curriculum?: CurriculumModule[]; // For Courses
  instructor?: string;
  level?: string;
  language?: string;
  duration?: string;
  mrp: number; // MRP in INR
  salePrice?: number;
  discountPercent: number; // Discount %
  finalPrice: number; // Final price in INR
  isUnlimited: boolean;
  stock?: number;
  status: ItemStatus;
  isFeatured?: boolean;
  rating: number;
  reviewCount: number;
  salesCount: number;
  downloadCount?: number;
  downloadFileName: string;
  downloadFileSize: string;
  downloadFileUrl?: string;
  version?: string;
  compatibility?: string;
  requirements?: string;
  whatsIncluded?: string[];
  keyFeatures?: string[];
  licenseInfo?: string;
  framework?: string;
  cms?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'PENDING' | 'PENDING_VERIFICATION' | 'PAID' | 'REJECTED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
export type PaymentMethod = 'WHATSAPP' | 'PHONEPE_QR' | 'MANUAL';

export interface PaymentDetails {
  transactionId?: string; // UTR or Txn ID
  paymentMode?: string;
  responseCode?: string;
  paidAt?: string;
  screenshotUrl?: string;
  utrNumber?: string;
  notes?: string;
}

export interface StoreSettings {
  storeName: string;
  storeTagline: string;
  storeLogo?: string;
  storeDescription: string;
  ownerEmail: string;
  // Payment Config
  whatsappNumber: string;
  whatsappBuyLink: string;
  phonepeQrCodeUrl: string;
  upiId: string;
  paymentInstructions: string;
  // Download settings
  downloadExpiryMinutes: number;
}

export interface Order {
  id: string;
  merchantTransactionId: string;
  userId: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  itemId: string;
  itemTitle: string;
  itemType: ItemType;
  itemCoverImage: string;
  amount: number;
  originalPrice: number;
  discountAmount: number;
  couponCode?: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  transactionId?: string; // UTR Number entered by customer
  paymentProof?: string; // Base64 or URL of uploaded screenshot
  rejectionReason?: string;
  paymentDetails?: PaymentDetails;
  downloadCount?: number;
  createdAt: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  paidAt?: string;
}

export interface CartItem {
  id: string;
  itemId: string;
  item: Item;
  quantity: number;
  addedAt: string;
}

export interface CustomerReview {
  id: string;
  itemId: string;
  itemTitle: string;
  userEmail: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'flat';
  discountValue: number;
  minOrderAmount: number;
  expiryDate: string;
  usedCount: number;
  maxUses: number;
  isActive: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  avatar?: string;
  createdAt?: string;
  ordersCount?: number;
  totalSpent?: number;
  downloadsCount?: number;
}

export interface DownloadTokenResponse {
  token: string;
  expiresAt: string;
  downloadUrl: string;
  filename: string;
  filesize: string;
}

export interface AnalyticsSummary {
  totalSalesCount: number;
  totalRevenue: number;
  totalOrdersCount: number;
  activeItemsCount: number;
  totalProductsCount: number;
  totalCoursesCount: number;
  totalThemesCount: number;
  totalCustomersCount: number;
  totalDownloadsCount: number;
  draftItemsCount: number;
  monthlyRevenue: { month: string; revenue: number; orders: number }[];
  bestSellers: { itemId: string; title: string; sales: number; revenue: number; coverImage: string; type: ItemType }[];
  recentOrders?: Order[];
  recentCustomers?: User[];
}
