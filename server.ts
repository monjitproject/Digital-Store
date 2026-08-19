import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import multer from 'multer';
import { dbStore } from './server/store';
import {
  initializeVaultFiles,
  getVaultFilePath,
  saveVaultFile,
  savePublicUpload,
  formatBytes,
  sanitizeFilename,
  VAULT_DIR,
  PUBLIC_UPLOADS_DIR,
} from './server/vault';
import { Item, Order, User } from './src/types';

dotenv.config();

// Initialize vault
initializeVaultFiles();

const app = express();
const PORT = 3000;

// Serve public uploads statically with cache headers
app.use('/uploads', express.static(PUBLIC_UPLOADS_DIR, { maxAge: '7d' }));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Setup Multer streaming storage for high-performance direct disk uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isPublic = req.query.isPublic === 'true' || req.body?.isPublic === 'true';
    const isImage = file.mimetype.startsWith('image/') || /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(file.originalname);
    if (isImage || isPublic) {
      cb(null, PUBLIC_UPLOADS_DIR);
    } else {
      cb(null, VAULT_DIR);
    }
  },
  filename: (req, file, cb) => {
    cb(null, sanitizeFilename(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB limit
});

function normalizeStoredImage(imgUrl?: string): string {
  if (!imgUrl) return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
  if (imgUrl.startsWith('data:image')) {
    try {
      const base64Content = imgUrl.split('base64,')[1];
      const buffer = Buffer.from(base64Content, 'base64');
      const safeName = savePublicUpload('cover.png', buffer);
      return safeName;
    } catch {
      return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
    }
  }
  return imgUrl;
}

// Middleware to extract user email and check authorization
function getRequesterEmail(req: express.Request): string | null {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // Format: email:timestamp or base64
    try {
      if (token.includes('@')) return token.toLowerCase().trim();
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      if (decoded.includes('@')) return decoded.split(':')[0].toLowerCase().trim();
    } catch {
      // ignore
    }
  }
  const emailHeader = req.headers['x-user-email'] as string;
  if (emailHeader) return emailHeader.toLowerCase().trim();
  return null;
}

function requireOwner(req: express.Request, res: express.Response, next: express.NextFunction) {
  const email = getRequesterEmail(req);
  if (!email || !dbStore.isOwner(email)) {
    res.status(403).json({
      success: false,
      message: 'Access denied: Owner privileges required. Sign in with the configured OWNER_EMAIL.',
    });
    return;
  }
  next();
}

// --- API ROUTES ---

// 1. Health check & Store Meta
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    storeName: dbStore.getSettings().storeName,
    ownerConfigured: Boolean(process.env.OWNER_EMAIL || dbStore.getOwnerEmail()),
    timestamp: new Date().toISOString(),
  });
});

// 1.1 Store & Payment Settings (Public & Owner)
app.get('/api/settings', (req, res) => {
  const settings = dbStore.getSettings();
  res.json({
    success: true,
    settings,
  });
});

app.post('/api/settings', requireOwner, (req, res) => {
  const updated = dbStore.updateSettings(req.body);
  res.json({
    success: true,
    settings: updated,
    message: 'Store settings updated successfully',
  });
});

// 2. Google OAuth - Authorization URL Generator
app.get('/api/auth/google/url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const redirectUri = `${appUrl}/auth/callback`;

  if (!clientId) {
    // If Google Client ID is not yet provided, return instructions and direct OAuth endpoint
    res.json({
      success: true,
      isConfigured: false,
      message: 'Google Client ID is not configured in .env. Use Google Sign-In or quick account selection.',
      redirectUri,
      url: `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&scope=openid%20email%20profile&prompt=select_account`,
    });
    return;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
  });

  res.json({
    success: true,
    isConfigured: true,
    url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    redirectUri,
  });
});

