import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Order, CartItem } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean; // True only if authenticated Google email === OWNER_EMAIL
  isOwner: boolean;
  ownerEmail?: string;
  cart: CartItem[];
  cartCount: number;
  myOrders: Order[];
  loginWithGoogle: (email: string, name?: string, avatar?: string) => Promise<boolean>;
  loginAsOwner: (password?: string, email?: string) => Promise<{ success: boolean; message?: string }>;
  openGoogleOAuth: () => Promise<void>;
  logout: () => void;
  addToCart: (itemId: string) => Promise<boolean>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  pendingCheckoutItemId: string | null;
  setPendingCheckoutItemId: (id: string | null) => void;
  themeMode: 'dark' | 'light';
  toggleTheme: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [ownerEmail, setOwnerEmail] = useState<string>('vmanjeet773@gmail.com');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [pendingCheckoutItemId, setPendingCheckoutItemId] = useState<string | null>(null);

  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('digivault_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('digivault_theme', themeMode);
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const refreshUserData = async () => {
    const email = localStorage.getItem('digivault_user_email');
    if (!email) {
      setUser(null);
      setIsOwner(false);
      setCart([]);
      setMyOrders([]);
      return;
    }

    try {
      const meRes = await api.getMe();
      if (meRes.success && meRes.user) {
        setUser(meRes.user);
        setIsOwner(meRes.isOwner);
        if (meRes.ownerEmail) setOwnerEmail(meRes.ownerEmail);

        // Fetch user cart
        const cartRes = await api.getCart();
        if (cartRes.success) setCart(cartRes.cart);

        // Fetch user orders
        const ordersRes = await api.getOrders(meRes.user.email);
        if (ordersRes.success) setMyOrders(ordersRes.orders);
      } else {
        // Clear stale session
        setUser(null);
        setIsOwner(false);
        setCart([]);
        setMyOrders([]);
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
    }
  };

  useEffect(() => {
    refreshUserData();

    // Listen for OAuth message from Google popup callback
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'DIGIVAULT_GOOGLE_AUTH_SUCCESS') {
        const authData = event.data;
        if (authData.user && authData.token) {
          localStorage.setItem('digivault_auth_token', authData.token);
          localStorage.setItem('digivault_user_email', authData.user.email);
          setUser(authData.user);
          setIsOwner(authData.user.role === 'admin');
          refreshUserData();
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  const loginWithGoogle = async (email: string, name?: string, avatar?: string): Promise<boolean> => {
    try {
      const res = await api.googleLogin({ email, name, avatar });
      if (res.success && res.user) {
        localStorage.setItem('digivault_auth_token', res.token);
        localStorage.setItem('digivault_user_email', res.user.email);
        setUser(res.user);
        setIsOwner(res.isOwner);
        await refreshUserData();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Google login error:', err);
      return false;
    }
  };

  const loginAsOwner = async (password?: string, email?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await api.ownerLogin({ password, email });
      if (res.success && res.user && res.token) {
        localStorage.setItem('digivault_auth_token', res.token);
        localStorage.setItem('digivault_user_email', res.user.email);
        setUser(res.user);
        setIsOwner(true);
        await refreshUserData();
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || 'Owner authentication failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error during owner login' };
    }
  };

  const openGoogleOAuth = async () => {
    try {
      const res = await api.getGoogleAuthUrl();
      if (res.success && res.url) {
        const authWindow = window.open(
          res.url,
          'google_oauth_popup',
          'width=540,height=680,menubar=no,toolbar=no,status=no'
        );
        if (!authWindow) {
          alert('Popup blocked. Please enable popups to authenticate with Google.');
        }
      }
    } catch (err) {
      console.error('Failed to open Google OAuth:', err);
    }
  };

  const logout = () => {
    localStorage.removeItem('digivault_auth_token');
    localStorage.removeItem('digivault_user_email');
    setUser(null);
    setIsOwner(false);
    setCart([]);
    setMyOrders([]);
    setPendingCheckoutItemId(null);
  };

  const addToCart = async (itemId: string): Promise<boolean> => {
    if (!user) {
      return false;
    }
    const res = await api.addToCart(itemId, 1);
    if (res.success) {
      setCart(res.cart);
      return true;
    }
    return false;
  };

  const removeFromCart = async (itemId: string) => {
    const res = await api.removeFromCart(itemId);
    if (res.success) {
      setCart(res.cart);
    }
  };

  const clearCart = async () => {
    const res = await api.clearCart();
    if (res.success) {
      setCart([]);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isAdmin: isOwner,
        isOwner,
        ownerEmail,
        cart,
        cartCount: cart.length,
        myOrders,
        loginWithGoogle,
        loginAsOwner,
        openGoogleOAuth,
        logout,
        addToCart,
        removeFromCart,
        clearCart,
        refreshUserData,
        pendingCheckoutItemId,
        setPendingCheckoutItemId,
        themeMode,
        toggleTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