// 3. Google OAuth Callback Route (Handles code exchange and sends postMessage to popup opener)
app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authentication</title></head>
        <body style="background:#090d16;color:#f8fafc;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <div style="text-align:center;padding:24px;background:#131d2e;border:1px solid #334155;border-radius:16px;">
            <h3 style="color:#ef4444;margin-top:0;">Authentication Cancelled</h3>
            <p style="font-size:13px;color:#94a3b8;">${error || 'No authorization code provided.'}</p>
            <script>
              setTimeout(() => window.close(), 2000);
            </script>
          </div>
        </body>
      </html>
    `);
    return;
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const redirectUri = `${appUrl}/auth/callback`;

    // Exchange code for Google access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      throw new Error(tokenData.error_description || 'Failed to obtain access token');
    }

    // Fetch user info from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userRes.json();
    const user = dbStore.getOrCreateUser(googleUser.email, googleUser.name, googleUser.picture);

    const sessionToken = Buffer.from(`${user.email}:${Date.now()}`).toString('base64');

    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Google Sign-In Successful</title></head>
        <body style="background:#090d16;color:#f8fafc;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <div style="text-align:center;padding:32px;background:#131d2e;border:1px solid #10b981;border-radius:20px;max-width:360px;">
            <div style="width:48px;height:48px;border-radius:50%;background:#10b98120;color:#10b981;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px;">✓</div>
            <h3 style="color:#ffffff;margin:0 0 8px 0;font-size:18px;">Signed in as ${user.name}</h3>
            <p style="font-size:13px;color:#94a3b8;margin:0 0 16px 0;">${user.email} (${user.role === 'admin' ? 'Store Owner' : 'Customer'})</p>
            <p style="font-size:11px;color:#64748b;">Closing window and returning to DigiVault...</p>
            <script>
              const payload = {
                type: 'DIGIVAULT_GOOGLE_AUTH_SUCCESS',
                user: ${JSON.stringify(user)},
                token: '${sessionToken}'
              };
              if (window.opener) {
                window.opener.postMessage(payload, '*');
                setTimeout(() => window.close(), 800);
              } else {
                window.location.href = '/';
              }
            </script>
          </div>
        </body>
      </html>
    `);
  } catch (err: any) {
    res.send(`
      <!DOCTYPE html>
      <html>
        <body style="background:#090d16;color:#fff;font-family:sans-serif;padding:30px;">
          <h3>OAuth Exchange Notice</h3>
          <p>${err.message}</p>
          <button onclick="window.close()" style="padding:8px 16px;background:#3b82f6;color:#fff;border:none;border-radius:8px;">Close</button>
        </body>
      </html>
    `);
  }
});

// 4. Direct Google Account Login / Verification
app.post('/api/auth/google/login', (req, res) => {
  const { email, name, avatar } = req.body;

  if (!email || !email.includes('@')) {
    res.status(400).json({ success: false, message: 'Valid Google email is required' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const isOwnerUser = dbStore.isOwner(cleanEmail);
  const user = dbStore.getOrCreateUser(cleanEmail, name, avatar);
  user.role = isOwnerUser ? 'admin' : 'customer';
  const token = Buffer.from(`${user.email}:${Date.now()}`).toString('base64');

  res.json({
    success: true,
    user,
    token,
    isOwner: isOwnerUser,
  });
});

// 4.1 Owner Password Authentication (Strict Server-Side Secret Verification)
app.post('/api/auth/owner-login', (req, res) => {
  const { password, email } = req.body;
  const ownerEmail = dbStore.getOwnerEmail();
  const configuredPassword = process.env.OWNER_PASSWORD;

  // If email is supplied, ensure it matches the configured owner email
  if (email && email.trim().toLowerCase() !== ownerEmail) {
    res.status(403).json({
      success: false,
      message: 'Access Denied — Owner Only. Provided email does not match authorized owner.',
    });
    return;
  }

  // If OWNER_PASSWORD secret is configured on the server, check it
  if (configuredPassword && configuredPassword.trim()) {
    if (!password || password.trim() !== configuredPassword.trim()) {
      res.status(401).json({
        success: false,
        message: 'Invalid owner secret password. Access denied.',
      });
      return;
    }
  }

  const user = dbStore.getOrCreateUser(ownerEmail, 'Store Owner');
  user.role = 'admin';
  const token = Buffer.from(`${user.email}:${Date.now()}`).toString('base64');

  res.json({
    success: true,
    user,
    token,
    isOwner: true,
    message: 'Authenticated as Store Owner',
  });
});

// 5. Auth / Me Status Check
app.get('/api/auth/me', (req, res) => {
  const email = getRequesterEmail(req);
  if (!email) {
    res.json({ success: false, user: null, isOwner: false });
    return;
  }

  const user = dbStore.getUserByEmail(email) || dbStore.getOrCreateUser(email);
  res.json({
    success: true,
    user,
    isOwner: user.role === 'admin',
    ownerEmail: dbStore.getOwnerEmail(),
  });
});

// 6. Get Items Catalog (Public)
app.get('/api/items', (req, res) => {
  const { type, status, search, category } = req.query;
  const requesterEmail = getRequesterEmail(req);
  const isOwnerUser = dbStore.isOwner(requesterEmail || undefined);

  // If status is 'all' or 'draft', only owner can view drafts
  const requestedStatus = status as string;
  let filterStatus = 'published';

  if (isOwnerUser && requestedStatus) {
    filterStatus = requestedStatus;
  }

  let items = dbStore.getItems(type as string, filterStatus);

  if (category && category !== 'all') {
    items = items.filter((i) => i.category.toLowerCase() === (category as string).toLowerCase());
  }

  if (search) {
    const q = (search as string).toLowerCase();
    items = items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        (i.shortDescription && i.shortDescription.toLowerCase().includes(q)) ||
        i.description.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, items });
});

// 7. Get Single Item (Public)
app.get('/api/items/:id', (req, res) => {
  const item = dbStore.getItemById(req.params.id);
  if (!item) {
    res.status(404).json({ success: false, message: 'Item not found' });
    return;
  }
  res.json({ success: true, item });
});

// 8. Create Item (Owner Protected)
app.post('/api/items', requireOwner, (req, res) => {
  const body = req.body;
  const { title, type, mrp, salePrice, discountPercent } = body;

  if (!title || !type || mrp === undefined) {
    res.status(400).json({ success: false, message: 'Missing required item fields: title, type, and regular price (mrp)' });
    return;
  }

  const mrpNum = Number(mrp);
  let finalPrice = salePrice !== undefined && salePrice !== '' ? Number(salePrice) : mrpNum;
  let discNum = discountPercent !== undefined ? Number(discountPercent) : 0;

  if (salePrice !== undefined && mrpNum > 0) {
    discNum = Math.max(0, Math.round(((mrpNum - finalPrice) / mrpNum) * 100));
  } else if (discountPercent !== undefined && mrpNum > 0) {
    finalPrice = Math.round(mrpNum * (1 - discNum / 100));
  }

  const newItem: Item = {
    id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    type,
    title,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    shortDescription: body.shortDescription || '',
    description: body.description || '',
    category: body.category || 'General',
    subcategory: body.subcategory || undefined,
    tags: Array.isArray(body.tags)
      ? body.tags
      : typeof body.tags === 'string'
      ? body.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : [],
    coverImage: normalizeStoredImage(body.coverImage),
    previewMedia: Array.isArray(body.previewMedia) && body.previewMedia.length > 0
      ? body.previewMedia.map((m: string) => normalizeStoredImage(m))
      : [normalizeStoredImage(body.coverImage)],
    previewVideoUrl: body.previewVideoUrl || undefined,
    liveDemoUrl: body.liveDemoUrl || undefined,
    documentationUrl: body.documentationUrl || undefined,
    curriculum: body.curriculum || undefined,
    instructor: body.instructor || undefined,
    level: body.level || undefined,
    language: body.language || undefined,
    duration: body.duration || undefined,
    mrp: mrpNum,
    discountPercent: discNum,
    finalPrice,
    isUnlimited: body.isUnlimited !== false,
    stock: body.stock ? Number(body.stock) : undefined,
    status: body.status || 'published',
    isFeatured: Boolean(body.isFeatured),
    rating: 0,
    reviewCount: 0,
    salesCount: 0,
    downloadCount: 0,
    downloadFileName: body.downloadFileName || `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-deliverable.zip`,
    downloadFileSize: body.downloadFileSize || '15 MB',
    downloadFileUrl: body.downloadFileUrl || undefined,
    version: body.version || undefined,
    compatibility: body.compatibility || undefined,
    requirements: body.requirements || undefined,
    whatsIncluded: Array.isArray(body.whatsIncluded)
      ? body.whatsIncluded
      : typeof body.whatsIncluded === 'string'
      ? body.whatsIncluded.split(',').map((s: string) => s.trim()).filter(Boolean)
      : undefined,
    keyFeatures: Array.isArray(body.keyFeatures)
      ? body.keyFeatures
      : typeof body.keyFeatures === 'string'
      ? body.keyFeatures.split(',').map((f: string) => f.trim()).filter(Boolean)
      : undefined,
    licenseInfo: body.licenseInfo || undefined,
    framework: body.framework || undefined,
    cms: body.cms || undefined,
    seoTitle: body.seoTitle || undefined,
    seoDescription: body.seoDescription || undefined,
    seoKeywords: body.seoKeywords || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const saved = dbStore.saveItem(newItem);
  res.status(201).json({ success: true, item: saved });
});

// 9. Edit Item (Owner Protected)
app.put('/api/items/:id', requireOwner, (req, res) => {
  const existing = dbStore.getItemById(req.params.id);
  if (!existing) {
    res.status(404).json({ success: false, message: 'Item not found' });
    return;
  }

  const body = req.body;
  const mrpNum = body.mrp !== undefined ? Number(body.mrp) : existing.mrp;
  let finalPrice = body.salePrice !== undefined && body.salePrice !== '' ? Number(body.salePrice) : body.finalPrice !== undefined ? Number(body.finalPrice) : existing.finalPrice;
  let discNum = body.discountPercent !== undefined ? Number(body.discountPercent) : existing.discountPercent;

  if (body.salePrice !== undefined && mrpNum > 0) {
    discNum = Math.max(0, Math.round(((mrpNum - finalPrice) / mrpNum) * 100));
  } else if (body.discountPercent !== undefined && mrpNum > 0 && body.salePrice === undefined) {
    finalPrice = Math.round(mrpNum * (1 - discNum / 100));
  }

  const updated: Item = {
    ...existing,
    ...body,
    mrp: mrpNum,
    discountPercent: discNum,
    finalPrice,
    tags: Array.isArray(body.tags)
      ? body.tags
      : typeof body.tags === 'string'
      ? body.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : existing.tags,
    whatsIncluded: Array.isArray(body.whatsIncluded)
      ? body.whatsIncluded
      : typeof body.whatsIncluded === 'string'
      ? body.whatsIncluded.split(',').map((s: string) => s.trim()).filter(Boolean)
      : existing.whatsIncluded,
    keyFeatures: Array.isArray(body.keyFeatures)
      ? body.keyFeatures
      : typeof body.keyFeatures === 'string'
      ? body.keyFeatures.split(',').map((f: string) => f.trim()).filter(Boolean)
      : existing.keyFeatures,
    updatedAt: new Date().toISOString(),
  };

  dbStore.saveItem(updated);
  res.json({ success: true, item: updated });
});

// 10. Delete Item (Owner Protected)
app.delete('/api/items/:id', requireOwner, (req, res) => {
  const deleted = dbStore.deleteItem(req.params.id);
  if (!deleted) {
    res.status(404).json({ success: false, message: 'Item not found' });
    return;
  }
  res.json({ success: true, message: 'Item deleted successfully' });
});

// 11. Cart APIs (Persistent by customer email)
app.get('/api/cart', (req, res) => {
  const email = getRequesterEmail(req);
  if (!email) {
    res.json({ success: true, cart: [] });
    return;
  }
  const cart = dbStore.getCart(email);
  res.json({ success: true, cart });
});

app.post('/api/cart/add', (req, res) => {
  const email = getRequesterEmail(req);
  const { itemId, quantity } = req.body;

  if (!email) {
    res.status(401).json({ success: false, message: 'Please sign in to save items to your cart' });
    return;
  }
  if (!itemId) {
    res.status(400).json({ success: false, message: 'Item ID is required' });
    return;
  }

  const cart = dbStore.addToCart(email, itemId, quantity || 1);
  res.json({ success: true, cart });
});

app.post('/api/cart/remove', (req, res) => {
  const email = getRequesterEmail(req);
  const { itemId } = req.body;

  if (!email) {
    res.status(401).json({ success: false, message: 'Please sign in' });
    return;
  }

  const cart = dbStore.removeFromCart(email, itemId);
  res.json({ success: true, cart });
});

app.post('/api/cart/clear', (req, res) => {
  const email = getRequesterEmail(req);
  if (email) {
    dbStore.clearCart(email);
  }
  res.json({ success: true, cart: [] });
});

// 12. Reviews APIs
app.get('/api/reviews', (req, res) => {
  const { itemId } = req.query;
  if (itemId) {
    res.json({ success: true, reviews: dbStore.getReviewsByItemId(itemId as string) });
  } else {
    res.json({ success: true, reviews: dbStore.getAllReviews() });
  }
});

app.post('/api/reviews', (req, res) => {
  const email = getRequesterEmail(req);
  const { itemId, rating, comment, userName } = req.body;

  if (!email) {
    res.status(401).json({ success: false, message: 'Please sign in to submit a review' });
    return;
  }

  if (!itemId || !rating || !comment) {
    res.status(400).json({ success: false, message: 'Item ID, rating (1-5), and comment are required' });
    return;
  }

  const item = dbStore.getItemById(itemId);
  if (!item) {
    res.status(404).json({ success: false, message: 'Item not found' });
    return;
  }

  // Verify that customer has purchased this product
  const userOrders = dbStore.getOrders(email);
  const hasPurchased = userOrders.some((o) => o.itemId === itemId && o.status === 'PAID');

  if (!hasPurchased && !dbStore.isOwner(email)) {
    res.status(403).json({ success: false, message: 'Only verified purchasers of this item can leave a review.' });
    return;
  }

  const user = dbStore.getUserByEmail(email);

  const newReview = dbStore.addReview({
    id: 'rev_' + Date.now(),
    itemId,
    itemTitle: item.title,
    userEmail: email,
    userName: userName || (user ? user.name : 'Verified Customer'),
    userAvatar: user?.avatar,
    rating: Math.min(5, Math.max(1, Number(rating))),
    comment: comment.trim(),
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({ success: true, review: newReview, item: dbStore.getItemById(itemId) });
});

// 13. Coupons APIs
app.get('/api/coupons', (req, res) => {
  res.json({ success: true, coupons: dbStore.getCoupons() });
});

app.post('/api/coupons', requireOwner, (req, res) => {
  const { code, type, discountValue, minOrderAmount, expiryDate, maxUses } = req.body;
  if (!code || !type || !discountValue) {
    res.status(400).json({ success: false, message: 'Missing required coupon fields' });
    return;
  }

  const newCoupon = {
    id: 'coup_' + Date.now(),
    code: code.toUpperCase().trim(),
    type,
    discountValue: Number(discountValue),
    minOrderAmount: Number(minOrderAmount || 0),
    expiryDate: expiryDate || '2027-12-31',
    usedCount: 0,
    maxUses: Number(maxUses || 500),
    isActive: true,
  };

  dbStore.saveCoupon(newCoupon);
  res.status(201).json({ success: true, coupon: newCoupon });
});

app.post('/api/coupons/apply', (req, res) => {
  const { code, orderAmount } = req.body;
  if (!code) {
    res.status(400).json({ success: false, message: 'Coupon code required' });
    return;
  }

  const coupon = dbStore.getCouponByCode(code);
  if (!coupon) {
    res.status(404).json({ success: false, message: 'Invalid or inactive coupon code' });
    return;
  }

  const amt = Number(orderAmount || 0);
  if (amt < coupon.minOrderAmount) {
    res.status(400).json({
      success: false,
      message: `Minimum order amount for code ${coupon.code} is ₹${coupon.minOrderAmount}`,
    });
    return;
  }

  let discount = 0;
  if (coupon.type === 'percent') {
    discount = Math.round((amt * coupon.discountValue) / 100);
  } else {
    discount = Math.min(amt, coupon.discountValue);
  }

  res.json({
    success: true,
    code: coupon.code,
    discountAmount: discount,
    finalAmount: Math.max(0, amt - discount),
  });
});

// 14. Checkout Initiation (WhatsApp or PhonePe QR manual architecture)
app.post('/api/checkout/initiate', (req, res) => {
  const { itemId, customerEmail, customerName, customerPhone, couponCode, paymentMethod } = req.body;

  if (!itemId || !customerEmail || !customerName) {
    res.status(400).json({ success: false, message: 'Item ID, Customer Name, and Email are required' });
    return;
  }

  const item = dbStore.getItemById(itemId);
  if (!item || item.status !== 'published') {
    res.status(404).json({ success: false, message: 'Item not found or currently unavailable' });
    return;
  }

  let amount = item.finalPrice;
  let discountAmount = 0;

  if (couponCode) {
    const coupon = dbStore.getCouponByCode(couponCode);
    if (coupon && amount >= coupon.minOrderAmount) {
      if (coupon.type === 'percent') {
        discountAmount = Math.round((amount * coupon.discountValue) / 100);
      } else {
        discountAmount = Math.min(amount, coupon.discountValue);
      }
      amount = Math.max(0, amount - discountAmount);
    }
  }

  const merchantTransactionId = 'MT_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  const orderId = 'ord_' + Date.now();

  const newOrder: Order = {
    id: orderId,
    merchantTransactionId,
    userId: customerEmail.toLowerCase(),
    customerEmail: customerEmail.trim().toLowerCase(),
    customerName: customerName.trim(),
    customerPhone: customerPhone ? customerPhone.trim() : undefined,
    itemId: item.id,
    itemTitle: item.title,
    itemType: item.type,
    itemCoverImage: item.coverImage,
    amount,
    originalPrice: item.mrp,
    discountAmount,
    couponCode,
    paymentMethod: paymentMethod === 'WHATSAPP' ? 'WHATSAPP' : 'PHONEPE_QR',
    status: 'PENDING',
    downloadCount: 0,
    createdAt: new Date().toISOString(),
  };

  dbStore.createOrder(newOrder);

  // Register customer in database
  dbStore.getOrCreateUser(customerEmail, customerName);

  res.json({
    success: true,
    orderId,
    merchantTransactionId,
    amount,
    itemTitle: item.title,
    paymentMethod: newOrder.paymentMethod,
    settings: dbStore.getSettings(),
  });
});

// 15. Submit Payment Proof (UTR + Screenshot) for Owner Verification
app.post('/api/checkout/submit-proof', (req, res) => {
  const { orderId, transactionId, paymentProof, customerPhone } = req.body;

  if (!orderId || !transactionId || !paymentProof) {
    res.status(400).json({
      success: false,
      message: 'Order ID, 12-digit UTR/Transaction ID, and Payment Screenshot are required.',
    });
    return;
  }

  const updated = dbStore.submitOrderPaymentProof(orderId, transactionId.trim(), paymentProof, customerPhone);
  if (!updated) {
    res.status(404).json({ success: false, message: 'Order not found' });
    return;
  }

  // Also remove from cart if present
  if (updated.customerEmail) {
    dbStore.removeFromCart(updated.customerEmail, updated.itemId);
  }

  res.json({
    success: true,
    message: 'Payment submitted successfully. Your order is awaiting owner verification.',
    order: updated,
  });
});

// 15.1 Owner Order Verification (Approve / Reject)
app.post('/api/admin/orders/:orderId/verify', requireOwner, (req, res) => {
  const { action, notes, reason } = req.body;
  const { orderId } = req.params;

  if (!action || (action !== 'APPROVE' && action !== 'REJECT')) {
    res.status(400).json({ success: false, message: 'Action must be APPROVE or REJECT' });
    return;
  }

  const verified = dbStore.verifyOrder(orderId, action, notes, reason);
  if (!verified) {
    res.status(404).json({ success: false, message: 'Order not found' });
    return;
  }

  res.json({
    success: true,
    message: action === 'APPROVE' ? 'Order approved and paid status activated.' : 'Order rejected.',
    order: verified,
  });
});

// 15.2 Direct Payment Completion (For programmatic / automated approval)
app.post('/api/checkout/complete', (req, res) => {
  const { orderId, success, paymentMode, transactionId } = req.body;

  const order = dbStore.getOrderById(orderId);
  if (!order) {
    res.status(404).json({ success: false, message: 'Order not found' });
    return;
  }

  if (success !== false) {
    const updated = dbStore.updateOrderStatus(order.id, 'PAID', {
      transactionId: transactionId || 'TXN_' + Math.floor(100000000 + Math.random() * 900000000),
      paymentMode: paymentMode || 'PhonePe UPI',
      responseCode: 'SUCCESS_VERIFIED',
      paidAt: new Date().toISOString(),
    });

    if (order.customerEmail) {
      dbStore.removeFromCart(order.customerEmail, order.itemId);
    }

    res.json({ success: true, status: 'PAID', order: updated });
  } else {
    const updated = dbStore.updateOrderStatus(order.id, 'REJECTED', {
      responseCode: 'PAYMENT_DECLINED',
    });
    res.json({ success: true, status: 'REJECTED', order: updated });
  }
});

// 16. Order Status API (Polled by frontend)
app.get('/api/orders/:orderId/status', (req, res) => {
  const order = dbStore.getOrderById(req.params.orderId);
  if (!order) {
    res.status(404).json({ success: false, message: 'Order not found' });
    return;
  }

  res.json({
    success: true,
    orderId: order.id,
    merchantTransactionId: order.merchantTransactionId,
    status: order.status,
    amount: order.amount,
    itemTitle: order.itemTitle,
    itemType: order.itemType,
    itemId: order.itemId,
    paidAt: order.paidAt,
    paymentDetails: order.paymentDetails,
  });
});

// 17. Get Orders (Customer history or Owner overview)
app.get('/api/orders', (req, res) => {
  const { email } = req.query;
  const requesterEmail = getRequesterEmail(req);

  // If email query is requested, verify requester is that user or owner
  if (email) {
    const orders = dbStore.getOrders(email as string);
    res.json({ success: true, orders });
    return;
  }

  // If no email query, only owner can view ALL orders
  if (!requesterEmail || !dbStore.isOwner(requesterEmail)) {
    // Return orders only for requester
    const orders = requesterEmail ? dbStore.getOrders(requesterEmail) : [];
    res.json({ success: true, orders });
    return;
  }

  res.json({ success: true, orders: dbStore.getOrders() });
});

// 18. Signed Download Token Generator (Strictly Protected)
app.post('/api/downloads/token', (req, res) => {
  const { orderId, customerEmail } = req.body;
  const requesterEmail = getRequesterEmail(req) || customerEmail;

  if (!orderId) {
    res.status(400).json({ success: false, message: 'Order ID is required' });
    return;
  }

  const order = dbStore.getOrderById(orderId);
  if (!order) {
    res.status(404).json({ success: false, message: 'Order not found' });
    return;
  }

  // Verify Security: Must be PAID
  if (order.status !== 'PAID') {
    res.status(403).json({ success: false, message: 'Access denied. Order has not been paid.' });
    return;
  }

  // Verify Ownership
  const isOwnerUser = requesterEmail ? dbStore.isOwner(requesterEmail) : false;
  if (!isOwnerUser && requesterEmail && order.customerEmail.toLowerCase() !== requesterEmail.toLowerCase()) {
    res.status(403).json({ success: false, message: 'Access denied: You do not own this purchase.' });
    return;
  }

  const item = dbStore.getItemById(order.itemId);
  const filename = item ? item.downloadFileName : `${order.itemTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.zip`;

  // Create signed token valid for 60 minutes
  const token = dbStore.createDownloadToken(order.id, filename, order.customerEmail, 60);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  res.json({
    success: true,
    token,
    expiresAt,
    downloadUrl: `/api/downloads/file/${token}`,
    filename,
    filesize: item ? item.downloadFileSize : '15 MB',
  });
});

// 19. Secure Deliverable File Downloader (Streamed with Token)
app.get('/api/downloads/file/:token', (req, res) => {
  const tokenRecord = dbStore.verifyDownloadToken(req.params.token);

  if (!tokenRecord) {
    res.status(403).send('Invalid or expired download authorization. Please generate a fresh download token from your My Downloads portal.');
    return;
  }

  const filePath = getVaultFilePath(tokenRecord.filename);

  if (!filePath) {
    res.status(404).send('Deliverable package not found in secure vault.');
    return;
  }

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(tokenRecord.filename)}"`);
  res.sendFile(filePath);
});

// 20. Owner Analytics & Customers APIs (Owner Protected)
app.get('/api/admin/analytics', requireOwner, (req, res) => {
  const analytics = dbStore.getAnalytics();
  res.json({ success: true, analytics });
});

app.get('/api/admin/customers', requireOwner, (req, res) => {
  const customers = dbStore.getUsers();
  res.json({ success: true, customers });
});

// 21. File Upload Endpoint (Streaming Multipart + Base64 Fallback)
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    // 1. Binary streaming file upload via Multer (Fast, 0% CPU overhead, up to 500MB)
    if (req.file) {
      const isPublic = req.query.isPublic === 'true' || req.body?.isPublic === 'true';
      const isImage = req.file.mimetype.startsWith('image/') || /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(req.file.originalname);
      const filename = req.file.filename;
      const originalName = req.file.originalname;
      const sizeStr = formatBytes(req.file.size);

      if (isImage || isPublic) {
        return res.json({
          success: true,
          filename,
          originalName,
          filesize: sizeStr,
          url: `/uploads/${filename}`,
          isImage: true,
        });
      } else {
        return res.json({
          success: true,
          filename,
          originalName,
          filesize: sizeStr,
          url: `/api/downloads/file/${filename}`,
          isImage: false,
        });
      }
    }

    // 2. Base64 fallback (e.g. for small client screenshots / proofs)
    const { filename, fileData, isPublic } = req.body;
    if (!filename || !fileData) {
      return res.status(400).json({ success: false, message: 'No file uploaded or missing fileData' });
    }

    const isImage = /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(filename) || isPublic;
    const base64Content = fileData.includes('base64,') ? fileData.split('base64,')[1] : fileData;
    const buffer = Buffer.from(base64Content, 'base64');
    const sizeStr = formatBytes(buffer.length);

    if (isImage) {
      const publicPath = savePublicUpload(filename, buffer);
      return res.json({
        success: true,
        filename: path.basename(publicPath),
        originalName: filename,
        filesize: sizeStr,
        url: publicPath,
        isImage: true,
      });
    } else {
      const safeName = saveVaultFile(filename, buffer);
      return res.json({
        success: true,
        filename: safeName,
        originalName: filename,
        filesize: sizeStr,
        url: `/api/downloads/file/${safeName}`,
        isImage: false,
      });
    }
  } catch (err: any) {
    console.error('Upload error:', err);
    return res.status(500).json({ success: false, message: err.message || 'File upload failed' });
  }
});

// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DigiVault server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
