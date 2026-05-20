/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, FormEvent, useRef } from "react";
import { 
  Search, 
  ShoppingCart, 
  User as UserIcon, 
  Menu, 
  X, 
  ChevronRight, 
  Star, 
  Eye, 
  EyeOff, 
  Trash2, 
  Plus, 
  Minus,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Truck,
  Settings,
  ShieldCheck,
  LogOut,
  Upload,
  Heart,
  Cloud,
  RefreshCw,
  Edit2,
  Palette,
  Maximize2,
  Home,
  ShoppingBag,
  Share2,
  Link as LinkIcon,
  History,
  PlusCircle,
  Package,
  Users,
  AlertTriangle,
  Info
} from "lucide-react";
import { get as idbGet, set as idbSet, del as idbDel, clear as idbClear } from 'idb-keyval';

// --- Safe Storage Helpers ---
let storageDisabled = false;

const safeIdbSet = async (key: string, value: any) => {
  if (storageDisabled || !value) return;
  try {
    await idbSet(key, value);
  } catch (e: any) {
    const msg = e.message || "";
    if (msg.includes("closing") || msg.includes("NO_SPACE") || e.name === "QuotaExceededError" || e.name === "AbortError") {
      if (!storageDisabled) {
        console.warn("Storage is full or inaccessible. Switching to cloud-only mode.");
        storageDisabled = true;
      }
    }
  }
};

const safeIdbGet = async <T,>(key: string): Promise<T | undefined> => {
  if (storageDisabled) return undefined;
  try {
    return await idbGet<T>(key);
  } catch (e: any) {
    if (e.message?.includes("closing")) storageDisabled = true;
    return undefined;
  }
};

const safeLsSet = (key: string, value: string) => {
  if (storageDisabled) return;
  try {
    localStorage.setItem(key, value);
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.message?.includes("quota")) {
      storageDisabled = true;
    }
  }
};

const safeLsRemove = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch (e) {}
};

const safeLsGet = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
};

const safeIdbDel = async (key: string) => {
  if (storageDisabled) return;
  try {
    await idbDel(key);
  } catch (e: any) {
    if (e.message?.includes("closing")) storageDisabled = true;
  }
};

const safeIdbClear = async () => {
  if (storageDisabled) return;
  try {
    await idbClear();
  } catch (e: any) {
    if (e.message?.includes("closing")) storageDisabled = true;
  }
};
import { motion, AnimatePresence } from "motion/react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import { supabase } from "./lib/supabase";
import { Product, CartItem, User, Order, Review, Banner, FooterConfig, PromotionConfig, Category, Supplier, Purchase } from "./types";
import { initGoogleAuth, googleSignIn, googleLogout, getGoogleAccessToken } from "./services/googleAuth";
import { fetchGmailMessages, sendGmailMessage, GmailMessage } from "./services/gmailService";
import { User as FirebaseUser } from "firebase/auth";


// --- Mock Data ---
const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "iPhone 15 Pro Max - 256GB - Titanium",
    price: 154999,
    originalPrice: 169999,
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d256e?q=80&w=800&auto=format&fit=crop",
    category: "Electronics",
    rating: 4.8,
    reviewCount: 124,
    discount: 10,
    stock: 25,
    partNumber: "IPH-15PM-256-T",
    description: "The latest iPhone with Titanium design, A17 Pro chip, and advanced camera system. Experience the peak of mobile technology.",
    availableSizes: ["128GB", "256GB", "512GB", "1TB"],
    galleryImages: [
      "https://images.unsplash.com/photo-1694833211511-39c43ae67f13?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1695048132811-098863619574?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1695048133036-7dc94073361e?q=80&w=800&auto=format&fit=crop"
    ]
  },
  {
    id: "2",
    name: "Nike Air Max 270 - Premium Sneakers",
    price: 12500,
    originalPrice: 15000,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop",
    category: "Fashion",
    rating: 4.5,
    reviewCount: 89,
    discount: 16,
    stock: 4,
    partNumber: "NK-AM270-RD",
    description: "Iconic Nike Air Max 270 with a focus on all-day comfort and bold street style. Large Max Air unit provides responsive cushioning.",
    availableSizes: ["40", "41", "42", "43", "44", "45"],
    galleryImages: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1605348532760-6753d2c43329?q=80&w=800&auto=format&fit=crop"
    ]
  },
  {
    id: "3",
    name: "Luxury Minimalist Watch - Silver Edition",
    price: 5500,
    originalPrice: 7500,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop",
    category: "Fashion",
    rating: 4.2,
    reviewCount: 56,
    discount: 26,
    stock: 0,
    galleryImages: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1526045431048-f857369aba09?q=80&w=800&auto=format&fit=crop"
    ]
  },
  {
    id: "4",
    name: "Sony WH-1000XM5 Wireless Headphones",
    price: 34999,
    originalPrice: 39999,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop",
    category: "Electronics",
    rating: 4.9,
    reviewCount: 210,
    discount: 12,
    stock: 12
  },
  {
    id: "5",
    name: "Wooden Coffee Table - Hardwood Finish",
    price: 8999,
    originalPrice: 12000,
    image: "https://images.unsplash.com/photo-1530018607912-eff2df114fbe?q=80&w=800&auto=format&fit=crop",
    category: "Home & Living",
    rating: 4.3,
    reviewCount: 42,
    discount: 25,
    stock: 3
  },
  {
    id: "6",
    name: "Canon EOS R5 Mirrorless Camera",
    price: 289999,
    originalPrice: 310000,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop",
    category: "Electronics",
    rating: 4.7,
    reviewCount: 75,
    discount: 6,
    stock: 1
  }
];

const BANNERS = [
  "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1607082349566-187342175e2f?q=80&w=1920&auto=format&fit=crop"
];


const BannerSection = ({ 
  banner, 
  onShopNow 
}: { 
  banner: Banner; 
  onShopNow: (category?: string) => void;
}) => {
  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{ backgroundColor: banner.backgroundColor }}
      className={`h-48 md:h-64 rounded-xl ${!banner.backgroundColor ? 'bg-gradient-to-br from-primary to-primary-hover' : ''} p-6 md:p-10 flex items-center justify-between text-white shadow-lg shrink-0 overflow-hidden relative w-full`}
    >
      {banner.imageUrl && (
        <div className="absolute inset-0 z-0">
          <img src={banner.imageUrl} alt="" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
        </div>
      )}
      <div className="z-10 relative">
        <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Featured</span>
        <h2 className="text-3xl md:text-5xl font-extrabold my-2 leading-tight" style={{ color: banner.textColor }}>{banner.title}</h2>
        <p className="text-base md:text-lg opacity-90 mb-4" style={{ color: banner.textColor }}>{banner.subtitle}</p>
        <button 
          onClick={() => onShopNow(banner.categoryLink)}
          className="bg-white text-primary px-8 py-2.5 rounded-full font-bold shadow-xl hover:scale-105 transition-transform active:scale-95"
        >
          {banner.buttonText}
        </button>
      </div>
      {!banner.imageUrl && (
        <div className="text-[160px] md:text-[220px] opacity-10 absolute -right-6 -bottom-10 transform rotate-12 select-none font-bold italic pointer-events-none text-white">
          AZ
        </div>
      )}
    </motion.section>
  );
};


// --- Email Notification Helpers ---
const generateEmailTemplate = (title: string, content: string, orderId?: string) => `
  <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
    <div style="background-color: #f85606; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Buy A to z</h1>
    </div>
    <div style="padding: 32px;">
      <h2 style="color: #1a1a1a; margin-top: 0; font-size: 20px; font-weight: 700;">${title}</h2>
      ${orderId ? `<p style="font-size: 14px; color: #666; margin-bottom: 24px;">Order ID: <strong>${orderId}</strong></p>` : ''}
      <div style="color: #444; font-size: 16px; line-height: 1.6;">
        ${content}
      </div>
      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; text-align: center;">
        <p style="font-size: 14px; color: #888; margin-bottom: 8px;">Need help? Contact our support team.</p>
        <p style="font-size: 14px; color: #f85606; font-weight: 600; margin: 0;">01953550598</p>
      </div>
    </div>
    <div style="background-color: #fafafa; padding: 16px; text-align: center; border-top: 1px solid #eee;">
      <p style="font-size: 12px; color: #aaa; margin: 0;">&copy; 2026 Buy A to z. All rights reserved.</p>
    </div>
  </div>
`;

const generateDeliveryAndPricingHtml = (order: Order) => {
  const deliveryType = order.delivery?.deliveryType || "standard";
  const deliveryMethod = deliveryType === "express" ? "Express Delivery (1-2 Days)" : "Standard Delivery (3-5 Days)";
  const deliveryCharge = deliveryType === "express" ? 120 : 50;
  
  // Create beautiful display list of order items if they are present
  let itemsHtml = "";
  if (order.items && order.items.length > 0) {
    itemsHtml = `
      <p style="font-size: 13px; font-weight: 700; color: #1a1a1a; margin: 20px 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">Ordered Items / অর্ডারকৃত পণ্যসমূহ:</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden; font-size: 13px;">
        <thead>
          <tr style="background-color: #fafafa;">
            <th style="padding: 10px 12px; font-size: 11px; font-weight: 700; color: #666; text-align: left; border-bottom: 1px solid #eee;">Item</th>
            <th style="padding: 10px 12px; font-size: 11px; font-weight: 700; color: #666; text-align: right; border-bottom: 1px solid #eee;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map((item: any) => `
            <tr>
              <td style="padding: 10px 12px; border-bottom: 1px solid #f5f5f5; color: #333;">
                <div style="font-weight: 600;">${item.name}</div>
                <div style="font-size: 11px; color: #888; margin-top: 3px;">
                  Qty: ${item.quantity} 
                  ${item.selectedSize ? `• Size: ${item.selectedSize}` : ''} 
                  ${item.selectedColor ? `• Color: ${item.selectedColor}` : ''}
                </div>
              </td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #f5f5f5; text-align: right; font-weight: 600; color: #1a1a1a;">৳${(item.price * item.quantity).toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  return `
    ${itemsHtml}
    <div style="background: #fafafa; border: 1px solid #eee; border-radius: 12px; padding: 20px; margin: 20px 0; font-family: 'Inter', sans-serif;">
      <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: #1a1a1a; text-transform: uppercase; letter-spacing: 0.8px;">Delivery & Details / ডেলিভারি ও মূল্য বিবরণী</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #444;">
        <tr>
          <td style="padding: 6px 0;"><strong>Delivery Method / ডেলিভারি মেথড:</strong></td>
          <td style="padding: 6px 0; text-align: right; color: #f85606; font-weight: 700;">${deliveryMethod}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0;"><strong>Delivery Charge / ডেলিভারি চার্জ:</strong></td>
          <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #1a1a1a;">৳${deliveryCharge}</td>
        </tr>
        ${order.delivery?.address ? `
        <tr>
          <td style="padding: 6px 0; vertical-align: top;"><strong>Delivery Address / ঠিকানা:</strong></td>
          <td style="padding: 6px 0; text-align: right; color: #666; font-size: 11px; max-width: 250px; line-height: 1.4;">
            ${order.delivery.address}${order.delivery.area ? `, ${order.delivery.area}` : ''}${order.delivery.city ? `, ${order.delivery.city}` : ''}
          </td>
        </tr>` : ''}
        ${order.payment?.method ? `
        <tr>
          <td style="padding: 6px 0;"><strong>Payment Method / পেমেন্ট:</strong></td>
          <td style="padding: 6px 0; text-align: right; font-weight: 600; text-transform: uppercase; color: #333;">${order.payment.method}</td>
        </tr>` : ''}
        <tr>
          <td style="padding: 12px 0 0 0; border-top: 1px dashed #ddd; font-weight: bold; font-size: 14px; color: #1a1a1a;">Total Amount / সর্বমোট মূল্য:</td>
          <td style="padding: 12px 0 0 0; border-top: 1px dashed #ddd; text-align: right; font-weight: 800; font-size: 16px; color: #f85606;">৳${order.total.toLocaleString()}</td>
        </tr>
      </table>
    </div>
  `;
};

const sendEmailNotification = async (to: string, subject: string, html: string) => {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to, subject, html }),
    });

    if (!response.ok) {
      const data = await response.json();
      console.warn("Email service error:", data.error);
      // If it's a critical SMTP error, alert the admin so they know to fix settings
      if (data.error.includes("SMTP") || data.error.includes("App Password")) {
        alert("Email Notification Failed: " + data.error);
      }
    }
  } catch (error) {
    console.error("Error calling send-email API:", error);
  }
};

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const triggerConfirm = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    variant: 'danger' | 'warning' | 'info' = 'danger',
    confirmText = "Delete",
    cancelText = "Cancel"
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        await onConfirm();
      },
      variant,
      confirmText,
      cancelText
    });
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [orderDateFilter, setOrderDateFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [signupStep, setSignupStep] = useState<1 | 2>(1);
  const [signupUserData, setSignupUserData] = useState<User | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [userEnteredCode, setUserEnteredCode] = useState<string>("");
  const [authMessage, setAuthMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Google Workspace States
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([]);
  const [isGmailLoading, setIsGmailLoading] = useState(false);
  const [showGmailView, setShowGmailView] = useState(false);

  // Admin states
  const isAdminEmail = currentUser?.email === "udayonbiswas2003@gmail.com";
  const [isAdmin, setIsAdmin] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'error' | 'syncing' | 'idle'>('idle');
  
  // -- Authentication Listeners --
  useEffect(() => {
    // Graceful error suppression for AbortError (interrupted/cancelled requests)
    const handleGlobalRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (reason) {
        const name = reason.name;
        const msg = reason.message || "";
        if (
          name === "AbortError" || 
          msg.includes("AbortError") || 
          msg.includes("user aborted") || 
          msg.includes("The user aborted a request") ||
          msg.includes("abort")
        ) {
          event.preventDefault();
          event.stopPropagation();
          console.warn("Gracefully suppressed background AbortError promise rejection.");
        }
      }
    };

    const handleGlobalError = (event: ErrorEvent) => {
      const error = event.error;
      if (error) {
        const name = error.name;
        const msg = error.message || "";
        if (
          name === "AbortError" || 
          msg.includes("AbortError") || 
          msg.includes("user aborted") || 
          msg.includes("The user aborted a request") ||
          msg.includes("abort")
        ) {
          event.preventDefault();
          event.stopPropagation();
          console.warn("Gracefully suppressed background AbortError event.");
        }
      }
    };

    window.addEventListener("unhandledrejection", handleGlobalRejection);
    window.addEventListener("error", handleGlobalError);

    // Initialize Google Workspace Auth
    initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event, session?.user?.email);
      
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        // Enforce a timeout for the sync logic
        const syncTimeout = setTimeout(() => {
          setIsAuthModalOpen(false);
          setIsAuthLoading(false);
        }, 8000);

        try {
          const sbUser = session.user;
          
          // Fetch existing user data from database to avoid overwriting profile fields like mobileNumber
          const { data: existingDbUser } = await supabase
            .from('users')
            .select('*')
            .eq('uid', sbUser.id)
            .maybeSingle();

          const domesticUser: any = {
            uid: sbUser.id,
            fullName: sbUser.user_metadata.full_name || sbUser.user_metadata.name || sbUser.email?.split('@')[0] || "User",
            email: sbUser.email || null,
            mobileNumber: sbUser.user_metadata.phone || sbUser.phone || existingDbUser?.mobileNumber || null,
            password: "oauth-managed",
            avatar: sbUser.user_metadata.avatar_url || sbUser.user_metadata.picture || existingDbUser?.avatar || "",
            role: existingDbUser?.role || (sbUser.email === "udayonbiswas2003@gmail.com" ? 'admin' : 'user'),
            isAdmin: existingDbUser?.isAdmin || (sbUser.email === "udayonbiswas2003@gmail.com"),
            isVerified: true
          };
          
          setCurrentUser(domesticUser);
          setIsAdmin(domesticUser.isAdmin);
          
          try {
            await safeIdbSet("buy_a_to_z_user", domesticUser);
            safeLsSet("buy_a_to_z_user", JSON.stringify(domesticUser));
          } catch (e) {}

          // Cloud Sync with failure tolerance
          const { error: upsertErr } = await supabase.from('users').upsert([domesticUser]);
          if (upsertErr && upsertErr.message.includes("mobileNumber")) {
             const { mobileNumber, ...scrubbed } = domesticUser;
             await supabase.from('users').upsert([scrubbed]);
          }
        } catch (e) {
          console.warn("Auth sync warning:", e);
        } finally {
          clearTimeout(syncTimeout);
          setIsAuthModalOpen(false);
          setIsAuthLoading(false);
          setIsInitialLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setIsAdmin(false);
        try {
          await safeIdbDel("buy_a_to_z_user");
          safeLsRemove("buy_a_to_z_user");
        } catch (e) {}
        setIsAuthLoading(false);
        setIsInitialLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("unhandledrejection", handleGlobalRejection);
      window.removeEventListener("error", handleGlobalError);
    };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
        alert("Google account connected successfully!");
      }
    } catch (error) {
      console.error("Google sign in failed:", error);
    }
  };

  const handleGoogleLogout = async () => {
    await googleLogout();
    setGoogleUser(null);
    setGoogleToken(null);
    setGmailMessages([]);
  };

  const loadGmailMessages = async () => {
    if (!googleToken) return;
    setIsGmailLoading(true);
    try {
      const msgs = await fetchGmailMessages(googleToken);
      setGmailMessages(msgs);
    } catch (err) {
      console.error("Failed to load Gmail:", err);
    } finally {
      setIsGmailLoading(false);
    }
  };

  useEffect(() => {
    if (googleToken && showGmailView) {
      loadGmailMessages();
    }
  }, [googleToken, showGmailView]);

  const [cloudError, setCloudError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    if (currentUser?.email === "udayonbiswas2003@gmail.com" || currentUser?.isAdmin) {
      setIsAdmin(true);
    }
  }, [currentUser]);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [adminTab, setAdminTab] = useState<"dashboard" | "products" | "orders" | "users" | "homepage" | "footer" | "promo" | "categories" | "database" | "purchases">("dashboard");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [adminPurchaseView, setAdminPurchaseView] = useState<'list' | 'add' | 'suppliers'>('list');
  const [purchaseFormItems, setPurchaseFormItems] = useState<{ productId: string, productName: string, quantity: number, costPrice: number }[]>([]);
  const [purchaseProductSearch, setPurchaseProductSearch] = useState("");
  const [editPurchaseItems, setEditPurchaseItems] = useState<{ productId: string, productName: string, quantity: number, costPrice: number }[]>([]);
  const [adminProductView, setAdminProductView] = useState<'list' | 'edit'>('list');
  const [adminOrderView, setAdminOrderView] = useState<'list' | 'detail'>('list');
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [selectedAdminOrder, setSelectedAdminOrder] = useState<Order | null>(null);
  const [editingSystemUser, setEditingSystemUser] = useState<any | null>(null);
  const [isUserEditModalOpen, setIsUserEditModalOpen] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([
    { id: "1", name: "Electronics", icon: "📱" },
    { id: "2", name: "Fashion", icon: "👗" },
    { id: "3", name: "Home & Living", icon: "🏠" },
    { id: "4", name: "Health & Beauty", icon: "💄" },
    { id: "5", name: "Sports & Outdoor", icon: "🏀" },
    { id: "6", name: "Groceries", icon: "👶" },
    { id: "7", name: "Automotive", icon: "🚗" },
  ]);

  // Gmail Messages Component
  const GmailView = () => {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-daraz-text">Gmail Inbox</h3>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={loadGmailMessages}
              disabled={isGmailLoading}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isGmailLoading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={() => setShowGmailView(false)}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!googleToken ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-secondary" />
              </div>
              <h4 className="font-bold text-daraz-text mb-2">Connect your Gmail</h4>
              <p className="text-xs text-gray-500 mb-6">Authorize this app to access your Gmail and send verification emails.</p>
              <button 
                onClick={handleGoogleSignIn}
                className="gsi-material-button w-full max-w-xs"
                style={{ height: '40px' }}
              >
                <div className="gsi-material-button-state"></div>
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlns:xlink="http://www.w3.org/1999/xlink" style={{ display: 'block' }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">Sign in with Google</span>
                  <span style={{ display: 'none' }}>Sign in with Google</span>
                </div>
              </button>
            </div>
          ) : isGmailLoading ? (
            <div className="p-8 flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="text-xs text-gray-400 font-bold lowercase tracking-widest">Fetching emails...</p>
            </div>
          ) : gmailMessages.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-sm text-gray-400">No recent messages found.</p>
            </div>
          ) : (
            <div className="divide-y">
              {gmailMessages.map((msg) => (
                <div key={msg.id} className="p-4 hover:bg-orange-50/30 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[11px] font-bold text-secondary truncate max-w-[150px] uppercase tracking-wide">
                      {msg.from?.split('<')[0] || "Unknown Sender"}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {msg.date ? format(new Date(msg.date), 'MMM dd, HH:mm') : ''}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-daraz-text mb-1 group-hover:text-primary truncate">
                    {msg.subject || "(No Subject)"}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {msg.snippet}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {googleUser && (
          <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={googleUser.photoURL || ''} alt="" className="w-6 h-6 rounded-full border border-white shadow-sm" />
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-daraz-text truncate">{googleUser.displayName}</p>
                <p className="text-[9px] text-gray-400 truncate">{googleUser.email}</p>
              </div>
            </div>
            <button onClick={handleGoogleLogout} className="text-[10px] font-bold text-secondary hover:underline">
              DISCONNECT
            </button>
          </div>
        )}
      </div>
    );
  };
  const adminStats = useMemo(() => {
    const totalRevenue = (orders || []).reduce((acc, order) => order.status !== 'cancelled' ? acc + order.total : acc, 0);
    const totalOrders = (orders || []).length;
    const totalUsers = (users || []).length;
    const totalProducts = (products || []).length;
    
    // Revenue over last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), i);
      const dayStr = format(d, 'MMM dd');
      const dayTotal = (orders || []).filter(o => 
        o.status !== 'cancelled' && 
        isWithinInterval(new Date(o.timestamp), { start: startOfDay(d), end: endOfDay(d) })
      ).reduce((acc, o) => acc + o.total, 0);
      return { name: dayStr, total: dayTotal };
    }).reverse();

    // Orders by status
    const statusData = [
      { name: 'Processing', value: (orders || []).filter(o => o.status === 'processing').length, color: '#f85606' },
      { name: 'Shipped', value: (orders || []).filter(o => o.status === 'shipped').length, color: '#16a34a' },
      { name: 'Delivered', value: (orders || []).filter(o => o.status === 'delivered').length, color: '#2563eb' },
      { name: 'Cancelled', value: (orders || []).filter(o => o.status === 'cancelled').length, color: '#dc2626' }
    ].filter(s => s.value > 0);

    // Categories Distribution
    const categoryDist = categories.map(cat => ({
      name: cat.name,
      value: products.filter(p => p.category === cat.name).length
    })).filter(c => c.value > 0);

    return {
      totalRevenue,
      totalOrders,
      totalUsers,
      totalProducts,
      last7Days,
      statusData,
      categoryDist
    };
  }, [orders, users, products, categories]);
  const [promotionConfig, setPromotionConfig] = useState<PromotionConfig>({
    title: "NEW USER DISCOUNT",
    description: "Get ৳200 OFF on your first purchase!",
    discountAmount: 200,
    isActive: true
  });
  const [footerConfig, setFooterConfig] = useState<FooterConfig>({
    companyName: "Buy A to z",
    logoUrl: "",
    showName: true,
    copyrightText: "2026 Marketplace",
    customerCareText: "Customer Care",
    customerCarePhone: "01953550598",
    sellOnText: "Sell on A to z",
    appDownloadText: "App Download",
    appDownloadLink: "#",
    showSecuredBy: true
  });
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<"info" | "wishlist" | "security">("info");

  // Changed Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Review states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [copySuccessId, setCopySuccessId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [productSelectedSizes, setProductSelectedSizes] = useState<Record<string, string>>({});
  const [productSelectedColors, setProductSelectedColors] = useState<Record<string, string>>({});
  const [productReviews, setProductReviews] = useState<Review[]>([]);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  // Authentication states
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // --- Cloud Sync Helpers ---
  const syncToCloud = async (table: string, data: any, options: { method?: 'upsert' | 'insert' | 'update' | 'delete', match?: any } = {}) => {
    const method = options.method || 'upsert';
    setCloudStatus('syncing');
    try {
      let query: any = supabase.from(table);
      
      if (method === 'upsert') {
        const { error } = await query.upsert(data);
        if (error) throw error;
      } else if (method === 'insert') {
        const { error } = await query.insert(data);
        if (error) throw error;
      } else if (method === 'update') {
        const { error } = await query.update(data).match(options.match || {});
        if (error) throw error;
      } else if (method === 'delete') {
        const { error } = await query.delete().match(options.match || {});
        if (error) throw error;
      }
      
      setCloudStatus('connected');
      setCloudError(null);
      setLastSyncTime(new Date());
      return { success: true };
    } catch (e: any) {
      console.error(`Sync failed for ${table}:`, e);
      setCloudStatus('error');
      setCloudError(e.message || "Unknown Cloud Error");
      return { success: false, error: e };
    }
  };

  const testConnection = async () => {
    setCloudStatus('syncing');
    try {
      const { error } = await supabase.from('configs').select('key').limit(1);
      if (error) throw error;
      setCloudStatus('connected');
      setCloudError(null);
      alert("✅ Supabase Connection Successful!");
    } catch (e: any) {
      setCloudStatus('error');
      setCloudError(e.message);
      alert(`⚠️ ক্লাউড ব্যাকআপ সফল হয়নি: ${e.message}\n\nপরামর্শ: "Fix DB" ট্যাব থেকে SQL কোডটি রান করুন। আপনি আগে ডাটাবেস টেবিলগুলো তৈরি করেছেন কিনা নিশ্চিত করুন।`);
      setAdminTab("database");
    }
  };
  const syncBannersToCloud = async (updatedBanners: Banner[]) => {
    try {
      // Clear existing and replace with new set to keep it simple, or use upsert
      const { error } = await supabase.from('banners').upsert(updatedBanners);
      if (error) console.error("Error syncing banners:", error);
    } catch (e) {
      console.error("Banner sync failed:", e);
    }
  };

  const syncSidebarBannersToCloud = async (updatedSidebar: string[]) => {
    try {
      const { error } = await supabase.from('configs').upsert({ 
        key: 'sidebar_banners', 
        value: updatedSidebar 
      }, { onConflict: 'key' });
      if (error) console.error("Error syncing sidebar banners:", error);
    } catch (e) {
      console.error("Sidebar banner sync failed:", e);
    }
  };

  const saveFooterConfig = async (updated: FooterConfig) => {
    setFooterConfig(updated);
    await safeIdbSet("buy_a_to_z_footer", updated);
    try {
      const { error } = await supabase.from('configs').upsert({ key: 'footer', value: updated }, { onConflict: 'key' });
      if (error) throw error;
    } catch (e: any) {
      console.error("Footer sync failed:", e);
      alert(`⚠️ ফুটার সেটিংস ক্লাউডে সেভ হয়নি: ${e.message}`);
    }
  };

  const savePromotionConfig = async (updated: PromotionConfig) => {
    setPromotionConfig(updated);
    await safeIdbSet("buy_a_to_z_promotion", updated);
    try {
      const { error } = await supabase.from('configs').upsert({ key: 'promotion', value: updated }, { onConflict: 'key' });
      if (error) throw error;
    } catch (e: any) {
      console.error("Promotion sync failed:", e);
      alert(`⚠️ প্রোমো সেটিংস ক্লাউডে সেভ হয়নি: ${e.message}`);
    }
  };

  const handleOpenProduct = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setSelectedSize(null);
    setSelectedColor(null);
    setActiveDetailImage(product.image);
  };

  const handleShareProduct = (productId: string) => {
    // Determine the full URL including query param
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('product', productId);
    
    // Copy to clipboard
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopySuccessId(productId);
      setTimeout(() => setCopySuccessId(null), 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      // Fallback for some browsers
      const textArea = document.createElement("textarea");
      textArea.value = url.toString();
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopySuccessId(productId);
        setTimeout(() => setCopySuccessId(null), 2000);
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
    });
  };

  // Helper for image upload with compression
  const compressImage = (file: File, maxWidth = 300, maxHeight = 300, quality = 0.6): Promise<string> => 
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(event.target?.result as string);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });

  const toBase64 = async (file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
    // If it's an image, compress it
    if (file.type.startsWith("image/")) {
      return compressImage(file, maxWidth, maxHeight, quality);
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const [uploadedProductImage, setUploadedProductImage] = useState<string>("");
  const [editingGalleryImages, setEditingGalleryImages] = useState<string[]>([]);
  const [uploadedAvatar, setUploadedAvatar] = useState<string>("");

  const [sidebarBanners, setSidebarBanners] = useState<string[]>([]);
  const [currentSidebarIndex, setCurrentSidebarIndex] = useState(0);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [newGalleryUrl, setNewGalleryUrl] = useState("");
  const [wishlistedProductIds, setWishlistedProductIds] = useState<string[]>([]);

  const [activeDetailImage, setActiveDetailImage] = useState<string | null>(null);

  // Sync activeDetailImage and size with selectedProduct
  useEffect(() => {
    if (selectedProduct) {
      setActiveDetailImage(selectedProduct.image);
      setSelectedSize(null);
      setSelectedColor(null);
    } else {
      setActiveDetailImage(null);
      setSelectedSize(null);
      setSelectedColor(null);
    }
  }, [selectedProduct]);

  // Cart Persistence
  useEffect(() => {
    const saveCart = async () => {
      if (cart.length > 0) {
        await safeIdbSet("buy_a_to_z_cart", cart);
      } else {
        await safeIdbDel("buy_a_to_z_cart");
      }
    };
    saveCart();
  }, [cart]);

  // Sync gallery images with editing product
  useEffect(() => {
    if (editingProduct) {
      setEditingGalleryImages(editingProduct.galleryImages || []);
    } else {
      setEditingGalleryImages([]);
    }
  }, [editingProduct?.id]);

  // Auto-slide main banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  // Safety effect to clear stuck loading states
  useEffect(() => {
    if (isInitialLoading) {
      const timer = setTimeout(() => {
        console.warn("Initial load taking too long, clearing spinner.");
        setIsInitialLoading(false);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [isInitialLoading]);
  useEffect(() => {
    const loadData = async () => {
      setIsInitialLoading(true);
      // 1. Auth (Local remains primary, but profile could sync)
      let userData: User | null = null;
      const idbUser = await safeIdbGet<User>("buy_a_to_z_user");
      if (idbUser) {
        userData = idbUser;
      }
      
      if (userData) {
        setCurrentUser(userData);
        setIsAdmin(userData.isAdmin || userData.email === "udayonbiswas2003@gmail.com" || false);
      }

      // Supabase Data Fetching
      try {
        // Parallelized fetches for better performance
        const [
          { data: dbProducts },
          { data: dbOrders },
          { data: dbBanners },
          { data: dbCats },
          { data: dbConfigs },
          { data: sidebarData },
          { data: dbReviews },
          { data: dbSuppliers },
          { data: dbPurchases }
        ] = await Promise.all([
          supabase.from('products').select('*'),
          supabase.from('orders').select('*').order('timestamp', { ascending: false }),
          supabase.from('banners').select('*'),
          supabase.from('categories').select('*'),
          supabase.from('configs').select('*'),
          supabase.from('configs').select('value').eq('key', 'sidebar_banners').maybeSingle(),
          supabase.from('reviews').select('*'),
          supabase.from('suppliers').select('*'),
          supabase.from('purchases').select('*').order('timestamp', { ascending: false })
        ]);

        // Process results
        if (dbProducts) setProducts(dbProducts as Product[]);
        if (dbOrders) setOrders(dbOrders as Order[]);
        if (dbBanners) setBanners(dbBanners as Banner[]);
        if (dbCats) setCategories(dbCats as Category[]);
        if (dbConfigs) {
          const f = dbConfigs.find(c => c.key === 'footer')?.value;
          const p = dbConfigs.find(c => c.key === 'promotion')?.value;
          if (f) setFooterConfig(f);
          if (p) setPromotionConfig(p);
        }
        if (sidebarData) setSidebarBanners(sidebarData.value);
        if (dbReviews) setProductReviews(dbReviews as Review[]);
        if (dbSuppliers) setSuppliers(dbSuppliers as Supplier[]);
        if (dbPurchases) setPurchases(dbPurchases as Purchase[]);
        
        // Verification fetch for users table
        const { data: dbUsers } = await supabase.from('users').select('*');
        if (dbUsers) {
          setUsers(dbUsers);
          if (userData) {
            const fresh = dbUsers.find((u: any) => u.uid === userData?.uid || u.email === userData?.email);
            if (fresh) {
              const isAdminEmail = fresh.email === "udayonbiswas2003@gmail.com";
              const updatedStatus = fresh.isAdmin || fresh.role === 'admin' || isAdminEmail;
              setIsAdmin(updatedStatus);
            }
          }
        }
      } catch (e) {
        console.error("Supabase initial load failed:", e);
      } finally {
        setIsInitialLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Handle Deep Linking to Product
  useEffect(() => {
    if (products.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const productId = urlParams.get('product');
      if (productId) {
        const product = products.find(p => p.id === productId);
        if (product) {
          handleOpenProduct(product);
        }
      }
    }
  }, [products]);

  useEffect(() => {
    if (wishlistedProductIds.length > 0) {
      safeIdbSet("buy_a_to_z_wishlist", wishlistedProductIds);
    }
  }, [wishlistedProductIds]);

  // Auto-slide for sidebar banners
  useEffect(() => {
    if (sidebarBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSidebarIndex(prev => (prev + 1) % sidebarBanners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [sidebarBanners]);

  // Sync user orders when orders or currentUser changes
  useEffect(() => {
    if (currentUser) {
      setUserOrders(orders.filter(o => o.customerId === currentUser.uid));
    } else {
      setUserOrders([]);
    }
  }, [orders, currentUser]);

  // Filter products using state
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (p.partNumber || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All Categories" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, products]);

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");

  // Delivery states
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Dhaka");
  const [area, setArea] = useState("");
  const [deliveryType, setDeliveryType] = useState<"standard" | "express">("standard");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bkash" | "card">("cod");

  // Admin Actions
  const handleAddProduct = async (newProduct: any) => {
    // 1. Update local state immediately
    const updated = [newProduct, ...products];
    setProducts(updated);
    await safeIdbSet("buy_a_to_z_products", updated);
    
    // 2. Supabase sync in background
    try {
      const { success, error } = await syncToCloud('products', newProduct, { method: 'insert' });
      if (!success) {
        console.error("Supabase insert failed:", error);
      alert(`⚠️ লোকালি সেভ হয়েছে, কিন্তু ক্লাউড ব্যাকআপ সফল হয়নি।\n\nভুল: ${error?.message || "Unknown error"}\nপরামর্শ: অনুগ্রহ করে "Fix DB" চেক করুন।`);
      setAdminTab("database");
      }
    } catch (e: any) {
      console.error("Supabase insert failed:", e);
      setCloudStatus('error');
      setCloudError(e.message);
      alert(`⚠️ লোকালি সেভ হয়েছে, কিন্তু ক্লাউড ব্যাকআপ সফল হয়নি।\n\nভুল: ${e.message}\nপরামর্শ: আপনাকে "Fix DB" ট্যাব থেকে SQL রান করতে হতে পারে।`);
      setAdminTab("database");
    }
    
    alert("Product added successfully!");
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    // 1. Update local state immediately for fast UI feedback
    const updated = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    setProducts(updated);
    await safeIdbSet("buy_a_to_z_products", updated);
    
    // 2. Clear editing state
    setEditingProduct(null);
    setUploadedProductImage("");

    // 3. Supabase sync in background
    try {
      const { id, created_at, ...payload } = updatedProduct as any;
      const { success, error } = await syncToCloud('products', payload, { method: 'update', match: { id: updatedProduct.id } });
      
      if (!success) {
        alert(`⚠️ ক্লাউড ব্যাকআপ সফল হয়নি, কিন্তু লোকালি সেভ হয়েছে।\n\nভুল: ${error?.message || "Verify your connection"}\nপরামর্শ: কলামগুলো ঠিক আছে কিনা নিশ্চিত করতে "Fix DB" ট্যাব ব্যবহার করুন।`);
      setAdminTab("database");
      } else {
        alert("Product updated successfully and synced to cloud!");
      }
    } catch (e: any) {
      console.error("Supabase sync failed:", e);
      alert(`⚠️ লোকালি সেভ হয়েছে, কিন্তু ক্লাউডে ব্যাকআপ হয়নি: ${e.message}\n\nসমাধান: "Fix DB" ট্যাব থেকে SQL কোড রান করুন।`);
    }
  };

  const handleDeleteProduct = (id: string) => {
    triggerConfirm(
      "প্রোডাক্ট ডিলিট করুন",
      "Are you sure you want to delete this product? This action cannot be undone.",
      async () => {
        try {
          const updated = products.filter(p => p.id !== id);
          setProducts(updated);
          await safeIdbSet("buy_a_to_z_products", updated);

          const { error } = await supabase.from('products').delete().eq('id', id);
          if (error) throw error;
          
          alert("✅ প্রোডাক্টটি সফলভাবে ডিলিট হয়েছে!");
        } catch (e: any) {
          console.error("Cloud delete product failed:", e);
          alert(`❌ ক্লাউড থেকে ডিলিট করা যায়নি: ${e.message || "অজানা সমস্যা"}`);
        }
      },
      'danger',
      'Delete',
      'Cancel'
    );
  };

  const handleDeleteOrder = (id: string) => {
    triggerConfirm(
      "অর্ডার ডিলিট করুন",
      "Are you sure you want to delete this order? This action cannot be undone.",
      async () => {
        try {
          const updated = orders.filter(o => o.id !== id);
          setOrders(updated);
          await safeIdbSet("buy_a_to_z_orders", updated);

          const { error } = await supabase.from('orders').delete().eq('id', id);
          if (error) throw error;
          
          alert("✅ অর্ডারটি সফলভাবে ডিলিট হয়েছে!");
        } catch (e: any) {
          console.error("Cloud delete order failed:", e);
          alert(`❌ ক্লাউড থেকে ডিলিট করা যায়নি: ${e.message || "অজানা সমস্যা"}`);
        }
      },
      'danger',
      'Delete',
      'Cancel'
    );
  };

  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelSuccessId, setCancelSuccessId] = useState<string | null>(null);

  const updateOrderInCloud = async (orderId: string, updates: Partial<Order>) => {
    try {
      const existingOrder = orders.find(o => o.id === orderId);
      const { error } = await supabase.from('orders').update(updates).eq('id', orderId);
      if (error) throw error;
      
      const updated = orders.map(o => o.id === orderId ? { ...o, ...updates } : o);
      setOrders(updated);
      await safeIdbSet("buy_a_to_z_orders", updated);

      // If tracking details (carrier/number) are updated, let's notify the customer!
      if (existingOrder && (updates.trackingCarrier !== undefined || updates.trackingNumber !== undefined)) {
        const carrier = updates.trackingCarrier !== undefined ? updates.trackingCarrier : (existingOrder.trackingCarrier || "");
        const trackingNum = updates.trackingNumber !== undefined ? updates.trackingNumber : (existingOrder.trackingNumber || "");
        
        // Only send email if information actually changed and is not empty
        const carrierChanged = updates.trackingCarrier !== undefined && updates.trackingCarrier !== existingOrder.trackingCarrier;
        const trackingNumChanged = updates.trackingNumber !== undefined && updates.trackingNumber !== existingOrder.trackingNumber;
        
        if (carrierChanged || trackingNumChanged) {
          console.log("Sending Tracking Update Email to:", existingOrder.customerEmail);
          sendEmailNotification(
            existingOrder.customerEmail,
            `Shipping Update: Order ${orderId}`,
            generateEmailTemplate(
              "Shipping Information Updated",
              `
                <p>Hello ${existingOrder.customerName},</p>
                <p>We've updated the delivery/tracking information for your order <strong>${orderId}</strong>.</p>
                <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; border: 1px solid #dcfce7; margin: 24px 0;">
                  <p style="margin: 0; font-size: 13px; color: #166534;"><strong>Shipping Partner:</strong> ${carrier || 'Not specified'}</p>
                  <p style="margin: 8px 0 0; font-size: 14px; font-weight: bold; color: #16a34a;"><strong>Tracking Number:</strong> ${trackingNum || 'Not specified'}</p>
                </div>
                <p>You can use this number with the shipping provider to keep track of your parcel's route.</p>
                ${generateDeliveryAndPricingHtml(existingOrder)}
                <p style="margin-top: 24px;">Thank you for shopping with Buy A to Z!</p>
              `,
              orderId
            )
          );
        }
      }
    } catch (err: any) {
      console.error("Cloud sync failed:", err);
      alert(`⚠️ ক্লাউডে সিঙ্ক সফল হয়নি: ${err.message}`);
      setAdminTab("database");
    }
  };

  const handleCancelOrder = async (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    // We'll handle visual states in-situ for a more "professional" feel
    const updated = orders.map(o => o.id === id ? { ...o, status: 'cancelled' as const } : o);
    setOrders(updated);
    await safeIdbSet("buy_a_to_z_orders", updated);
    
    // Supabase sync
    try {
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', id);
    } catch (e) {
      console.error("Supabase sync failed:", e);
    }
    
    // Notify Customer
    sendEmailNotification(
      order.customerEmail,
      `Order Cancelled: ${order.id}`,
      generateEmailTemplate(
        "Order Cancelled",
        `
          <p>Hello ${order.customerName},</p>
          <p>We've processed your request to cancel order <strong>${order.id}</strong>.</p>
          <div style="background: #fef2f2; padding: 20px; border-radius: 12px; border: 1px solid #fecaca; margin: 24px 0; text-align: center;">
            <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #991b1b; font-weight: 700;">Current Status</p>
            <p style="margin: 4px 0 0; font-size: 24px; font-weight: 900; color: #dc2626;">CANCELLED</p>
          </div>
          ${generateDeliveryAndPricingHtml(order)}
          <p>If you didn't request this cancellation or have any questions, please contact our support team.</p>
          <p style="margin-top: 24px;">Thank you for being with Buy A to z!</p>
        `,
        order.id
      )
    );

    // Notify Admin
    sendEmailNotification(
      import.meta.env.VITE_ADMIN_EMAIL || "udayonbiswas2003@gmail.com",
      `Order Cancelled by Customer: ${order.id}`,
      generateEmailTemplate(
        "Order Cancelled Notification",
        `
          <p>Customer <strong>${order.customerName}</strong> has cancelled their order <strong>${order.id}</strong>.</p>
          <p><strong>Customer Email:</strong> ${order.customerEmail}</p>
          <p><strong>Contact:</strong> ${order.customerMobile}</p>
          ${generateDeliveryAndPricingHtml(order)}
        `,
        order.id
      )
    );

    // Success feedback
    setCancelSuccessId(id);
    setCancellingOrderId(null);
    setTimeout(() => setCancelSuccessId(null), 3000);
  };

  const handleDeleteUser = (userToDelete: any) => {
    if (!userToDelete) return;
    
    // Primary key in SQL is 'uid'
    const targetUid = userToDelete.uid;
    const targetId = userToDelete.id; // Secondary identifier
    
    if (!targetUid && !targetId) {
      alert("Error: User has no identifier (uid/id)");
      return;
    }

    triggerConfirm(
      "ইউজার ডিলিট করুন",
      `Are you sure you want to permanently delete user "${userToDelete.fullName || userToDelete.email || 'this user'}"? This action cannot be undone.`,
      async () => {
        setIsLoading(true);
        console.log("Initiating deletion for user:", { targetUid, targetId });

        try {
          // 1. Delete from Cloud (Supabase)
          // Attempt deletion by uid (Primary Key)
          let cloudDeleted = false;
          
          if (targetUid) {
            const { error: delError, count } = await supabase
              .from('users')
              .delete({ count: 'exact' })
              .eq('uid', targetUid);
              
            if (!delError && (count || 0) > 0) {
              cloudDeleted = true;
              console.log("Deleted by uid successfully");
            } else if (delError) {
              console.warn("Deletion by uid failed:", delError);
            }
          }

          // If uid delete didn't work/exist, try by id
          if (!cloudDeleted && targetId) {
            const { error: delIdError, count: idCount } = await supabase
              .from('users')
              .delete({ count: 'exact' })
              .eq('id', targetId);
              
            if (!delIdError && (idCount || 0) > 0) {
              cloudDeleted = true;
              console.log("Deleted by id successfully");
            }
          }

          // 2. Update Local State & IDB (Always do this if cloud delete was attempted)
          setUsers(prev => {
            const updated = prev.filter(u => 
              u.uid !== targetUid && u.id !== targetId && u.uid !== targetId && u.id !== targetUid
            );
            safeIdbSet("buy_a_to_z_users", updated);
            return updated;
          });

          if (!cloudDeleted) {
            alert("সতর্কতা: ইউজারটি লোকালি রিমুভ করা হয়েছে কিন্তু ক্লাউডে খুঁজে পাওয়া যায়নি। দয়া করে লিস্টটি রিফ্রেশ করুন।");
          } else {
            alert("ইউজার সফলভাবে ক্লাউড এবং লোকাল উভয় জায়গা থেকেই ডিলিট করা হয়েছে।");
          }
          
        } catch (err: any) {
          console.error("Critical error during user deletion:", err);
          alert(`❌ ডিলিট করা যায়নি: ${err.message}`);
        } finally {
          setIsLoading(false);
        }
      },
      'danger',
      'Delete User',
      'Cancel'
    );
  };

  const handleSeedData = () => {
    triggerConfirm(
      "ডাটা রিস্টোর করুন",
      "Restore original products? This will also sync to Cloud database.",
      async () => {
        setProducts(PRODUCTS);
        await safeIdbSet("buy_a_to_z_products", PRODUCTS);
        
        // Supabase sync
        try {
          await supabase.from('products').upsert(PRODUCTS);
          alert("Original products restored and synced!");
        } catch (e) {
          console.error("Supabase sync failed:", e);
          alert("✅ প্রোডাক্ট লোকালি রিস্টোর হয়েছে, কিন্তু ক্লাউডে সিঙ্ক ফেইল হয়েছে। 'Fix DB' চেক করুন।");
        }
      },
      'warning',
      'Restore',
      'Cancel'
    );
  };

  // --- Supabase Auto-Sync for Configs ---
  // Using a ref to prevent initial render triggers
  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (!isLoading) {
      initialLoadDone.current = true;
    }
  }, [isLoading]);

  useEffect(() => {
    if (banners.length > 0 && initialLoadDone.current) {
      syncToCloud('banners', banners);
    }
  }, [banners]);

  useEffect(() => {
    if (categories.length > 0 && initialLoadDone.current) {
      syncToCloud('categories', categories);
    }
  }, [categories]);

  useEffect(() => {
    if (initialLoadDone.current) {
      syncToCloud('configs', { key: 'footer', value: footerConfig });
    }
  }, [footerConfig]);

  useEffect(() => {
    if (initialLoadDone.current) {
      syncToCloud('configs', { key: 'promotion', value: promotionConfig });
    }
  }, [promotionConfig]);

  useEffect(() => {
    if (sidebarBanners.length > 0 && initialLoadDone.current) {
      syncToCloud('configs', { key: 'sidebar_banners', value: sidebarBanners });
    }
  }, [sidebarBanners]);

  const handleGoogleLogin = async () => {
    try {
      setIsAuthLoading(true);
      
      // If we're in an iframe (like AI Studio), we use a popup-friendly way 
      // or at least handle the redirect better.
      const isIframe = window.self !== window.top;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: isIframe // If iframe, we might want to handle it manually
        }
      });
      
      if (error) throw error;
      
      if (isIframe && data?.url) {
        // In AI Studio, we must open in a new tab
        const popup = window.open(data.url, '_blank');
        if (!popup) {
          alert("Please allow popups for Google Login to work.");
          setIsAuthLoading(false);
        }
        // Safety timeout to clear loading state
        setTimeout(() => {
          setIsAuthLoading(false);
          setIsInitialLoading(false);
        }, 12000); 
      } else if (data?.url) {
        window.location.assign(data.url);
      }
    } catch (e: any) {
      console.error("Google Login Error:", e);
      alert("Google Login failed: " + e.message);
      setIsAuthLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (!isAdmin) return;
    try {
      setIsLoading(true);
      console.log("🚀 Initializing complete cloud backup...");
      
      // Sync Products (Individual for large payloads/images)
      console.log("📦 Syncing products...");
      if (products && products.length > 0) {
        for (const product of products) {
          const { error } = await supabase.from('products').upsert(product);
          if (error) throw new Error(`Product Backup Failed (${product.name}): ${error.message}`);
        }
      }
      
      // Sync Categories
      const { error: cErr } = await supabase.from('categories').upsert(categories);
      if (cErr) throw new Error(`Categories Backup Failed: ${cErr.message}`);
      
      // Sync Banners (Individual for large image data)
      if (banners && banners.length > 0) {
        for (const banner of banners) {
          const { error } = await supabase.from('banners').upsert(banner);
          if (error) console.error("Banner backup warning:", error);
        }
      }
      
      // Sync Configs (Individual for better stability with large base64 data)
      console.log("⚙️ Syncing configurations...");
      const footerRes = await supabase.from('configs').upsert({ key: 'footer', value: footerConfig });
      if (footerRes.error) console.error("Footer backup warning:", footerRes.error);
      
      const promoRes = await supabase.from('configs').upsert({ key: 'promotion', value: promotionConfig });
      if (promoRes.error) throw new Error(`Promotion Backup Failed: ${promoRes.error.message}`);
      
      if (sidebarBanners && sidebarBanners.length > 0) {
        const sbRes = await supabase.from('configs').upsert({ key: 'sidebar_banners', value: sidebarBanners });
        if (sbRes.error) console.error("Sidebar banners backup warning:", sbRes.error);
      }
      
      // Sync Users
      const { error: uErr } = await supabase.from('users').upsert(users);
      if (uErr) throw new Error(`Users Backup Failed: ${uErr.message}`);
      
      // Sync Orders
      if (orders.length > 0) {
        const { error: oErr } = await supabase.from('orders').upsert(orders);
        if (oErr) throw new Error(`Orders Backup Failed: ${oErr.message}`);
      }

      // Sync Reviews (Collect from all products in IndexedDB)
      console.log("🔍 Collecting local reviews for backup...");
      let allReviewsToBackup: Review[] = [];
      for (const product of products) {
        const pReviews = await safeIdbGet<Review[]>(`buy_a_to_z_reviews_${product.id}`);
        if (pReviews && Array.isArray(pReviews)) {
          allReviewsToBackup = [...allReviewsToBackup, ...pReviews];
        }
      }

      if (allReviewsToBackup.length > 0) {
        const { error: rErr } = await supabase.from('reviews').upsert(allReviewsToBackup);
        if (rErr) throw new Error(`Reviews Backup Failed: ${rErr.message}`);
      }

      // Sync Suppliers
      if (suppliers.length > 0) {
        const { error: sSyncErr } = await supabase.from('suppliers').upsert(suppliers);
        if (sSyncErr) throw new Error(`Suppliers Backup Failed: ${sSyncErr.message}`);
      }

      // Sync Purchases
      if (purchases.length > 0) {
        const { error: pSyncErr } = await supabase.from('purchases').upsert(purchases);
        if (pSyncErr) throw new Error(`Purchases Backup Failed: ${pSyncErr.message}`);
      }
      
      alert(`✅ অভিনন্দন! আপনার সব ডাটা সফলভাবে ক্লাউড ডাটাবেসে (Supabase) ব্যাকআপ হয়েছে।\n\nপণ্য: ${products.length}টি\nঅর্ডার: ${orders.length}টি\nইউজার: ${users.length}জন\nরিভিউ: ${allReviewsToBackup.length}টি\nসাপ্লায়ার: ${suppliers.length}টি\nপারচেজ: ${purchases.length}টি\nসেটিংস ও প্রোমো: সফলভাবে সিঙ্ক হয়েছে\n\nএখন আপপনি নিশ্চিন্তে যেকোনো ডিভাইস থেকে এটি কন্ট্রোল করতে পারবেন।`);
    } catch (e: any) {
      console.error("Backup failed:", e);
      alert(`❌ ব্যাকআপ ফেইল হয়েছে: ${e.message}\n\nসুতারাং আপনার ডাটাবেস টেবিলগুলো ঠিক নেই। দয়া করে "Fix DB" ট্যাব থেকে SQL কোডটি কপি করে আপনার Supabase SQL Editor-এ রান করুন। এটি ১ মিনিটের কাজ।`);
      setAdminTab("database");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFixDatabaseSchema = async () => {
    if (!isAdmin) return;
    const sql = `-- 🚀 COMPLETE DATABASE SETUP (v9 - FINAL STABLE)
-- RUN THIS IN SUPABASE SQL EDITOR TO FIX ALL TABLES & RLS

-- 1. ALL TABLES SETUP
CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT NOT NULL, price NUMERIC NOT NULL, "originalPrice" NUMERIC, image TEXT, category TEXT, rating NUMERIC DEFAULT 4.5, "reviewCount" INTEGER DEFAULT 0, discount NUMERIC DEFAULT 0, stock INTEGER DEFAULT 0, location TEXT, "partNumber" TEXT, "galleryImages" JSONB DEFAULT '[]'::jsonb, "availableSizes" JSONB DEFAULT '[]'::jsonb, "showSizes" BOOLEAN DEFAULT true, "availableColors" JSONB DEFAULT '[]'::jsonb, "showColors" BOOLEAN DEFAULT true, description TEXT, weight TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL, icon TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS banners (id TEXT PRIMARY KEY, title TEXT, subtitle TEXT, "buttonText" TEXT, "imageUrl" TEXT, "backgroundColor" TEXT, "textColor" TEXT, "categoryLink" TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, "customerId" TEXT, "customerName" TEXT, "customerEmail" TEXT, "customerMobile" TEXT, items JSONB NOT NULL DEFAULT '[]'::jsonb, total NUMERIC NOT NULL, status TEXT DEFAULT 'processing', timestamp TIMESTAMPTZ DEFAULT NOW(), delivery JSONB NOT NULL DEFAULT '{}'::jsonb, payment JSONB NOT NULL DEFAULT '{}'::jsonb, "trackingNumber" TEXT, "trackingCarrier" TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS users (uid TEXT PRIMARY KEY, id TEXT, "fullName" TEXT, email TEXT UNIQUE, "mobileNumber" TEXT, password TEXT, avatar TEXT, role TEXT DEFAULT 'user', "isAdmin" BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS configs (key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS reviews (id TEXT PRIMARY KEY, "productId" TEXT, "userId" TEXT, "userName" TEXT, rating INTEGER, comment TEXT, timestamp TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS suppliers (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT, email TEXT, address TEXT, "category" TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS purchases (id TEXT PRIMARY KEY, "supplierId" TEXT, "supplierName" TEXT, timestamp TIMESTAMPTZ DEFAULT NOW(), items JSONB DEFAULT '[]'::jsonb, "totalAmount" NUMERIC, status TEXT, note TEXT);

-- 2. ENSURE ALL COLUMNS EXIST & CONSTRAINTS ARE ADJUSTED
ALTER TABLE products ADD COLUMN IF NOT EXISTS "availableSizes" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "showSizes" BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "availableColors" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "showColors" BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "galleryImages" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "partNumber" TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "weight" TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "originalPrice" NUMERIC;
ALTER TABLE users ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "mobileNumber" TEXT;

-- Remove problematic unique constraint on mobileNumber if it exists
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_mobileNumber_key') THEN
    ALTER TABLE users DROP CONSTRAINT "users_mobileNumber_key";
  END IF;
END $$;

-- 3. 🔓 DISABLE RLS & ALLOW PUBLIC ACCESS
DO $$ 
BEGIN
  ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS suppliers DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS purchases DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS categories DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS orders DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS banners DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS configs DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS reviews DISABLE ROW LEVEL SECURITY;
  
  -- Create Open Policies
  DROP POLICY IF EXISTS "p1" ON products; CREATE POLICY "p1" ON products FOR ALL USING (true) WITH CHECK (true);
  DROP POLICY IF EXISTS "s1" ON suppliers; CREATE POLICY "s1" ON suppliers FOR ALL USING (true) WITH CHECK (true);
  DROP POLICY IF EXISTS "pu1" ON purchases; CREATE POLICY "pu1" ON purchases FOR ALL USING (true) WITH CHECK (true);
  DROP POLICY IF EXISTS "c1" ON categories; CREATE POLICY "c1" ON categories FOR ALL USING (true) WITH CHECK (true);
  DROP POLICY IF EXISTS "o1" ON orders; CREATE POLICY "o1" ON orders FOR ALL USING (true) WITH CHECK (true);
  DROP POLICY IF EXISTS "u1" ON users; CREATE POLICY "u1" ON users FOR ALL USING (true) WITH CHECK (true);
  DROP POLICY IF EXISTS "b1" ON banners; CREATE POLICY "b1" ON banners FOR ALL USING (true) WITH CHECK (true);
  DROP POLICY IF EXISTS "cfg1" ON configs; CREATE POLICY "cfg1" ON configs FOR ALL USING (true) WITH CHECK (true);
  DROP POLICY IF EXISTS "r1" ON reviews; CREATE POLICY "r1" ON reviews FOR ALL USING (true) WITH CHECK (true);
END $$;
`;
    
    // Copy to clipboard if possible
    try {
      await navigator.clipboard.writeText(sql);
      alert("✅ SQL Schema Fix code copied to clipboard!\n\nPlease go to your Supabase Dashboard -> SQL Editor -> New Query, paste this code, and click 'Run'.\n\nThis will fix the 'Backup' and 'Sync' errors.");
    } catch (e) {
      console.log(sql);
      alert("Please copy the SQL from console or use the Fix DB button instructions.");
    }
  };

  const toggleUserAdmin = async (userId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setUsers(prev => prev.map(u => (u.uid === userId || u.id === userId) ? { ...u, isAdmin: newStatus, role: newStatus ? 'admin' : 'user' } : u));
    
    // Update current user session if it's them
    if (currentUser && (currentUser.uid === userId || currentUser.id === userId)) {
      const updatedUser = { ...currentUser, isAdmin: newStatus, role: newStatus ? 'admin' : 'user' };
      setCurrentUser(updatedUser);
      setIsAdmin(newStatus);
      safeIdbSet("buy_a_to_z_user", updatedUser);
    }
    
    // Supabase sync
    try {
      // Try both uid and id for compatibility correctly
      const { error } = await supabase.from('users').update({ isAdmin: newStatus, role: newStatus ? 'admin' : 'user' }).or(`uid.eq.${userId},id.eq.${userId}`);
      if (error) console.error("Supabase sync error:", error);
    } catch (e) {
      console.error("Supabase sync failed:", e);
    }
  };

    // Fetch Reviews
    useEffect(() => {
    const loadReviews = async () => {
      if (!selectedProduct) {
        setProductReviews([]);
        return;
      }
      
      const idbReviews = await safeIdbGet<Review[]>(`buy_a_to_z_reviews_${selectedProduct.id}`);
      if (idbReviews) {
        setProductReviews(idbReviews);
      } else {
        // Migration from localStorage
        const savedReviews = safeLsGet(`buy_a_to_z_reviews_${selectedProduct.id}`);
        if (savedReviews) {
          try {
            const reviews = JSON.parse(savedReviews);
            setProductReviews(reviews);
            await safeIdbSet(`buy_a_to_z_reviews_${selectedProduct.id}`, reviews);
            safeLsRemove(`buy_a_to_z_reviews_${selectedProduct.id}`);
          } catch (e) {}
        } else {
          setProductReviews([]);
        }
      }
    };
    
    loadReviews();
  }, [selectedProduct]);

  const handleSubmitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !currentUser) return;

    setIsLoading(true);
    const newReview: Review = {
      id: Date.now().toString(),
      productId: selectedProduct.id,
      userId: currentUser.uid,
      userName: currentUser.fullName,
      rating: reviewRating,
      comment: reviewComment,
      timestamp: new Date().toISOString()
    };

    const updated = [newReview, ...productReviews];
    setProductReviews(updated);
    await safeIdbSet(`buy_a_to_z_reviews_${selectedProduct.id}`, updated);

    // Supabase sync
    try {
      const { error: revErr } = await supabase.from('reviews').insert([newReview]);
      if (revErr) throw revErr;
      
      // Also update the product rating in the cloud
      const totalRating = updated.reduce((acc, rev) => acc + rev.rating, 0);
      const newAverageRating = Number((totalRating / updated.length).toFixed(1));
      const newReviewCount = updated.length;
      
      const { error: prodErr } = await supabase.from('products').update({ 
        rating: newAverageRating, 
        reviewCount: newReviewCount 
      }).eq('id', selectedProduct.id);
      
      if (prodErr) console.warn("Product rating sync failed:", prodErr);
      
    } catch (e: any) {
      console.error("Supabase sync failed:", e);
      alert(`⚠️ রিভিউ ক্লাউডে সেভ হয়নি: ${e.message}\n\nআপনার ডাটাবেস ঠিক আছে কিনা চেক করুন।`);
    }

    // Update product rating and review count locally
    const totalRating = updated.reduce((acc, rev) => acc + rev.rating, 0);
    const newAverageRating = Number((totalRating / updated.length).toFixed(1));
    const newReviewCount = updated.length;

    setProducts(prev => {
      const updatedProducts = prev.map(p => 
        p.id === selectedProduct.id 
          ? { ...p, rating: newAverageRating, reviewCount: newReviewCount } 
          : p
      );
      safeIdbSet("buy_a_to_z_products", updatedProducts);
      return updatedProducts;
    });

    setSelectedProduct(prev => prev ? ({ ...prev, rating: newAverageRating, reviewCount: newReviewCount }) : null);

    setReviewComment("");
    setReviewRating(5);
    setIsReviewFormOpen(false);
    alert("✅ আপনার রিভিউটি সফলভাবে জমা হয়েছে!");
    setIsLoading(false);
  };

  const handleAddSupplier = async (supplier: Supplier) => {
    const updated = [supplier, ...suppliers];
    setSuppliers(updated);
    await safeIdbSet("buy_a_to_z_suppliers", updated);
    try {
      const { error } = await supabase.from('suppliers').upsert([supplier]);
      if (error) throw error;
    } catch (e: any) {
      console.error("Supplier sync failed:", e);
      alert(`⚠️ ক্লাউড ব্যাকআপ সফল হয়নি: ${e.message}\n\nসমাধান: "Fix DB" ট্যাব থেকে SQL কোডটি কপি করে Supabase-এ রান করুন। এটি রোর-লেভেল সিকিউরিটি (RLS) সমস্যার সমাধান করবে।`);
      setAdminTab("database");
    }
  };

  const handleDeleteSupplier = (id: string) => {
    triggerConfirm(
      "সাপ্লায়ার ডিলিট করুন",
      "Are you sure you want to delete this supplier?",
      async () => {
        try {
          const updated = suppliers.filter(s => s.id !== id);
          setSuppliers(updated);
          await safeIdbSet("buy_a_to_z_suppliers", updated);
          const { error } = await supabase.from('suppliers').delete().eq('id', id);
          if (error) throw error;
          alert("✅ সাপ্লায়ার সফলভাবে ডিলিট হয়েছে!");
        } catch (e: any) {
          console.error("Supplier delete failed:", e);
          alert(`❌ ক্লাউড থেকে ডিলিট করা যায়নি: ${e.message || "অজানা সমস্যা"}`);
        }
      },
      'danger',
      'Delete Supplier',
      'Cancel'
    );
  };

  const handleAddPurchase = async (purchase: Purchase) => {
    setIsLoading(true);
    // 1. Update purchase list
    const updatedPurchases = [purchase, ...purchases];
    setPurchases(updatedPurchases);
    await safeIdbSet("buy_a_to_z_purchases", updatedPurchases);

    // 2. Update product stock
    const updatedProducts = products.map(p => {
      const purchasedItem = purchase.items.find(item => item.productId === p.id);
      if (purchasedItem) {
        return { ...p, stock: (p.stock || 0) + purchasedItem.quantity };
      }
      return p;
    });
    setProducts(updatedProducts);
    await safeIdbSet("buy_a_to_z_products", updatedProducts);

    // 3. Supabase sync
    try {
      const { error } = await supabase.from('purchases').upsert([purchase]);
      if (error) throw error;
      
      // Update stock in cloud for each item
      for (const item of purchase.items) {
        const prod = updatedProducts.find(p => p.id === item.productId);
        if (prod) {
          const { error: stockErr } = await supabase.from('products').update({ stock: prod.stock }).eq('id', item.productId);
          if (stockErr) console.warn("Stock sync warning:", stockErr);
        }
      }
      alert("✅ ইনভেন্টরি রিসিভ ক্লাউডে সফলভাবে সেভ হয়েছে!");
    } catch (e: any) {
      console.error("Purchase sync failed:", e);
      alert(`⚠️ ক্লাউড ব্যাকআপ সফল হয়নি: ${e.message}\n\nসমাধান: "Fix DB" ট্যাব থেকে SQL কোডটি কপি করে Supabase-এ রান করুন।`);
      setAdminTab("database");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePurchase = (id: string) => {
    triggerConfirm(
      "রেকর্ড ডিলিট করুন",
      "Are you sure you want to delete this purchase record? ⚠️ This will adjust (decrease) the stock of the included products.",
      async () => {
        try {
          const purchaseToDelete = purchases.find(p => p.id === id);
          if (!purchaseToDelete) return;

          // 1. Revert product stock
          const updatedProducts = products.map(p => {
            const item = purchaseToDelete.items.find(i => i.productId === p.id);
            if (item) {
              return { ...p, stock: Math.max(0, (p.stock || 0) - item.quantity) };
            }
            return p;
          });

          // 2. Update local state
          const updatedPurchases = purchases.filter(p => p.id !== id);
          setPurchases(updatedPurchases);
          setProducts(updatedProducts);
          
          await safeIdbSet("buy_a_to_z_purchases", updatedPurchases);
          await safeIdbSet("buy_a_to_z_products", updatedProducts);

          // 3. Supabase sync
          const { error: purError } = await supabase.from('purchases').delete().eq('id', id);
          if (purError) throw purError;

          // Update cloud product stock
          for (const item of purchaseToDelete.items) {
            const prod = updatedProducts.find(p => p.id === item.productId);
            if (prod) {
              await supabase.from('products').update({ stock: prod.stock }).eq('id', item.productId);
            }
          }

          alert("✅ পারচেজ রেকর্ড ডিলিট করা হয়েছে এবং স্টক সমন্বয় করা হয়েছে!");
        } catch (e: any) {
          console.error("Purchase delete failed:", e);
          alert(`❌ ডিলিট ফেইল হয়েছে: ${e.message}`);
        }
      },
      'danger',
      'Delete Record',
      'Cancel'
    );
  };

  const handleUpdatePurchase = async (updatedPurchase: Purchase) => {
    try {
      const originalPurchase = purchases.find(p => p.id === updatedPurchase.id);
      if (!originalPurchase) return;

      // 1. Calculate stock difference
      const updatedProducts = [...products];

      // Revert old quantities
      originalPurchase.items.forEach(item => {
        const pIdx = updatedProducts.findIndex(p => p.id === item.productId);
        if (pIdx !== -1) {
          updatedProducts[pIdx] = {
            ...updatedProducts[pIdx],
            stock: Math.max(0, (updatedProducts[pIdx].stock || 0) - item.quantity)
          };
        }
      });

      // Apply new quantities
      updatedPurchase.items.forEach(item => {
        const pIdx = updatedProducts.findIndex(p => p.id === item.productId);
        if (pIdx !== -1) {
          updatedProducts[pIdx] = {
            ...updatedProducts[pIdx],
            stock: (updatedProducts[pIdx].stock || 0) + item.quantity
          };
        }
      });

      // 2. Update local state
      const updatedPurchases = purchases.map(p => p.id === updatedPurchase.id ? updatedPurchase : p);
      setPurchases(updatedPurchases);
      setProducts(updatedProducts);
      
      await safeIdbSet("buy_a_to_z_purchases", updatedPurchases);
      await safeIdbSet("buy_a_to_z_products", updatedProducts);

      // 3. Supabase sync
      const { error: purError } = await supabase.from('purchases').update(updatedPurchase).eq('id', updatedPurchase.id);
      if (purError) throw purError;

      // Sync affected products to cloud
      const affectedIds = new Set([
        ...originalPurchase.items.map(i => i.productId),
        ...updatedPurchase.items.map(i => i.productId)
      ]);

      for (const pid of affectedIds) {
        const prod = updatedProducts.find(p => p.id === pid);
        if (prod) {
          await supabase.from('products').update({ stock: prod.stock }).eq('id', pid);
        }
      }

      alert("✅ Purchase and stock updated successfully!");
    } catch (e: any) {
      console.error("Purchase update failed:", e);
      alert(`❌ সিঙ্ক সফল হয়নি: ${e.message}`);
      setAdminTab("database");
    }
  };

  const hasPurchasedProduct = (productId: string) => {
    return userOrders.some(order => 
      order.status === 'delivered' && 
      order.items.some(item => item.id === productId)
    );
  };

  const addToCart = (product: Product, size?: string, color?: string, openDrawer = true) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedSize === size && item.selectedColor === color);
      if (existing) {
        return prev.map(item => (item.id === product.id && item.selectedSize === size && item.selectedColor === color) ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, selectedSize: size, selectedColor: color }];
    });
    if (openDrawer) setIsCartOpen(true);
  };

  const handleBuyNow = (product: Product, size?: string, color?: string) => {
    const inCart = cart.find(item => item.id === product.id && item.selectedSize === size && item.selectedColor === color);
    if (!inCart) {
      setCart(prev => [...prev, { ...product, quantity: 1, selectedSize: size, selectedColor: color }]);
    }
    if (!currentUser) {
      setAuthMode("login");
      setIsAuthModalOpen(true);
      return;
    }
    setIsCheckoutModalOpen(true);
  };

  const removeFromCart = (id: string, size?: string, color?: string) => {
    setCart(prev => prev.filter(item => !(item.id === id && item.selectedSize === size && item.selectedColor === color)));
  };

  const updateQuantity = (id: string, delta: number, size?: string, color?: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === id && item.selectedSize === size && item.selectedColor === color) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthMessage(null);
    
    const normalizedIdentifier = email.trim().toLowerCase();
    
    try {
      if (authMode === "signup") {
        if (signupStep === 1) {
          // STEP 1: Registration Details & OTP Generation
          const cleanMobile = mobileNumber.replace(/[\s\-()]/g, "") || null;
          
          if (!normalizedIdentifier && !cleanMobile) {
            throw new Error("ইমেইল অথবা মোবাইল নম্বর প্রদান করুন।");
          }

          // Check if user already exists
          const { data: existingUser } = await supabase
            .from('users')
            .select('uid')
            .or(`email.eq.${normalizedIdentifier},"mobileNumber".eq.${cleanMobile}`)
            .maybeSingle();

          if (existingUser) {
            throw new Error("এই ইমেইল বা মোবাইল নম্বরটি ইতিমধ্যে ব্যবহার করা হয়েছে।");
          }
          
          const userData = {
            uid: Date.now().toString(),
            fullName,
            email: normalizedIdentifier || null,
            mobileNumber: cleanMobile,
            password: password,
            role: normalizedIdentifier === "udayonbiswas2003@gmail.com" ? "admin" : "user",
            isAdmin: normalizedIdentifier === "udayonbiswas2003@gmail.com",
            isVerified: false
          };

          // Generate Code
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          setGeneratedCode(code);
          setSignupUserData(userData);
          
          // Send Code
          try {
            const response = await fetch("/api/send-otp", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                to: normalizedIdentifier || cleanMobile, 
                code, 
                fullName: userData.fullName 
              }),
            });
            
            const resData = await response.json();
            if (resData.success) {
              setAuthMessage({ 
                type: 'success', 
                text: `আপনার ${normalizedIdentifier ? "ইমেইল" : "মোবাইল"}-এ একটি ভেরিফিকেশন কোড পাঠানো হয়েছে।` 
              });
              setSignupStep(2);
            } else {
              const isSim = resData.isDevMissing || (resData.error && resData.error.includes("Gatew"));
              if (isSim) {
                setAuthMessage({ 
                  type: 'success', 
                  text: `অ্যাকাউন্ট ভেরিফিকেশন কোড: ${code} (সিমুলেশন মোড)` 
                });
                setSignupStep(2);
              } else {
                throw new Error(resData.error || "কোড পাঠানো সম্ভব হয়নি।");
              }
            }
          } catch (err: any) {
             setAuthMessage({ 
               type: 'success', 
               text: `টেস্ট কোডটি ব্যবহার করুন: ${code}` 
             });
             setSignupStep(2);
          }
          return;
        } else {
          // STEP 2: OTP Verification
          if (userEnteredCode !== generatedCode) {
            throw new Error("ভেরিফিকেশন কোডটি সঠিক নয়।");
          }

          if (!signupUserData) throw new Error("নিবন্ধন প্রক্রিয়ায় সমস্যা হয়েছে। আবার চেষ্টা করুন।");

          const finalUser = { ...signupUserData, isVerified: true };
          
          // 2. Save to Supabase
          const { error: insertErr } = await supabase.from('users').insert([finalUser]);
          if (insertErr) {
            console.error("Supabase insert error:", insertErr);
            throw new Error("নিবন্ধন করা যাচ্ছে না। অনুগ্রহ করে পরে আবার চেষ্টা করুন।");
          }

          try {
            await safeIdbSet("buy_a_to_z_user", finalUser);
            safeLsSet("buy_a_to_z_user", JSON.stringify(finalUser));
          } catch (e) {
            console.warn("Local storage persistence failed:", e);
          }
          
          setCurrentUser(finalUser);
          setIsAdmin(finalUser.isAdmin);
          alert("নিবন্ধন সফল হয়েছে!");
          setIsAuthModalOpen(false);
          setSignupStep(1);
          setSignupUserData(null);
        }
      } else {
        // LOGIN MODE
        // 1. Try to fetch from Supabase
        const { data: dbUser, error: loginErr } = await supabase
          .from('users')
          .select('*')
          .or(`email.eq.${normalizedIdentifier},"mobileNumber".eq.${normalizedIdentifier}`)
          .eq('password', password)
          .maybeSingle();

        if (loginErr) {
            console.error("Login error:", loginErr);
            throw new Error("লগইন করতে সমস্যা হচ্ছে। আপনার ইন্টারনেট সংযোগ চেক করুন।");
        }

        if (dbUser) {
          try {
            await safeIdbSet("buy_a_to_z_user", dbUser);
            safeLsSet("buy_a_to_z_user", JSON.stringify(dbUser));
          } catch (e) {
            console.warn("Local storage persistence failed:", e);
          }
          setCurrentUser(dbUser);
          setIsAdmin(dbUser.isAdmin);
        } else if (normalizedIdentifier === "udayonbiswas2003@gmail.com" && password === "123456") {
           // Admin hardcoded fallback for first time setup
           const adminUser = { 
             uid: "admin-init", 
             fullName: "Admin User", 
             email: "udayonbiswas2003@gmail.com", 
             mobileNumber: "01953550598", 
             isAdmin: true, 
             role: "admin", 
             password: "123456" 
           };
           try {
             await safeIdbSet("buy_a_to_z_user", adminUser);
             safeLsSet("buy_a_to_z_user", JSON.stringify(adminUser));
           } catch (e) {
             console.warn("Local storage persistence failed:", e);
           }
           setCurrentUser(adminUser);
           setIsAdmin(true);
           // Try to sync this admin to DB too
           try {
             await supabase.from('users').upsert([adminUser]);
           } catch (e) {}
        } else {
          throw new Error("ভুল ইমেইল/মোবাইল বা পাসওয়ার্ড। আবার চেষ্টা করুন।");
        }
      }
      setIsAuthModalOpen(false);
      setPassword("");
      setFullName("");
      setMobileNumber("");
      setEmail("");
    } catch (error: any) {
      alert(error.message || "Authentication failed.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    if (isProfileModalOpen && currentUser) {
      setEditName(currentUser.fullName);
      setEditMobile(currentUser.mobileNumber);
      setUploadedAvatar(currentUser.avatar || "");
    }
  }, [isProfileModalOpen, currentUser]);

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setAuthMessage(null);
    setIsAuthLoading(true);

    if (newPassword !== confirmPassword) {
      setAuthMessage({ type: 'error', text: 'নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।' });
      setIsAuthLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setAuthMessage({ type: 'error', text: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' });
      setIsAuthLoading(false);
      return;
    }

    try {
      if (!currentUser) throw new Error("User not found");
      
      const userId = currentUser.uid || currentUser.id;
      let verifiedUserPassword = currentUser.password;
      
      if (!verifiedUserPassword) {
        // Query password from database to verify
        const { data: dbUser, error: fetchErr } = await supabase
          .from('users')
          .select('password')
          .or(`uid.eq.${userId},id.eq.${userId}`)
          .maybeSingle();
        
        if (fetchErr) {
          console.error("Database check failed:", fetchErr);
        } else if (dbUser) {
          verifiedUserPassword = dbUser.password;
        }
      }

      // Verify current password first
      if (verifiedUserPassword && verifiedUserPassword !== currentPassword) {
        throw new Error("বর্তমান পাসওয়ার্ডটি সঠিক নয়।");
      }
      
      const { error } = await supabase
        .from('users')
        .update({ password: newPassword })
        .or(`uid.eq.${userId},id.eq.${userId}`);

      if (error) throw error;

      // Update local state
      const updatedUser = { ...currentUser, password: newPassword };
      setCurrentUser(updatedUser);
      // Persist locally
      try {
        await safeIdbSet("buy_a_to_z_user", updatedUser);
        safeLsSet("buy_a_to_z_user", JSON.stringify(updatedUser));
      } catch (localErr) {
        console.warn("Could not persist locally:", localErr);
      }

      setAuthMessage({ type: 'success', text: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।' });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Password change error:", err);
      setAuthMessage({ type: 'error', text: err.message || 'পাসওয়ার্ড পরিবর্তন করা সম্ভব হয়নি। বর্তমান পাসওয়ার্ডটি পুনরায় চেক করুন।' });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setIsUpdatingProfile(true);
    try {
      const updatedUser: User = { 
        ...currentUser, 
        fullName: editName, 
        mobileNumber: editMobile || null,
        avatar: uploadedAvatar || currentUser.avatar
      };
      
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => (u.uid === updatedUser.uid) ? updatedUser : u));

      // Sync locally
      try {
        await safeIdbSet("buy_a_to_z_user", updatedUser);
        safeLsSet("buy_a_to_z_user", JSON.stringify(updatedUser));
      } catch (err) {}
      
      // Sync to Supabase
      const dbUser = { ...updatedUser };
      
      const { error } = await supabase.from('users').upsert([dbUser]);
      if (error) {
        console.error("Supabase sync error:", error);
        // Fallback for missing columns or constraints
        const scrubbed = { ...dbUser } as any;
        if (error.message.includes("column 'id'")) delete scrubbed.id;
        if (error.message.includes("mobileNumber")) scrubbed.mobileNumber = null;
        
        const { error: retryErr } = await supabase.from('users').upsert([scrubbed]);
        if (retryErr) throw new Error(retryErr.message);
      }
      
      alert("✅ প্রোফাইল সফলভাবে আপডেট হয়েছে!");
      setIsProfileModalOpen(false);
    } catch (e: any) {
      console.error("Profile update failed:", e);
      alert("প্রোফাইল আপডেট করা যাচ্ছে না: " + (e.message || "Unknown error"));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleLogout = async () => {
    safeLsRemove("buy_a_to_z_user");
    await safeIdbSet("buy_a_to_z_user", null);
    setCurrentUser(null);
    setIsAdmin(false);
    setSidebarOpen(false);
    await supabase.auth.signOut();
  };

  const handleCheckoutInitiate = () => {
    if (!currentUser) {
      setAuthMode("login");
      setIsAuthModalOpen(true);
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutModalOpen(true);
  };

  const handleCheckout = async (pid?: string) => {
    if (!currentUser) return;
    setIsCheckingOut(true);
    try {
      const isNewUser = orders.filter(o => o.customerId === currentUser.uid).length === 0;
      const discount = (isNewUser && promotionConfig.isActive) ? promotionConfig.discountAmount : 0;
      const totalAmount = cartTotal + (deliveryType === "express" ? 120 : 50) - discount;
      
      const newOrder: Order = {
        id: "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        customerId: currentUser.uid,
        customerName: currentUser.fullName,
        customerEmail: currentUser.email,
        customerMobile: currentUser.mobileNumber,
        items: cart,
        total: totalAmount,
        status: "processing",
        delivery: {
          address,
          area,
          city,
          deliveryType
        },
        payment: {
          method: paymentMethod
        },
        timestamp: new Date().toISOString()
      };

      const updatedOrders = [newOrder, ...orders];
      setOrders(updatedOrders);
      await safeIdbSet("buy_a_to_z_orders", updatedOrders);

      // Supabase sync
      try {
        await supabase.from('orders').insert([newOrder]);
        
        // Also update product stock
        for (const item of cart) {
          const product = products.find(p => p.id === item.id);
          if (product) {
            const newStock = Math.max(0, product.stock - item.quantity);
            await supabase.from('products').update({ stock: newStock }).eq('id', item.id);
            // Local update already happened implicitly if we reload, but let's be safe
            setProducts(prev => prev.map(p => p.id === item.id ? { ...p, stock: newStock } : p));
          }
        }
      } catch (e) {
        console.error("Supabase sync failed:", e);
      }

      // Notify Admin
      sendEmailNotification(
        import.meta.env.VITE_ADMIN_EMAIL || "udayonbiswas2003@gmail.com",
        `New Order Received - ${newOrder.id}`,
        generateEmailTemplate(
          "New Order Received",
          `
            <p>A new order has been placed on Buy A to z.</p>
            <div style="background: #fdfdfd; padding: 16px; border-radius: 8px; border: 1px solid #f0f0f0; margin: 16px 0;">
              <p style="margin: 0; font-size: 14px;"><strong>Customer:</strong> ${newOrder.customerName}</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Contact:</strong> ${newOrder.customerMobile}</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> ${newOrder.customerEmail}</p>
            </div>
            ${generateDeliveryAndPricingHtml(newOrder)}
          `,
          newOrder.id
        )
      );

      // Notify Customer
      sendEmailNotification(
        newOrder.customerEmail,
        `Order Confirmed - ${newOrder.id}`,
        generateEmailTemplate(
          "Order Confirmed!",
          `
            <p>Hello ${newOrder.customerName},</p>
            <p>Thank you for your order! We've received it and are now processing it. You'll receive another update once your items are on their way.</p>
            ${generateDeliveryAndPricingHtml(newOrder)}
            <p>Thank you for choosing Buy A to z!</p>
          `,
          newOrder.id
        )
      );

      setOrderSuccess(true);
      setIsCheckoutModalOpen(false);
      setCart([]);
      setAddress("");
      setArea("");
    } catch (error) {
      console.error("Checkout Error:", error);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleUpdateSystemUser = async (updatedUser: any) => {
    if (!updatedUser) return;
    setIsLoading(true);
    try {
      // Find the user by either uid or id for local update
      const targetIdentifier = updatedUser.uid || updatedUser.id;
      
      setUsers(prev => prev.map(u => 
        (u.uid === targetIdentifier || u.id === targetIdentifier) ? updatedUser : u
      ));
      
      // Update current session if the admin is editing themselves
      if (currentUser && (currentUser.uid === targetIdentifier || currentUser.id === targetIdentifier)) {
        const isActuallyAdmin = updatedUser.isAdmin || updatedUser.role === 'admin' || updatedUser.email === "udayonbiswas2003@gmail.com";
        setCurrentUser(updatedUser);
        setIsAdmin(isActuallyAdmin);
        await safeIdbSet("buy_a_to_z_user", updatedUser);
      }
      
      // Supabase uses 'uid' as Primary Key
      const { error } = await supabase.from('users').upsert([updatedUser]);
      if (error) throw error;
      
      alert("User information successfully updated and synced to cloud.");
      setIsUserEditModalOpen(false);
      setEditingSystemUser(null);
    } catch (e: any) {
      console.error("User update failed:", e);
      alert("Failed to update user: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">

      {/* --- Fixed Header --- */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 md:h-16 flex items-center gap-4 md:gap-8">
          {/* Logo or Brand Name */}
          <div className="flex items-center gap-3 flex-shrink-0 cursor-pointer" onClick={() => { setSearchQuery(""); setSelectedCategory("All Categories"); }}>
            {footerConfig.logoUrl && (
              <img src={footerConfig.logoUrl} alt={footerConfig.companyName} className="h-8 md:h-10 w-auto object-contain" />
            )}
            {footerConfig.showName !== false && (
              <h1 className="text-xl md:text-2xl font-heading font-extrabold text-primary tracking-tight">
                {footerConfig.companyName}
              </h1>
            )}
          </div>

          {/* Search Bar */}
          <div className="flex-1 flex justify-center px-0 md:px-10">
            <div className="flex w-full max-w-xl group relative">
              <input
                type="text"
                placeholder="Search in Buy A to z"
                className="w-full bg-daraz-bg px-4 py-2 rounded-l-md outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-gray-400 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="bg-primary text-white px-4 md:px-6 py-2 rounded-r-md hover:bg-primary-hover transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 sm:gap-6">
            {currentUser ? (
              <div className="hidden sm:flex items-center gap-4">
                <div className="text-xs font-semibold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  Hi, {currentUser.fullName.split(" ")[0]}
                </div>
                <button 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="text-xs font-bold text-primary hover:text-primary-hover transition-colors uppercase flex items-center gap-2"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center overflow-hidden">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-3.5 h-3.5" />
                    )}
                  </div>
                  Profile
                </button>
                <button 
                  onClick={() => setIsOrdersModalOpen(true)}
                  className="text-xs font-bold text-gray-500 hover:text-primary-hover transition-colors uppercase flex items-center gap-1.5"
                >
                  My Orders
                  {userOrders.filter(o => o.status === 'processing').length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping"></span>
                  )}
                </button>
                <button 
                  onClick={handleLogout}
                  className="text-xs font-bold text-gray-500 hover:text-secondary transition-colors uppercase"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <button 
                  onClick={() => { setAuthMode("login"); setIsAuthModalOpen(true); }}
                  className="text-sm font-semibold text-daraz-text hover:text-primary transition-colors hidden sm:block"
                >
                  Login
                </button>
                <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
                <button 
                  onClick={() => { setAuthMode("signup"); setIsAuthModalOpen(true); }}
                  className="text-sm font-semibold text-daraz-text hover:text-primary transition-colors hidden sm:block"
                >
                  Sign up
                </button>
              </>
            )}
            
            {/* User Icon for Mobile only - hidden (moved to bottom nav) */}
            {!currentUser && (
              <button 
                onClick={() => { setAuthMode("login"); setIsAuthModalOpen(true); }}
                className="hidden p-1 text-daraz-text hover:text-primary transition-colors"
              >
                <UserIcon className="w-6 h-6" />
              </button>
            )}
            {currentUser && (
              <button 
                onClick={handleLogout}
                className="hidden p-1 text-gray-400 hover:text-secondary transition-colors"
              >
                <EyeOff className="w-6 h-6" />
              </button>
            )}

            {/* Cart Icon - hidden on mobile (moved to bottom nav) */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-1 text-daraz-text hover:text-primary transition-colors group hidden md:block"
            >
              <ShoppingCart className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-secondary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden text-gray-700"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-6 pb-32 md:pb-6 flex gap-6">
        {/* --- Category Sidebar (Desktop Only) --- */}
        <aside className="hidden md:block w-56 bg-white p-5 border-r shadow-sm h-fit sticky top-20">
          <div className="text-[11px] font-bold text-gray-400 mb-6 uppercase tracking-wider">All Categories</div>
          <nav className="space-y-4">
            {categories.map((cat) => {
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`w-full text-left text-[13px] font-medium transition-all flex items-center gap-3 group ${
                    selectedCategory === cat.name 
                      ? "text-primary" 
                      : "text-gray-600 hover:text-primary"
                  }`}
                >
                  <span className="w-5 opacity-70">{cat.icon}</span>
                  {cat.name}
                </button>
              );
            })}
          </nav>

          {promotionConfig.isActive && (
            <div className="mt-10 p-4 rounded-lg bg-green-50 border border-green-100 italic">
              <p className="text-[10px] text-primary font-bold mb-1 uppercase">{promotionConfig.title}</p>
              <p className="text-[12px] leading-tight text-gray-700">{promotionConfig.description}</p>
            </div>
          )}

          {sidebarBanners.length > 0 && (
            <div className="mt-6 rounded-lg overflow-hidden border border-gray-100 shadow-sm relative group h-64">
               <AnimatePresence mode="wait">
                  <motion.img 
                    key={currentSidebarIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5 }}
                    src={sidebarBanners[currentSidebarIndex]} 
                    alt="Promotion" 
                    className="w-full h-full object-cover" 
                  />
               </AnimatePresence>
               {sidebarBanners.length > 1 && (
                 <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                   {sidebarBanners.map((_, i) => (
                     <div 
                       key={i} 
                       className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentSidebarIndex ? "bg-primary w-3" : "bg-white/50"}`}
                     />
                   ))}
                 </div>
               )}
            </div>
          )}
        </aside>

        {/* --- Main Content --- */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {/* Hero Slider */}
          <div className="relative overflow-hidden rounded-xl">
            <AnimatePresence mode="wait">
              {banners.length > 0 && banners[currentBannerIndex] ? (
                <div key={banners[currentBannerIndex].id}>
                  <BannerSection 
                    banner={banners[currentBannerIndex]} 
                    onShopNow={(cat?: string) => {
                      if (cat) {
                        setSelectedCategory(cat);
                      }
                      document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  />
                </div>
              ) : (
                <motion.section 
                  key="default-banner"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-48 md:h-64 rounded-xl bg-gradient-to-br from-primary to-primary-hover p-6 md:p-10 flex items-center justify-between text-white shadow-lg shrink-0 overflow-hidden relative"
                >
                  <div className="z-10">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Limited Offer</span>
                    <h2 className="text-3xl md:text-5xl font-extrabold my-2 leading-tight">Big Summer Sale</h2>
                    <p className="text-base md:text-lg opacity-90 mb-4">Save up to 60% on our premium collections.</p>
                    <button 
                      onClick={() => document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' })}
                      className="bg-white text-primary px-8 py-2.5 rounded-full font-bold shadow-xl hover:scale-105 transition-transform active:scale-95"
                    >
                      Shop Now
                    </button>
                  </div>
                  <div className="text-[160px] md:text-[220px] opacity-10 absolute -right-6 -bottom-10 transform rotate-12 select-none font-bold italic pointer-events-none text-white">
                    AZ
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {banners.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentBannerIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === currentBannerIndex ? "bg-white w-6" : "bg-white/40 hover:bg-white/60"}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Grid Area */}
          <div id="products-grid" className="flex-1 flex flex-col min-h-0 scroll-mt-20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold border-l-4 border-primary pl-3 uppercase tracking-tight text-daraz-text">
                {selectedCategory === "All Categories" ? "Just For You" : selectedCategory}
              </h3>
              <button 
                onClick={() => setSelectedCategory("All Categories")}
                className="text-primary text-sm font-bold hover:underline"
              >
                EXPLORE ALL
              </button>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredProducts.map(product => (
                  <motion.div 
                    layout
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow group flex flex-col"
                  >
                    <div 
                      onClick={() => handleOpenProduct(product)}
                      className="h-40 md:h-44 bg-gray-100 rounded-md mb-3 flex items-center justify-center relative overflow-hidden shrink-0 cursor-pointer"
                    >
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
                      />
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded font-black shadow-sm">
                          -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                        </div>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareProduct(product.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-white shadow-sm rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white"
                        title="Copy Product Link"
                      >
                        {copySuccessId === product.id ? <LinkIcon className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="flex-1 cursor-pointer" onClick={() => handleOpenProduct(product)}>
                      <p className="text-sm font-semibold text-daraz-text mb-0 line-clamp-1 group-hover:text-primary transition-colors">
                        {product.name}
                      </p>
                      {product.partNumber && (
                        <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tight">Code: {product.partNumber}</p>
                      )}
                      <p className="text-primary font-bold text-lg leading-none">
                        ৳{product.price.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {product.stock <= 0 ? (
                           <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-sm font-black uppercase">Out of Stock</span>
                        ) : (
                          <span className={`text-[10px] font-black uppercase tracking-tighter ${product.stock < 5 ? "text-red-600" : "text-green-600"}`}>
                            Stock: {product.stock}
                          </span>
                        )}
                      </div>
                      {product.originalPrice ? (
                        <p className="text-xs text-gray-400 line-through mt-1">
                          ৳{product.originalPrice.toLocaleString()}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 invisible mt-1">$0</p>
                      )}
                      <div className="mt-3 flex gap-2 pb-3 border-b border-gray-100">
                        {product.showSizes !== false && (
                          <div className="flex-1 space-y-1.5">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Size</p>
                            <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                              {product.availableSizes && product.availableSizes.length > 0 ? (
                                product.availableSizes.map(size => (
                                  <button 
                                    key={size}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setProductSelectedSizes(prev => ({ ...prev, [product.id]: size }));
                                    }}
                                    className={`text-[9px] font-black min-w-[24px] h-[24px] px-1 rounded-md uppercase transition-all border shadow-sm flex items-center justify-center ${
                                      productSelectedSizes[product.id] === size
                                        ? "bg-primary text-white border-primary scale-110"
                                        : "bg-white text-daraz-text border-gray-200 hover:border-primary/30"
                                    }`}
                                  >
                                    {size}
                                  </button>
                                ))
                              ) : (
                                <span className="text-[9px] text-gray-300 font-bold italic bg-gray-50 border border-dashed border-gray-200 px-2 rounded-md flex items-center">N/A</span>
                              )}
                            </div>
                          </div>
                        )}

                        {product.showColors !== false && (
                          <div className={`flex-1 space-y-1.5 ${product.showSizes !== false ? 'border-l border-gray-100 pl-3' : ''}`}>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Color</p>
                            <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                              {product.availableColors && product.availableColors.length > 0 ? (
                                product.availableColors.map(color => (
                                  <button 
                                    key={color}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setProductSelectedColors(prev => ({ ...prev, [product.id]: color }));
                                    }}
                                    className={`text-[9px] font-black min-w-[24px] h-[24px] px-1 rounded-md uppercase transition-all border shadow-sm flex items-center justify-center ${
                                      productSelectedColors[product.id] === color
                                        ? "bg-emerald-500 text-white border-emerald-500 scale-110"
                                        : "bg-white text-daraz-text border-gray-200 hover:border-emerald-500/30"
                                    }`}
                                  >
                                    {color.substring(0, 2)}
                                  </button>
                                ))
                              ) : (
                                <span className="text-[9px] text-gray-300 font-bold italic bg-gray-50 border border-dashed border-gray-200 px-2 rounded-md flex items-center">N/A</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-2">
                        <span className="text-yellow-400">
                          {"★".repeat(Math.floor(product.rating))}
                          {"☆".repeat(5 - Math.floor(product.rating))}
                        </span>
                        ({product.reviewCount})
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="mt-4">
                      {product.stock <= 0 ? (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!wishlistedProductIds.includes(product.id)) {
                              setWishlistedProductIds(prev => [...prev, product.id]);
                              alert("Product added to your wishlist!");
                            }
                          }}
                          className={`w-full py-2 rounded text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
                            wishlistedProductIds.includes(product.id)
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-primary text-white hover:bg-primary-hover"
                          }`}
                        >
                          <Heart className={`w-3 h-3 ${wishlistedProductIds.includes(product.id) ? "fill-gray-400" : ""}`} />
                          {wishlistedProductIds.includes(product.id) ? "In Wishlist" : "Wishlist"}
                        </button>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const size = productSelectedSizes[product.id];
                              const color = productSelectedColors[product.id];
                              if (product.showSizes !== false && product.availableSizes && product.availableSizes.length > 0 && !size) {
                                alert("Please select a size first!");
                                return;
                              }
                              if (product.showColors !== false && product.availableColors && product.availableColors.length > 0 && !color) {
                                alert("Please select a color first!");
                                return;
                              }
                              addToCart(product, size, color);
                            }}
                            className="bg-green-50 text-primary border border-primary/20 py-2 rounded text-[10px] font-bold uppercase hover:bg-primary hover:text-white transition-all active:scale-95"
                          >
                            Add to Cart
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const size = productSelectedSizes[product.id];
                              const color = productSelectedColors[product.id];
                              if (product.showSizes !== false && product.availableSizes && product.availableSizes.length > 0 && !size) {
                                alert("Please select a size first!");
                                return;
                              }
                              if (product.showColors !== false && product.availableColors && product.availableColors.length > 0 && !color) {
                                alert("Please select a color first!");
                                return;
                              }
                              handleBuyNow(product, size, color);
                            }}
                            className="bg-secondary text-white py-2 rounded text-[10px] font-bold uppercase hover:bg-secondary-hover transition-all shadow-sm active:scale-95"
                          >
                            Buy Now
                          </button>
                        </div>
                      )}
                    </div>

                    {(isAdmin || currentUser?.isAdmin || currentUser?.role === 'admin' || currentUser?.email === "udayonbiswas2003@gmail.com") && (
                      <div className="mt-2 pt-2 border-t border-dashed flex gap-2">
                        <button 
                          onClick={() => { 
                            setUploadedProductImage(""); 
                            setEditingProduct(product); 
                            setIsAdminPanelOpen(true); 
                            setTimeout(() => {
                              document.getElementById('admin-panel-content')?.scrollTo({ top: 0, behavior: 'smooth' });
                            }, 100);
                          }}
                          className="flex-1 bg-gray-100 text-gray-700 py-1.5 rounded text-[9px] font-bold uppercase hover:bg-gray-200 transition-all font-sans"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="flex-1 bg-red-50 text-red-500 py-1.5 rounded text-[9px] font-bold uppercase hover:bg-secondary hover:text-white transition-all font-sans"
                        >
                          Del
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center bg-white rounded-xl shadow-sm border border-dashed border-gray-200">
                <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-400 uppercase tracking-widest">No Matches Found</h3>
                <p className="text-gray-300 text-sm mt-1">Try a different search term or category</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* --- Admin Entry --- */}
      {(isAdmin || currentUser?.isAdmin || currentUser?.role === 'admin' || currentUser?.email === "udayonbiswas2003@gmail.com") && (
        <button 
          onClick={() => { setEditingProduct(null); setIsAdminPanelOpen(true); }}
          className="fixed bottom-6 right-6 z-[100] bg-daraz-text text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
        >
          <Settings className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
        </button>
      )}

      {/* --- Admin Panel Modal --- */}
      <AnimatePresence>
        {isAdminPanelOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdminPanelOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="border-b bg-white sticky top-0 z-20">
                <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center justify-between md:justify-start md:gap-6 flex-wrap md:flex-nowrap">
                    <h3 className="text-lg md:text-xl font-bold text-daraz-text flex items-center gap-2">
                       <Settings className="w-5 h-5 text-primary" />
                       <span className="whitespace-nowrap">Admin Panel</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleManualSync}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100 disabled:opacity-50"
                        title="Sync All Data to Cloud"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        <span className="hidden md:inline">Full Backup</span>
                      </button>
                    </div>
                    <button onClick={() => setIsAdminPanelOpen(false)} className="md:hidden text-2xl leading-none">&times;</button>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto min-w-0 overflow-hidden">
                    <div className="flex bg-gray-100 p-1.5 rounded-xl gap-1.5 overflow-x-auto scroll-smooth flex-1 min-w-0 snap-x">
                      {["dashboard", "products", "orders", "categories", "purchases", "users", "homepage", "footer", "promo", "database"].map((tab) => (
                        <button 
                          key={tab}
                          onClick={() => setAdminTab(tab as any)}
                          className={`px-4 py-1.5 rounded-lg text-[10px] md:text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 snap-start ${
                            adminTab === tab 
                              ? (tab === "database" ? "bg-red-500 text-white" : "bg-white text-primary shadow-sm ring-1 ring-black/5") 
                              : "text-gray-500 hover:bg-white/50"
                          }`}
                        >
                          {tab === "promo" ? "Offer" : 
                           tab === "homepage" ? "Slider" : 
                           tab === "database" ? "Fix DB" : 
                           tab === "purchases" ? "Inventory" :
                           tab.charAt(0).toUpperCase() + tab.slice(1)}
                          {tab === "users" && ` (${users.length})`}
                        </button>
                      ))}
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                      <button onClick={() => setIsAdminPanelOpen(false)} className="text-2xl leading-none">&times;</button>
                    </div>
                  </div>
                </div>

                {/* Cloud Sync Status Banner */}
                <div className={`px-8 py-3 flex items-center justify-between border-b transition-all duration-500 ${
                  cloudStatus === 'connected' ? 'bg-emerald-50/80 border-emerald-100' : 
                  cloudStatus === 'syncing' ? 'bg-blue-50/80 border-blue-100' :
                  cloudStatus === 'error' ? 'bg-red-50/80 border-red-100' : 'bg-gray-50/80 border-gray-100'
                }`}>
                  <div className="flex items-center gap-3">
                    {cloudStatus === 'syncing' ? (
                      <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                    ) : (
                      <Cloud className={`w-3.5 h-3.5 ${
                        cloudStatus === 'connected' ? 'text-emerald-600' : 
                        cloudStatus === 'error' ? 'text-red-600' : 'text-gray-400'
                      }`} />
                    )}
                    <div>
                      <p className={`text-[9px] font-black uppercase tracking-widest ${
                        cloudStatus === 'connected' ? 'text-emerald-700' : 
                        cloudStatus === 'error' ? 'text-red-700' : 'text-gray-600'
                      }`}>
                        {cloudStatus === 'connected' ? 'Cloud Sync: Active & Secure' : 
                         cloudStatus === 'syncing' ? 'Cloud Syncing...' :
                         cloudStatus === 'error' ? 'Cloud Sync Failed' : 'Cloud Status: Unknown'}
                      </p>
                      {cloudError && (
                        <p className="text-[8px] text-red-500 font-bold uppercase mt-0.5 truncate max-w-[200px] md:max-w-md">
                          Error: {cloudError}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden lg:flex gap-3">
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest bg-gray-200/30 px-2 py-0.5 rounded">P: {products.length}</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest bg-gray-200/30 px-2 py-0.5 rounded">O: {orders.length}</span>
                    </div>
                    <button 
                      onClick={handleManualSync}
                      title="Sync All Data to Supabase"
                      className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                      Cloud Backup
                    </button>
                    <button 
                      onClick={testConnection}
                      className="bg-white/80 hover:bg-white text-[9px] font-black text-primary border border-primary/20 px-3 py-1 rounded-full transition-all flex items-center gap-2 shadow-sm"
                    >
                      <RefreshCw className={`w-3 h-3 ${cloudStatus === 'syncing' ? 'animate-spin' : ''}`} />
                      Test Conn
                    </button>
                  </div>
                </div>
              </div>

              {adminTab === "dashboard" ? (
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
                  <div className="max-w-5xl mx-auto space-y-8">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Sales</p>
                        <p className="text-2xl font-black text-daraz-text mt-1">৳{adminStats.totalRevenue.toLocaleString()}</p>
                        <p className="text-[10px] text-green-500 font-bold mt-1 uppercase">+{Math.round(adminStats.totalRevenue * 0.12).toLocaleString()} This Month</p>
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                          <ShoppingCart className="w-5 h-5" />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Orders</p>
                        <p className="text-2xl font-black text-daraz-text mt-1">{adminStats.totalOrders}</p>
                        <p className="text-[10px] text-blue-500 font-bold mt-1 uppercase">{orders.filter(o => o.status === 'processing').length} Pending</p>
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
                          <UserIcon className="w-5 h-5" />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customers</p>
                        <p className="text-2xl font-black text-daraz-text mt-1">{adminStats.totalUsers}</p>
                        <p className="text-[10px] text-indigo-500 font-bold mt-1 uppercase">Active Users</p>
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
                          <Palette className="w-5 h-5" />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Products</p>
                        <p className="text-2xl font-black text-daraz-text mt-1">{adminStats.totalProducts}</p>
                        <p className="text-[10px] text-emerald-500 font-bold mt-1 uppercase">Live in Store</p>
                      </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Revenue Chart */}
                      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                          <div>
                            <h4 className="text-sm font-black text-daraz-text uppercase tracking-widest">Revenue Overview</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Last 7 Days Earnings</p>
                          </div>
                          <div className="p-2 bg-gray-50 rounded-xl text-primary">
                            <RefreshCw className="w-4 h-4 cursor-pointer hover:rotate-180 transition-all duration-500" />
                          </div>
                        </div>
                        <div className="h-[250px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={adminStats.last7Days}>
                              <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#f85606" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#f85606" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                dy={10}
                              />
                              <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                tickFormatter={(value) => `৳${value}`}
                              />
                              <ChartTooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Revenue']}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="total" 
                                stroke="#f85606" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorTotal)" 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Order Status Distribution */}
                      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                          <div>
                            <h4 className="text-sm font-black text-daraz-text uppercase tracking-widest">Order Status</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Lifecycle distribution</p>
                          </div>
                        </div>
                        <div className="h-[250px] w-full flex items-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={adminStats.statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {adminStats.statusData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <ChartTooltip 
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                              />
                              <Legend 
                                verticalAlign="bottom" 
                                height={36} 
                                iconType="circle"
                                formatter={(value) => <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{value}</span>}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Orders Mini Table */}
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                        <div>
                          <h4 className="text-sm font-black text-daraz-text uppercase tracking-widest">Recent Activity</h4>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Live Order Stream & Day Book</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                           <div className="relative flex-1 md:w-48">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                              <input 
                                type="text" 
                                placeholder="FIND..." 
                                className="w-full bg-gray-50 border border-transparent focus:border-primary focus:bg-white rounded-xl pl-9 pr-4 py-2 text-[10px] font-bold outline-none transition-all shadow-sm"
                                onChange={(e) => setSearchQuery(e.target.value)}
                              />
                           </div>
                           <input 
                             type="date"
                             onChange={(e) => setOrderDateFilter(e.target.value)}
                             className="bg-gray-50 border border-transparent focus:border-primary focus:bg-white rounded-xl px-4 py-2 text-[10px] font-bold outline-none transition-all shadow-sm font-mono"
                             title="Day Book - Filter by Date"
                           />
                           <button 
                             onClick={() => {
                               setSearchQuery("");
                               setOrderDateFilter("");
                             }}
                             className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                             title="Clear Filters"
                           >
                              <RefreshCw className="w-4 h-4 text-gray-500" />
                           </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b">
                              <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID</th>
                              <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                              <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                              <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {orders
                              .filter(o => {
                                const matchesQuery = !searchQuery || 
                                  o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  (o.customerInfo?.phone || "").includes(searchQuery);
                                
                                const matchesDate = !orderDateFilter || 
                                  new Date(o.timestamp).toISOString().split('T')[0] === orderDateFilter;

                                return matchesQuery && matchesDate;
                              })
                              .slice(0, (searchQuery || orderDateFilter) ? 20 : 5)
                              .map((order) => (
                              <tr key={order.id} className="group hover:bg-gray-50/50 transition-colors">
                                <td className="py-4 text-xs font-bold text-daraz-text font-mono uppercase">{order.id.slice(0, 8)}...</td>
                                <td className="py-4">
                                  <p className="text-xs font-bold text-daraz-text">{order.customerName}</p>
                                  <p className="text-[9px] text-gray-400 font-medium">{order.customerEmail}</p>
                                </td>
                                <td className="py-4 text-xs font-black text-primary">৳{order.total.toLocaleString()}</td>
                                <td className="py-4">
                                  <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
                                    order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                                    order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                                    'bg-orange-100 text-orange-600'
                                  }`}>
                                    {order.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
              ) : adminTab === "database" ? (
                <div id="admin-panel-content" className="flex-1 overflow-y-auto px-8 py-8 bg-gray-50">
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-white p-8 rounded-3xl border-2 border-red-100 shadow-xl overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Settings className="w-48 h-48 animate-spin" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-3 bg-red-100 rounded-2xl text-red-600">
                            <ShieldCheck className="w-8 h-8" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-black text-daraz-text uppercase tracking-tight">Database Fix & Cloud Sync</h2>
                            <p className="text-sm text-gray-500 font-medium">নিচে দেওয়া SQL কোডটি রান করলে আপনার ডাটা সেভ না হওয়ার সমস্যাটি সমাধান হবে।</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                          <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                            <h3 className="text-sm font-black text-orange-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <span className="w-5 h-5 bg-orange-200 rounded-full flex items-center justify-center text-[10px]">1</span>
                              কোডটি কপি করুন
                            </h3>
                            <button 
                              onClick={() => {
                                const sql = document.getElementById('sql-fix-code')?.innerText;
                                if (sql) {
                                  navigator.clipboard.writeText(sql);
                                  alert("✅ SQL Code copied to clipboard!");
                                }
                              }}
                              className="w-full bg-emerald-500 text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-100 transition-all active:scale-95"
                            >
                              কপি SQL কোড
                            </button>
                          </div>
                          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100/50">
                            <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-[10px]">2</span>
                              Supabase-এ রান করুন
                            </h3>
                            <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                              ১. আপনার Supabase ড্যাশবোর্ডে যান।<br/>
                              ২. বাম দিকের মেনু থেকে "SQL Editor" সিলেক্ট করুন।<br/>
                              ৩. কোডটি পেস্ট করে "Run" বাটনে ক্লিক করুন।
                            </p>
                          </div>
                        </div>

                        <div className="bg-slate-900 rounded-2xl p-6 mb-8 shadow-inner overflow-x-auto relative min-h-[300px]">
                          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
                             <div className="flex items-center gap-2">
                               <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                               <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                               <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                             </div>
                             <span className="text-[10px] font-mono text-slate-500 uppercase">supabase_setup.sql</span>
                          </div>
                          <pre id="sql-fix-code" className="text-emerald-400 font-mono text-sm leading-relaxed whitespace-pre">
{`-- 🚀 COMPLETE DATABASE SETUP & RECOVERY (v9 - FINAL STABLE)
-- RUN THIS IN SUPABASE SQL EDITOR TO FIX ALL TABLES & RLS ERRORS

-- 1. ALL TABLES SETUP
CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT NOT NULL, price NUMERIC NOT NULL, "originalPrice" NUMERIC, image TEXT, category TEXT, rating NUMERIC DEFAULT 4.5, "reviewCount" INTEGER DEFAULT 0, discount NUMERIC DEFAULT 0, stock INTEGER DEFAULT 0, location TEXT, "partNumber" TEXT, "galleryImages" JSONB DEFAULT '[]'::jsonb, "availableSizes" JSONB DEFAULT '[]'::jsonb, "showSizes" BOOLEAN DEFAULT true, "availableColors" JSONB DEFAULT '[]'::jsonb, "showColors" BOOLEAN DEFAULT true, description TEXT, weight TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL, icon TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS banners (id TEXT PRIMARY KEY, title TEXT, subtitle TEXT, "buttonText" TEXT, "imageUrl" TEXT, "backgroundColor" TEXT, "textColor" TEXT, "categoryLink" TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, "customerId" TEXT, "customerName" TEXT, "customerEmail" TEXT, "customerMobile" TEXT, items JSONB NOT NULL DEFAULT '[]'::jsonb, total NUMERIC NOT NULL, status TEXT DEFAULT 'processing', timestamp TIMESTAMPTZ DEFAULT NOW(), delivery JSONB NOT NULL DEFAULT '{}'::jsonb, payment JSONB NOT NULL DEFAULT '{}'::jsonb, "trackingNumber" TEXT, "trackingCarrier" TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS users (uid TEXT PRIMARY KEY, id TEXT, "fullName" TEXT, email TEXT UNIQUE, "mobileNumber" TEXT, password TEXT, avatar TEXT, role TEXT DEFAULT 'user', "isAdmin" BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS configs (key TEXT PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS reviews (id TEXT PRIMARY KEY, "productId" TEXT, "userId" TEXT, "userName" TEXT, rating INTEGER, comment TEXT, timestamp TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS suppliers (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT, email TEXT, address TEXT, "category" TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS purchases (id TEXT PRIMARY KEY, "supplierId" TEXT, "supplierName" TEXT, timestamp TIMESTAMPTZ DEFAULT NOW(), items JSONB DEFAULT '[]'::jsonb, "totalAmount" NUMERIC, status TEXT, note TEXT);

-- 2. ENSURE ALL COLUMNS EXIST & CONSTRAINTS ARE ADJUSTED
ALTER TABLE products ADD COLUMN IF NOT EXISTS "availableSizes" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "showSizes" BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "availableColors" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "showColors" BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "galleryImages" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "partNumber" TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "weight" TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "originalPrice" NUMERIC;
ALTER TABLE users ADD COLUMN IF NOT EXISTS id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "mobileNumber" TEXT;

-- Remove problematic unique constraint on mobileNumber if it exists
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_mobileNumber_key') THEN
    ALTER TABLE users DROP CONSTRAINT "users_mobileNumber_key";
  END IF;
END $$;

-- 3. 🔓 DISABLE RLS & ALLOW PUBLIC ACCESS (FIXES ALL PIRACY/SECURITY ERRORS)
DO $$ 
BEGIN
  -- Products
  ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "public_p" ON products;
  CREATE POLICY "public_p" ON products FOR ALL USING (true) WITH CHECK (true);
  
  -- Suppliers
  ALTER TABLE IF EXISTS suppliers DISABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "public_s" ON suppliers;
  CREATE POLICY "public_s" ON suppliers FOR ALL USING (true) WITH CHECK (true);

  -- Purchases
  ALTER TABLE IF EXISTS purchases DISABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "public_pur" ON purchases;
  CREATE POLICY "public_pur" ON purchases FOR ALL USING (true) WITH CHECK (true);
  
  -- Categories
  ALTER TABLE IF EXISTS categories DISABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "public_c" ON categories;
  CREATE POLICY "public_c" ON categories FOR ALL USING (true) WITH CHECK (true);

  -- Orders
  ALTER TABLE IF EXISTS orders DISABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "public_o" ON orders;
  CREATE POLICY "public_o" ON orders FOR ALL USING (true) WITH CHECK (true);

  -- Users
  ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "public_u" ON users;
  CREATE POLICY "public_u" ON users FOR ALL USING (true) WITH CHECK (true);

  -- Banners
  ALTER TABLE IF EXISTS banners DISABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "public_b" ON banners;
  CREATE POLICY "public_b" ON banners FOR ALL USING (true) WITH CHECK (true);

  -- Configs
  ALTER TABLE IF EXISTS configs DISABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "public_cfg" ON configs;
  CREATE POLICY "public_cfg" ON configs FOR ALL USING (true) WITH CHECK (true);

  -- Reviews
  ALTER TABLE IF EXISTS reviews DISABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "public_r" ON reviews;
  CREATE POLICY "public_r" ON reviews FOR ALL USING (true) WITH CHECK (true);
END $$;
`}
                          </pre>
                        </div>
                        
                        <div className="flex items-center gap-4 p-5 bg-blue-50 rounded-2xl border border-blue-100">
                          <div className="p-3 bg-blue-500 rounded-2xl text-white">
                            <RefreshCw className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm text-blue-900 font-bold">Why is this needed?</p>
                            <p className="text-xs text-blue-700 leading-relaxed mt-1">
                              If you added "Sizes" or "Description" and they are not saving, it means your database doesn't have those columns yet. Running this SQL will add them instantly without deleting your data.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : adminTab === "products" ? (
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="px-8 py-4 border-b bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h4 className="text-xs font-black text-daraz-text uppercase tracking-widest">
                        {adminProductView === 'edit' ? (editingProduct ? "Editing Product" : "New Product Details") : "Product Inventory Manager"}
                      </h4>
                      {adminProductView === 'edit' && (
                        <button 
                          onClick={() => setAdminProductView('list')}
                          className="text-[9px] font-black text-primary uppercase bg-primary/5 px-3 py-1 rounded-full border border-primary/20 hover:bg-primary/10 transition-all"
                        >
                          &larr; Back to List
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                       {adminProductView === 'list' && (
                         <button 
                           onClick={() => {
                             setEditingProduct(null);
                             setAdminProductView('edit');
                           }}
                           className="bg-primary text-white px-4 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                         >
                           <Plus className="w-3 h-3" />
                           Add New product
                         </button>
                       )}
                      <button 
                        type="button"
                        onClick={async () => {
                          setIsLoading(true);
                          try {
                            const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
                            if (error) throw error;
                            if (data) {
                              const formatted = data.map(p => ({
                                ...p,
                                availableSizes: Array.isArray(p.availableSizes) ? p.availableSizes : [],
                                availableColors: Array.isArray(p.availableColors) ? p.availableColors : [],
                                galleryImages: Array.isArray(p.galleryImages) ? p.galleryImages : []
                              })) as Product[];
                              setProducts(formatted);
                              await safeIdbSet("buy_a_to_z_products", formatted);
                              alert("✅ Products synchronized from cloud.");
                            }
                          } catch (err: any) {
                            alert("❌ Sync failed: " + err.message);
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                        className="text-[10px] bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-50 transition-all flex items-center gap-2"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh Products
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
                    {adminProductView === 'list' ? (
                      <div className="space-y-6">
                        <div className="relative mb-6">
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                           <input 
                             type="text" 
                             placeholder="SEARCH INVENTORY BY NAME OR CODE..." 
                             className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-6 py-4 text-xs font-bold outline-none focus:border-primary shadow-sm"
                             onChange={(e) => setSearchQuery(e.target.value)}
                           />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredProducts.map((p) => (
                            <div key={p.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all group overflow-hidden flex flex-col">
                              <div className="aspect-square relative overflow-hidden bg-gray-100 border-b">
                                <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                {p.stock <= 5 && (
                                  <div className="absolute top-4 left-4 bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest animate-pulse">Low Stock</div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                   <button 
                                     onClick={() => {
                                       setEditingProduct(p);
                                       setAdminProductView('edit');
                                     }}
                                     className="bg-white text-daraz-text p-3 rounded-2xl hover:bg-primary hover:text-white transition-all transform hover:-translate-y-1"
                                   >
                                     <Edit2 className="w-5 h-5" />
                                   </button>
                                   <button 
                                     onClick={() => handleDeleteProduct(p.id)}
                                     className="bg-white text-red-500 p-3 rounded-2xl hover:bg-red-500 hover:text-white transition-all transform hover:-translate-y-1"
                                   >
                                     <Trash2 className="w-5 h-5" />
                                   </button>
                                </div>
                              </div>
                              <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-[8px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded">{p.category}</span>
                                  <span className="font-mono text-[9px] text-gray-400 font-bold uppercase">{p.partNumber || 'No Code'}</span>
                                </div>
                                <h5 className="font-black text-daraz-text uppercase tracking-tight text-sm line-clamp-1 mb-2">{p.name}</h5>
                                <div className="mt-auto flex justify-between items-end">
                                   <div>
                                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rate</p>
                                     <p className="text-sm font-black text-emerald-600 font-mono">৳{p.price.toLocaleString()}</p>
                                   </div>
                                   <div className="text-right">
                                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Balance</p>
                                     <p className={`text-sm font-black font-mono ${p.stock <= 0 ? 'text-red-500' : 'text-daraz-text'}`}>{p.stock} Units</p>
                                   </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <form id="product-form" className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl relative space-y-6 overflow-y-auto"
                    onSubmit={async (e) => {
                    e.preventDefault();
                    setIsLoading(true);
                    try {
                      const formData = new FormData(e.currentTarget);
                      const data = {
                        id: editingProduct?.id || Date.now().toString(),
                        name: formData.get("name") as string,
                        price: Number(formData.get("price")),
                        originalPrice: formData.get("originalPrice") ? Number(formData.get("originalPrice")) : undefined,
                        discount: formData.get("discount") ? Number(formData.get("discount")) : undefined,
                        image: formData.get("image") as string,
                        category: formData.get("category") as string,
                        rating: editingProduct?.rating || 4.5,
                        reviewCount: editingProduct?.reviewCount || 0,
                        stock: Number(formData.get("stock")) || 0,
                        partNumber: formData.get("partNumber") as string,
                        description: formData.get("description") as string,
                        availableSizes: (editingProduct?.availableSizes) || [],
                        showSizes: editingProduct?.showSizes !== false,
                        availableColors: (editingProduct?.availableColors) || [],
                        showColors: editingProduct?.showColors !== false,
                        galleryImages: editingGalleryImages
                      } as Product;
                      
                      if (editingProduct && editingProduct.id) {
                        await handleUpdateProduct(data);
                        // handleUpdateProduct already clears states and alerts if needed
                      } else {
                        await handleAddProduct(data);
                        (e.target as HTMLFormElement).reset();
                        setUploadedProductImage("");
                        setEditingProduct(null);
                      }
                    } catch (error: any) {
                      console.error("Admin Action Error:", error);
                      alert("Error: " + (error.message || "Failed to save product"));
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                >
                  <div className="flex items-center justify-end mb-4 pr-8 pt-4">
                    <div className="flex gap-4">
                      {products.length === 0 && !editingProduct && (
                        <button 
                          type="button"
                          onClick={handleSeedData}
                          className="text-xs text-green-600 font-bold hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Seed Demo Products
                        </button>
                      )}
                      {editingProduct && (
                        <button 
                          type="button" 
                          onClick={() => { setUploadedProductImage(""); setEditingProduct(null); }} 
                          className="text-xs text-primary font-bold hover:underline"
                        >
                          Reset to Add New
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 pb-20">
                    <div className="col-span-2 grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                      <div>
                        <label className="text-[10px] font-bold text-primary block mb-1 uppercase tracking-wider">Product Name</label>
                        <input 
                          name="name" 
                          required 
                          key={editingProduct?.id || 'new'}
                          defaultValue={editingProduct?.name}
                          className="w-full border border-gray-200 rounded px-3 py-2 outline-none focus:border-primary text-sm font-bold bg-white" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-indigo-600 block mb-1 uppercase tracking-wider">Product Code / Part No.</label>
                        <input 
                          name="partNumber" 
                          key={editingProduct?.id || 'new-sku'}
                          defaultValue={editingProduct?.partNumber || ""}
                          placeholder="e.g. SKU-1234"
                          className="w-full border border-indigo-200 rounded px-3 py-2 outline-none focus:border-indigo-600 text-sm font-bold bg-indigo-50/30" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Current Price (৳)</label>
                      <input 
                        name="price" 
                        type="number" 
                        required 
                        key={editingProduct?.id || 'new-price'}
                        defaultValue={editingProduct?.price}
                        className="w-full border border-gray-200 rounded px-3 py-2.5 outline-none focus:border-primary text-sm bg-gray-50/50" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Original Price (৳ - Optional)</label>
                      <input 
                        name="originalPrice" 
                        type="number" 
                        key={editingProduct?.id || 'new-orig'}
                        defaultValue={editingProduct?.originalPrice}
                        className="w-full border border-gray-200 rounded px-3 py-2.5 outline-none focus:border-primary text-sm bg-gray-50/50" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Category</label>
                      <select 
                        name="category" 
                        key={editingProduct?.id || 'new-cat'}
                        defaultValue={editingProduct?.category || (categories[0]?.name || "Electronics")}
                        className="w-full border border-gray-200 rounded px-3 py-2.5 outline-none focus:border-primary text-sm bg-gray-50/50"
                      >
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Discount % (Optional)</label>
                      <input 
                        name="discount" 
                        type="number" 
                        key={editingProduct?.id || 'new-disc'}
                        defaultValue={editingProduct?.discount}
                        className="w-full border border-gray-200 rounded px-3 py-2.5 outline-none focus:border-primary text-sm bg-gray-50/50" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase tracking-wider text-primary">In Stock Quantity</label>
                      <input 
                        name="stock" 
                        type="number" 
                        key={editingProduct?.id || 'new-stock'}
                        defaultValue={editingProduct?.stock || 0}
                        placeholder="Quantity"
                        className="w-full border border-primary/30 rounded px-3 py-2.5 outline-none focus:border-primary text-sm font-bold bg-primary/5 shadow-inner" 
                        required
                        min="0"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Product Description</label>
                      <textarea 
                        name="description" 
                        rows={3}
                        key={editingProduct?.id || 'new-desc'}
                        defaultValue={editingProduct?.description || ""}
                        placeholder="Detail information about the product..."
                        className="w-full border border-gray-200 rounded px-3 py-2.5 outline-none focus:border-primary text-sm bg-gray-50/50"
                      />
                    </div>
                    <div className="col-span-2 grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-gray-700 uppercase">Show Sizes:</label>
                          <button
                            type="button"
                            onClick={() => setEditingProduct(prev => prev ? { ...prev, showSizes: !prev.showSizes } : null)}
                            className={`w-10 h-5 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none ${editingProduct?.showSizes !== false ? 'bg-primary' : 'bg-gray-200'}`}
                          >
                            <div className={`w-3 h-3 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${editingProduct?.showSizes !== false ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-gray-700 uppercase">Show Colors:</label>
                          <button
                            type="button"
                            onClick={() => setEditingProduct(prev => prev ? { ...prev, showColors: !prev.showColors } : null)}
                            className={`w-10 h-5 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none ${editingProduct?.showColors !== false ? 'bg-primary' : 'bg-gray-200'}`}
                          >
                            <div className={`w-3 h-3 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${editingProduct?.showColors !== false ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Size Management */}
                      <div className="bg-primary/5 p-5 rounded-2xl border border-primary/20">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <label className="text-[11px] font-black text-primary block uppercase tracking-widest">Size Management</label>
                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Leave empty for Free Size</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          {(editingProduct?.availableSizes || []).map((size, idx) => (
                            <div key={idx} className="bg-white border border-primary/20 px-3 py-1.5 rounded-lg flex items-center gap-2 group hover:border-primary transition-all shadow-sm">
                              <span className="text-xs font-black text-daraz-text uppercase">{size}</span>
                              <button 
                                type="button"
                                onClick={() => {
                                  const newSizes = (editingProduct?.availableSizes || []).filter((_, i) => i !== idx);
                                  setEditingProduct(prev => {
                                    const base = prev || { availableSizes: [] } as any;
                                    return { ...base, availableSizes: newSizes };
                                  });
                                }}
                                className="text-gray-300 hover:text-red-500 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <input 
                            type="text"
                            id="new-size-input"
                            placeholder="Add size (XL, 42)"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = (e.target as HTMLInputElement).value.trim();
                                if (val) {
                                  const currentSizes = editingProduct?.availableSizes || [];
                                  if (!currentSizes.includes(val)) {
                                    setEditingProduct(prev => {
                                      const base = prev || { availableSizes: [] } as any;
                                      return { ...base, availableSizes: [...(base.availableSizes || []), val] };
                                    });
                                  }
                                  (e.target as HTMLInputElement).value = "";
                                }
                              }
                            }}
                            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-xs outline-none focus:border-primary bg-white shadow-sm"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              const input = document.getElementById('new-size-input') as HTMLInputElement;
                              const val = input.value.trim();
                              if (val) {
                                const currentSizes = editingProduct?.availableSizes || [];
                                if (!currentSizes.includes(val)) {
                                  setEditingProduct(prev => {
                                    const base = prev || { availableSizes: [] } as any;
                                    return { ...base, availableSizes: [...(base.availableSizes || []), val] };
                                  });
                                }
                                input.value = "";
                              }
                            }}
                            className="bg-primary text-white px-4 py-2 rounded-xl font-black text-[10px] hover:bg-primary-hover transition-all uppercase shadow-md"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {/* Color Management */}
                      <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <label className="text-[11px] font-black text-emerald-600 block uppercase tracking-widest">Color Management</label>
                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">Add custom colors or names</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          {(editingProduct?.availableColors || []).map((color, idx) => (
                            <div key={idx} className="bg-white border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-2 group hover:border-emerald-500 transition-all shadow-sm">
                              <span className="text-xs font-black text-daraz-text uppercase">{color}</span>
                              <button 
                                type="button"
                                onClick={() => {
                                  const newColors = (editingProduct?.availableColors || []).filter((_, i) => i !== idx);
                                  setEditingProduct(prev => {
                                    const base = prev || { availableColors: [] } as any;
                                    return { ...base, availableColors: newColors };
                                  });
                                }}
                                className="text-gray-300 hover:text-red-500 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <input 
                            type="text"
                            id="new-color-input"
                            placeholder="Add color (Red, Black)"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = (e.target as HTMLInputElement).value.trim();
                                if (val) {
                                  const currentColors = editingProduct?.availableColors || [];
                                  if (!currentColors.includes(val)) {
                                    setEditingProduct(prev => {
                                      const base = prev || { availableColors: [] } as any;
                                      return { ...base, availableColors: [...(base.availableColors || []), val] };
                                    });
                                  }
                                  (e.target as HTMLInputElement).value = "";
                                }
                              }
                            }}
                            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-xs outline-none focus:border-emerald-500 bg-white shadow-sm"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              const input = document.getElementById('new-color-input') as HTMLInputElement;
                              const val = input.value.trim();
                              if (val) {
                                const currentColors = editingProduct?.availableColors || [];
                                if (!currentColors.includes(val)) {
                                  setEditingProduct(prev => {
                                    const base = prev || { availableColors: [] } as any;
                                    return { ...base, availableColors: [...(base.availableColors || []), val] };
                                  });
                                }
                                input.value = "";
                              }
                            }}
                            className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-black text-[10px] hover:bg-emerald-600 transition-all uppercase shadow-md"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Product Image</label>
                      <div className="flex gap-4 items-center">
                        { (uploadedProductImage || editingProduct?.image) && (
                          <div className="w-16 h-16 rounded border overflow-hidden shrink-0">
                            <img src={uploadedProductImage || editingProduct?.image} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const base64 = await toBase64(file);
                              setUploadedProductImage(base64);
                            }
                          }}
                          className="w-full border border-gray-200 rounded px-3 py-2 text-xs outline-none focus:border-primary bg-gray-50/50" 
                        />
                      </div>
                      <input 
                        type="hidden"
                        name="image"
                        value={uploadedProductImage || editingProduct?.image || ""}
                      />
                    </div>

                    <div className="col-span-2 space-y-3">
                      <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Product Gallery (Internal Images)</label>
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            value={newGalleryUrl}
                            onChange={(e) => setNewGalleryUrl(e.target.value)}
                            placeholder="Paste image URL here"
                            className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-primary bg-gray-50/50"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              if (newGalleryUrl.trim()) {
                                setEditingGalleryImages(prev => [...prev, newGalleryUrl.trim()]);
                                setNewGalleryUrl("");
                              }
                            }}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded font-bold text-xs hover:bg-gray-200 transition-all"
                          >
                            Add URL
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <label className="flex-1 cursor-pointer group">
                             <div className="border-2 border-dashed border-gray-200 rounded-xl py-4 flex flex-col items-center justify-center bg-gray-50 group-hover:bg-gray-100 group-hover:border-primary/30 transition-all">
                               <input 
                                 type="file" 
                                 className="hidden" 
                                 multiple 
                                 accept="image/*"
                                 onChange={(e) => {
                                   const files = e.target.files;
                                   if (files) {
                                     Array.from(files).forEach((file: File) => {
                                       const reader = new FileReader();
                                       reader.onloadend = () => {
                                         if (typeof reader.result === 'string') {
                                           setEditingGalleryImages(prev => [...prev, reader.result as string]);
                                         }
                                       };
                                       reader.readAsDataURL(file);
                                     });
                                   }
                                 }}
                               />
                               <Upload className="w-5 h-5 text-gray-400 group-hover:text-primary mb-1" />
                               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Upload Gallery Images</span>
                             </div>
                          </label>
                        </div>
                      </div>

                      {editingGalleryImages.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {editingGalleryImages.map((url, i) => (
                            <div key={i} className="relative group aspect-square rounded border overflow-hidden bg-gray-100">
                              <img src={url} alt="" className="w-full h-full object-cover" />
                              <button 
                                type="button"
                                onClick={() => setEditingGalleryImages(prev => prev.filter((_, idx) => idx !== i))}
                                className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-[9px] text-gray-400 italic">Click on the product to see these gallery images in detail view.</p>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t flex gap-4 z-20">
                    <button 
                      type="submit"
                      className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg hover:bg-primary-hover active:scale-95 transition-all uppercase text-sm tracking-widest"
                    >
                      {editingProduct ? "Update Product" : "Save Product"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : adminTab === "orders" ? (
                <div id="admin-panel-content" className="flex-1 overflow-y-auto p-8">
                  <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                          <div className="relative flex-1">
                             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                             <input 
                               type="text" 
                               placeholder="FILTER ORDERS BY DATE (YYYY-MM-DD) OR ID..." 
                               className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-6 py-4 text-xs font-bold outline-none focus:border-primary shadow-sm"
                               onChange={(e) => setSearchQuery(e.target.value)}
                             />
                          </div>
                          <input 
                            type="date"
                            onChange={(e) => setOrderDateFilter(e.target.value)}
                            className="bg-white border border-gray-200 rounded-2xl px-4 py-4 text-xs font-bold outline-none focus:border-primary shadow-sm font-mono"
                            title="Day Book - Filter by Date"
                          />
                        </div>
                    <button 
                      onClick={async () => {
                        setIsLoading(true);
                        try {
                          const { data, error } = await supabase.from('orders').select('*').order('timestamp', { ascending: false });
                          if (error) throw error;
                          if (data) {
                            setOrders(data);
                            await safeIdbSet("buy_a_to_z_orders", data);
                            alert("Orders refreshed from cloud.");
                          }
                        } catch (err: any) {
                          alert("Fetch failed: " + err.message);
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      className="text-[10px] bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-50 transition-all flex items-center gap-2"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                      Refresh Orders
                    </button>
                  </div>

                  {orders.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center">
                      <ShoppingCart className="w-12 h-12 text-gray-100 mb-4" />
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No orders yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders
                        .filter(o => {
                          const matchesQuery = !searchQuery || 
                            o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (o.customerInfo?.phone || "").includes(searchQuery) ||
                            (o.id.toLowerCase().includes(searchQuery.toLowerCase()));
                          
                          const matchesDate = !orderDateFilter || 
                            new Date(o.timestamp).toISOString().split('T')[0] === orderDateFilter;

                          return matchesQuery && matchesDate;
                        })
                        .map((order, idx) => (
                        <div key={order.id || `order-${idx}`} className="border rounded-xl p-4 hover:border-primary/30 transition-all bg-gray-50/30">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="text-xs font-black text-daraz-text">{order.id}</p>
                              <p className="text-[10px] text-gray-400">{new Date(order.timestamp).toLocaleString()}</p>
                            </div>
                            <div className="flex gap-2">
                              <div className="flex gap-2 items-center">
                                <select 
                                  value={order.status}
                                  onChange={(e) => {
                                    const newStatus = e.target.value as any;
                                    
                                    // Stock deduction logic: When status changes to 'delivered'
                                    if (newStatus === 'delivered' && order.status !== 'delivered') {
                                      const updatedProductList = [...products];
                                      order.items.forEach(item => {
                                        const pIdx = updatedProductList.findIndex(p => p.id === item.id);
                                        if (pIdx !== -1) {
                                          updatedProductList[pIdx] = {
                                            ...updatedProductList[pIdx],
                                            stock: Math.max(0, (updatedProductList[pIdx].stock || 0) - item.quantity)
                                          };
                                        }
                                      });
                                      setProducts(updatedProductList);
                                      safeIdbSet("buy_a_to_z_products", updatedProductList);
                                      
                                      // Supabase sync for stock
                                      order.items.forEach(item => {
                                        const p = updatedProductList.find(pr => pr.id === item.id);
                                        if (p) {
                                          supabase.from('products').update({ stock: p.stock }).eq('id', p.id).then(({ error }) => {
                                            if (error) console.error("Stock sync failed:", error);
                                          });
                                        }
                                      });
                                    }
                                    
                                    updateOrderInCloud(order.id, { status: newStatus });

                                    // Notify Customer
                                    sendEmailNotification(
                                      order.customerEmail,
                                      `Order Update: ${order.id} - ${newStatus.toUpperCase()}`,
                                      generateEmailTemplate(
                                        newStatus === 'cancelled' ? "Order Cancelled" : `Order is now ${newStatus.toUpperCase()}`,
                                        `
                                          <p>Hello ${order.customerName},</p>
                                          <p>${newStatus === 'cancelled' 
                                            ? "We regret to inform you that your order has been cancelled." 
                                            : `Good news! The status of your order <strong>${order.id}</strong> has been updated.`
                                          }</p>
                                          <div style="background: ${newStatus === 'cancelled' ? '#fef2f2' : '#f0fdf4'}; padding: 20px; border-radius: 12px; border: 1px solid ${newStatus === 'cancelled' ? '#fecaca' : '#dcfce7'}; margin: 24px 0; text-align: center;">
                                            <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: ${newStatus === 'cancelled' ? '#991b1b' : '#166534'}; font-weight: 700;">Current Status</p>
                                            <p style="margin: 4px 0 0; font-size: 24px; font-weight: 900; color: ${newStatus === 'cancelled' ? '#dc2626' : '#16a34a'};">${newStatus.toUpperCase()}</p>
                                          </div>
                                          <p style="font-size: 14px; line-height: 1.6; color: #555;">
                                            ${newStatus === 'shipped' ? "Your package has been handed over to our delivery partner. It will reach you soon!" : ""}
                                            ${newStatus === 'delivered' ? "Your order has been successfully delivered. We hope you love your purchase!" : ""}
                                            ${newStatus === 'cancelled' ? "If you didn't request this cancellation or have any questions, please contact our support team immediately." : ""}
                                            ${newStatus === 'processing' ? "We are currently preparing your items for shipment." : ""}
                                          </p>
                                           ${generateDeliveryAndPricingHtml(order)}
                                          <p style="margin-top: 24px;">Thank you for being with Buy A to z!</p>
                                        `,
                                        order.id
                                      )
                                    );

                                    // Notify Admin
                                    sendEmailNotification(
                                      import.meta.env.VITE_ADMIN_EMAIL || "udayonbiswas2003@gmail.com",
                                      `Order Status Changed: ${order.id} [${newStatus.toUpperCase()}]`,
                                      generateEmailTemplate(
                                        "Admin Order Notification",
                                        `
                                          <p>Order <strong>${order.id}</strong> status has been changed to <strong>${newStatus.toUpperCase()}</strong>.</p>
                                          <p><strong>Customer:</strong> ${order.customerName}</p>
                                          <p><strong>Contact:</strong> ${order.customerMobile}</p>
                                          ${generateDeliveryAndPricingHtml(order)}
                                        `,
                                        order.id
                                      )
                                    );
                                  }}
                                  className="bg-white border text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider outline-none focus:border-primary"
                                >
                                  <option value="processing">Processing</option>
                                  <option value="shipped">Shipped</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>

                                {order.status === 'shipped' && (
                                  <div className="flex gap-2 animate-in fade-in slide-in-from-left-2 transition-all">
                                    <input 
                                      type="text"
                                      placeholder="Carrier"
                                      defaultValue={order.trackingCarrier || ""}
                                      onBlur={(e) => updateOrderInCloud(order.id, { trackingCarrier: e.target.value })}
                                      className="w-24 bg-white border border-gray-200 rounded px-2 py-1 text-[9px] outline-none focus:border-primary font-bold"
                                    />
                                    <input 
                                      type="text"
                                      placeholder="Tracking #"
                                      defaultValue={order.trackingNumber || ""}
                                      onBlur={(e) => updateOrderInCloud(order.id, { trackingNumber: e.target.value })}
                                      className="w-32 bg-white border border-gray-200 rounded px-2 py-1 text-[9px] outline-none focus:border-primary font-mono"
                                    />
                                  </div>
                                )}

                                <button 
                                  onClick={() => handleDeleteOrder(order.id)}
                                  className="bg-red-50 text-red-500 p-1.5 rounded hover:bg-secondary hover:text-white transition-all ml-auto"
                                  title="Delete Order"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                          {/* Order Details Grid */}
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="text-[10px]">
                              <p className="font-bold text-gray-500 uppercase tracking-tighter mb-1">Customer</p>
                              <p className="text-daraz-text font-bold">{order.customerName}</p>
                              <p className="text-gray-500">{order.customerMobile}</p>
                            </div>
                            <div className="text-[10px]">
                              <p className="font-bold text-gray-500 uppercase tracking-tighter mb-1">Shipping</p>
                              <p className="text-daraz-text font-medium">{order.delivery.address}, {order.delivery.area}</p>
                              <p className="text-daraz-text">{order.delivery.city}</p>
                            </div>
                          </div>

                          <div className="border-t pt-3 space-y-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Items Summary</p>
                            <div className="space-y-2">
                              {order.items.map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-xs p-2 bg-white rounded border border-gray-100">
                                  <div className="flex items-center gap-2">
                                    <img src={item.image} className="w-8 h-8 rounded object-cover border" alt="" />
                                    <div>
                                      <p className="font-bold text-daraz-text truncate max-w-[150px]">{item.name}</p>
                                      {item.partNumber && <p className="text-[9px] font-bold text-indigo-600 uppercase">PN: {item.partNumber}</p>}
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <p className="text-[10px] text-gray-400">Qty: {item.quantity}</p>
                                        {item.selectedSize && (
                                          <span className="text-[9px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">Size: {item.selectedSize}</span>
                                        )}
                                        {item.selectedColor && (
                                          <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded uppercase border border-emerald-100">Color: {item.selectedColor}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[10px] font-black text-primary uppercase">Subtotal</p>
                                    <p className="font-bold text-[10px] text-daraz-text">
                                      ৳{(item.price * item.quantity).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="border-t pt-3 flex justify-between items-center">
            <div className="flex -space-x-2">
              {order.items.slice(0, 3).map((item, i) => (
                <img key={item.id ? `${order.id}-${item.id}-${i}` : i} src={item.image} className="w-6 h-6 rounded-full border-2 border-white object-cover shadow-sm" alt="" />
              ))}
                              {order.items.length > 3 && (
                                <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-gray-500">
                                  +{order.items.length - 3}
                                </div>
                              )}
                            </div>
                            <p className="text-sm font-black text-primary">৳{order.total.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : adminTab === "purchases" ? (
                <div id="admin-panel-content" className="flex-1 overflow-y-auto flex flex-col bg-gray-50/30">
                  {/* Purchases Sub-navigation */}
                  <div className="bg-white px-4 md:px-8 py-4 border-b flex items-center gap-4 md:gap-6 sticky top-0 z-10 shadow-sm overflow-x-auto no-scrollbar">
                    <button 
                      onClick={() => setAdminPurchaseView('list')}
                      className={`flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${adminPurchaseView === 'list' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <History className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      History
                    </button>
                    <button 
                      onClick={() => setAdminPurchaseView('add')}
                      className={`flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${adminPurchaseView === 'add' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <PlusCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      Stock-In
                    </button>
                    <button 
                      onClick={() => setAdminPurchaseView('suppliers')}
                      className={`flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${adminPurchaseView === 'suppliers' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      Suppliers
                    </button>
                  </div>

                  <div className="p-8">
                    {adminPurchaseView === 'list' ? (
                      <div className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <h4 className="text-sm font-black text-daraz-text uppercase tracking-widest">Inventory Stock-In Log</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Day Book - Filter by Purchase Date</p>
                          </div>
                          <div className="flex items-center gap-4 w-full md:w-auto">
                            <input 
                              type="date" 
                              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-primary shadow-sm"
                              onChange={(e) => setOrderDateFilter(e.target.value)}
                            />
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase whitespace-nowrap">Total: {purchases.length}</span>
                          </div>
                        </div>
                        
                        {purchases.length === 0 ? (
                          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                             <Package className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                             <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No purchase history found</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {purchases.map(purchase => (
                              <div key={purchase.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-primary/20 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[10px] font-black text-primary uppercase bg-primary/5 px-2 py-0.5 rounded">ID: {purchase.id}</span>
                                      <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(purchase.timestamp).toLocaleString()}</span>
                                    </div>
                                    <h5 className="font-black text-daraz-text uppercase tracking-tight flex items-center gap-2">
                                      <Users className="w-4 h-4 text-gray-400" />
                                      {purchase.supplierName}
                                    </h5>
                                  </div>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => {
                                        setEditingPurchase(purchase);
                                        setEditPurchaseItems(purchase.items);
                                      }}
                                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                      title="Edit Record"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeletePurchase(purchase.id)}
                                      className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                                      title="Delete Record"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                                <div className="space-y-2 border-t pt-4">
                                  {purchase.items.map((item, i) => (
                                    <div key={i} className="flex justify-between text-[11px] items-center">
                                      <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        <span className="font-bold text-gray-600 truncate max-w-[200px]">{item.productName}</span>
                                      </div>
                                      <div className="flex gap-4 font-mono">
                                        <span className="text-gray-400 underline decoration-gray-200 decoration-dotted">Qty: {item.quantity}</span>
                                        <span className="text-daraz-text font-bold">@ ৳{item.costPrice.toLocaleString()}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                {purchase.note && (
                                  <div className="mt-4 p-3 bg-gray-50 rounded-xl text-[10px] text-gray-500 italic border border-gray-100">
                                    Note: {purchase.note}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {editingPurchase && (
                          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
                            <motion.div 
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              className="bg-white w-full max-w-2xl rounded-[2.5rem] p-6 md:p-10 shadow-2xl overflow-y-auto max-h-[95vh] no-scrollbar"
                            >
                              <div className="flex justify-between items-center mb-6 border-b pb-4 sticky top-0 bg-white z-10">
                                <h5 className="text-[10px] font-black text-daraz-text uppercase tracking-widest flex items-center gap-2">
                                  <Edit2 className="w-4 h-4 text-emerald-500" />
                                  Edit Inventory Receipt : #{editingPurchase.id}
                                </h5>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-black text-gray-400 uppercase bg-gray-100 px-3 py-1 rounded-full">Date: {new Date(editingPurchase.timestamp).toLocaleDateString()}</span>
                                  <button onClick={() => { setEditingPurchase(null); setEditPurchaseItems([]); }} className="text-2xl text-gray-400 hover:text-black leading-none">&times;</button>
                                </div>
                              </div>
                              
                              <form onSubmit={(e) => {
                                e.preventDefault();
                                const fd = new FormData(e.currentTarget);
                                const supId = fd.get('supplierId') as string;
                                const supplier = suppliers.find(s => s.id === supId);
                                
                                if (editPurchaseItems.length === 0) {
                                  alert("Add at least one item to the purchase");
                                  return;
                                }

                                const sanitizedItems = editPurchaseItems.map(item => ({
                                  ...item,
                                  quantity: Number(item.quantity) || 0,
                                  costPrice: Number(item.costPrice) || 0
                                }));

                                const total = sanitizedItems.reduce((acc, i) => acc + (i.quantity * i.costPrice), 0);

                                handleUpdatePurchase({
                                  ...editingPurchase,
                                  supplierId: supId,
                                  supplierName: supplier?.name || editingPurchase.supplierName,
                                  items: sanitizedItems,
                                  totalAmount: total,
                                  status: fd.get('status') as any,
                                  timestamp: fd.get('invoiceDate') 
                                    ? new Date(fd.get('invoiceDate') as string).toISOString() 
                                    : editingPurchase.timestamp,
                                  note: fd.get('note') as string
                                });
                                setEditingPurchase(null);
                                setEditPurchaseItems([]);
                                alert("✅ Inventory modification finalized successfully!");
                              }} className="space-y-6 text-left">
                                {/* ERP Style Info Summary */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                       <label className="text-[9px] font-black text-gray-400 uppercase w-20 text-right">Invoice No :</label>
                                       <div className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold font-mono">
                                         {editingPurchase.id}
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                       <label className="text-[9px] font-black text-gray-400 uppercase w-20 text-right">Supplier :</label>
                                       <select 
                                         name="supplierId"
                                         defaultValue={editingPurchase.supplierId}
                                         className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none"
                                       >
                                         {suppliers.map(s => (
                                           <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
                                         ))}
                                       </select>
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                       <label className="text-[9px] font-black text-gray-400 uppercase w-20 text-right font-mono">Invoice Date :</label>
                                       <input 
                                         type="date"
                                         name="invoiceDate"
                                         defaultValue={new Date(editingPurchase.timestamp).toISOString().split('T')[0]}
                                         className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none font-mono"
                                       />
                                    </div>
                                    <div className="flex items-center gap-3">
                                       <label className="text-[9px] font-black text-gray-400 uppercase w-20 text-right font-mono">Net Total :</label>
                                       <div className="flex-1 text-xs font-black text-emerald-600 font-mono">
                                         ৳{editPurchaseItems.reduce((acc, i) => acc + (i.quantity * i.costPrice), 0).toLocaleString()}
                                       </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Item Details Table Style Adder */}
                                <div className="bg-gray-50/50 rounded-2xl border border-gray-200 overflow-hidden">
                                  <div className="bg-gray-100/80 border-b border-gray-200 px-4 py-2 grid grid-cols-12 gap-3 items-center">
                                     <div className="col-span-5 text-[8px] font-black text-gray-500 uppercase tracking-widest">Stock Item</div>
                                     <div className="col-span-2 text-[8px] font-black text-gray-500 uppercase tracking-widest text-center">Qty</div>
                                     <div className="col-span-2 text-[8px] font-black text-gray-500 uppercase tracking-widest text-center">Rate</div>
                                     <div className="col-span-3"></div>
                                  </div>

                                  <div className="p-3 bg-white grid grid-cols-12 gap-2 items-start border-b border-gray-100 shadow-inner">
                                    <div className="col-span-5 relative">
                                      <input 
                                        type="text" 
                                        placeholder="SEARCH STOCK..." 
                                        value={purchaseProductSearch}
                                        onChange={(e) => setPurchaseProductSearch(e.target.value)}
                                        className="w-full bg-emerald-50 border border-emerald-100 rounded-t-lg px-2 py-1.5 text-[10px] font-bold outline-none font-mono"
                                      />
                                      {purchaseProductSearch && (
                                        <div className="max-h-[150px] overflow-y-auto border-x border-b border-emerald-100 bg-white rounded-b-lg absolute z-[30] w-full shadow-2xl">
                                          {products.filter(p => 
                                            p.name.toLowerCase().includes(purchaseProductSearch.toLowerCase()) || 
                                            (p.partNumber || "").toLowerCase().includes(purchaseProductSearch.toLowerCase())
                                          ).slice(0, 10).map(p => (
                                            <button
                                              key={p.id}
                                              type="button"
                                              onClick={() => {
                                                (document.getElementById('edit-item-product') as HTMLSelectElement).value = p.id;
                                                setPurchaseProductSearch(p.name);
                                              }}
                                              className="w-full text-left px-3 py-2 hover:bg-emerald-50 border-b border-gray-50 last:border-0"
                                            >
                                              <p className="text-[9px] font-black text-daraz-text uppercase">{p.name}</p>
                                              {p.partNumber && <p className="text-[7px] font-bold text-emerald-600 font-mono">CODE: {p.partNumber}</p>}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <select id="edit-item-product" className="hidden">
                                      <option value="">-- Choose Stock --</option>
                                      {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                      ))}
                                    </select>
                                    <input id="edit-item-qty" type="number" placeholder="0" className="col-span-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-[10px] font-bold text-center outline-none" />
                                    <input id="edit-item-cost" type="number" placeholder="0.00" className="col-span-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-[10px] font-bold text-center outline-none" />
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        const pId = (document.getElementById('edit-item-product') as HTMLSelectElement).value;
                                        const qVal = (document.getElementById('edit-item-qty') as HTMLInputElement).value;
                                        const cVal = (document.getElementById('edit-item-cost') as HTMLInputElement).value;
                                        
                                        if (!pId || !qVal || !cVal) return;
                                        const product = products.find(p => p.id === pId);
                                        if (!product) return;

                                        setEditPurchaseItems(prev => [...prev, {
                                          productId: product.id,
                                          productName: product.name,
                                          quantity: parseInt(qVal),
                                          costPrice: parseFloat(cVal)
                                        }]);

                                        setPurchaseProductSearch("");
                                        (document.getElementById('edit-item-product') as HTMLSelectElement).value = "";
                                        (document.getElementById('edit-item-qty') as HTMLInputElement).value = "";
                                        (document.getElementById('edit-item-cost') as HTMLInputElement).value = "";
                                      }}
                                      className="col-span-3 bg-daraz-text text-white py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-black transition-all"
                                    >
                                      Add Line
                                    </button>
                                  </div>

                                  <div className="max-h-[250px] overflow-y-auto divide-y divide-gray-100 bg-white">
                                    {editPurchaseItems.length === 0 ? (
                                      <p className="text-[10px] text-gray-400 text-center py-6 font-bold uppercase italic tracking-widest">No detailed entries</p>
                                    ) : (
                                      editPurchaseItems.map((item, idx) => (
                                        <div key={idx} className="px-4 py-2.5 grid grid-cols-12 gap-3 items-center hover:bg-gray-50/50 transition-all">
                                          <div className="col-span-5 text-[10px] font-black text-daraz-text uppercase">{item.productName}</div>
                                          <div className="col-span-2 text-center border-r border-gray-50">
                                            <input 
                                              type="number"
                                              value={item.quantity}
                                              onChange={(e) => {
                                                const val = parseInt(e.target.value) || 0;
                                                setEditPurchaseItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: val } : it));
                                              }}
                                              className="w-full bg-transparent border-none text-[10px] font-black text-center font-mono outline-none"
                                            />
                                          </div>
                                          <div className="col-span-2 text-center">
                                            <input 
                                              type="text"
                                              inputMode="decimal"
                                              value={item.costPrice}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                // Only allow numbers and decimal point
                                                if (/^\d*\.?\d*$/.test(val)) {
                                                  setEditPurchaseItems(prev => prev.map((it, i) => i === idx ? { ...it, costPrice: val as any } : it));
                                                }
                                              }}
                                              className="w-full bg-emerald-50/50 border border-emerald-100 rounded px-1 text-[10px] font-black text-center font-mono outline-none text-emerald-600"
                                            />
                                          </div>
                                          <div className="col-span-2 text-right text-[10px] font-black font-mono text-daraz-text lowercase tracking-tighter">৳{(item.quantity * item.costPrice).toLocaleString()}</div>
                                          <div className="col-span-1 flex justify-end">
                                            <button 
                                              type="button" 
                                              onClick={() => setEditPurchaseItems(prev => prev.filter((_, i) => i !== idx))}
                                              className="text-red-400 hover:text-red-600 p-1"
                                            >
                                              <X className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block ml-2">Narration / Internal Remarks</label>
                                  <textarea 
                                    name="note"
                                    defaultValue={editingPurchase.note}
                                    placeholder="If necessary please insert a Comments/Remarks..."
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[11px] font-bold outline-none focus:bg-white min-h-[60px]"
                                  ></textarea>
                                </div>

                                <div className="flex gap-4 pt-2">
                                  <button type="button" onClick={() => { setEditingPurchase(null); setEditPurchaseItems([]); }} className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all border border-gray-200">Cancel</button>
                                  <button type="submit" className="flex-[2] bg-emerald-500 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-emerald-200 hover:bg-emerald-600 active:scale-95 transition-all">Update History</button>
                                </div>
                              </form>
                            </motion.div>
                          </div>
                        )}
                      </div>
                    ) : adminPurchaseView === 'suppliers' ? (
                      <div className="space-y-8">
                        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border mb-6 shadow-sm">
                          <h4 className="text-sm font-black text-daraz-text uppercase tracking-widest">Supplier Directory</h4>
                          <button 
                            id="add-supplier-btn"
                            className="bg-primary text-white text-[10px] font-black uppercase px-4 py-2 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                            onClick={() => setShowAddSupplierModal(true)}
                          >
                            + Add New Supplier
                          </button>
                        </div>

                        {showAddSupplierModal && (
                          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
                            <motion.div 
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl"
                            >
                              <h5 className="text-sm font-black text-daraz-text uppercase tracking-widest mb-6 border-b pb-4">Register Supplier</h5>
                              <form onSubmit={(e) => {
                                e.preventDefault();
                                const fd = new FormData(e.currentTarget);
                                handleAddSupplier({
                                  id: Date.now().toString(),
                                  name: fd.get('name') as string,
                                  contactPerson: fd.get('contact') as string,
                                  phone: fd.get('phone') as string,
                                  email: fd.get('email') as string,
                                  address: fd.get('address') as string
                                });
                                setShowAddSupplierModal(false);
                              }} className="space-y-4">
                                <input name="name" required placeholder="Supplier Name" className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold outline-none ring-1 ring-gray-100 focus:ring-primary/30" />
                                <input name="contact" required placeholder="Contact Person" className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold outline-none ring-1 ring-gray-100 focus:ring-primary/30" />
                                <input name="phone" required placeholder="Phone Number" className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold outline-none ring-1 ring-gray-100 focus:ring-primary/30" />
                                <input name="email" type="email" placeholder="Email Address (Optional)" className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold outline-none ring-1 ring-gray-100 focus:ring-primary/30" />
                                <textarea name="address" placeholder="Business Address (Optional)" className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-bold outline-none ring-1 ring-gray-100 focus:ring-primary/30 min-h-[80px]"></textarea>
                                <div className="flex gap-3 pt-2">
                                  <button type="button" onClick={() => setShowAddSupplierModal(false)} className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200">Cancel</button>
                                  <button type="submit" className="flex-2 bg-primary text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">Save Supplier</button>
                                </div>
                              </form>
                            </motion.div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {suppliers.map(sup => (
                            <div key={sup.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-start">
                              <div>
                                <h5 className="font-black text-daraz-text uppercase tracking-widest text-xs mb-1">{sup.name}</h5>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-gray-500 flex items-center gap-2">
                                    <UserIcon className="w-3 h-3" /> {sup.contactPerson}
                                  </p>
                                  <p className="text-[10px] font-bold text-gray-500 flex items-center gap-2">
                                    <Phone className="w-3 h-3" /> {sup.phone}
                                  </p>
                                  {sup.email && (
                                    <p className="text-[10px] font-bold text-gray-500 flex items-center gap-2">
                                      <Mail className="w-3 h-3" /> {sup.email}
                                    </p>
                                  )}
                                  {sup.address && (
                                    <p className="text-[10px] font-bold text-gray-500 flex items-center gap-2">
                                      <MapPin className="w-3 h-3" /> {sup.address}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <button 
                                onClick={() => handleDeleteSupplier(sup.id)}
                                className="text-red-400 hover:text-red-600 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-6xl mx-auto space-y-6 pb-20">
                        {/* ERP Style Header - Inventory Receipt Information Summary */}
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
                          <div className="bg-daraz-text text-white px-6 py-3 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Package className="w-5 h-5 text-emerald-400" />
                              <h4 className="text-xs font-black uppercase tracking-[0.2em]">Inventory Stock-In Management</h4>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Professional Mode</span>
                          </div>
                          
                          <form id="purchase-form" className="p-6 md:p-8" onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const supplierId = formData.get('supplierId') as string;
                            const supplier = suppliers.find(s => s.id === supplierId);
                            
                            if (!supplier) {
                              alert("Please select a supplier");
                              return;
                            }

                            if (purchaseFormItems.length === 0) {
                               alert("Add at least one product to purchase");
                               return;
                            }

                            const total = purchaseFormItems.reduce((acc, i) => acc + (i.quantity * i.costPrice), 0);

                            handleAddPurchase({
                              id: (formData.get('invoiceNo') as string) || ("PUR-" + Date.now().toString().slice(-6)),
                              supplierId: supplier.id,
                              supplierName: supplier.name,
                              timestamp: formData.get('invoiceDate') 
                                ? new Date(formData.get('invoiceDate') as string).toISOString() 
                                : new Date().toISOString(),
                              items: purchaseFormItems,
                              totalAmount: total,
                              status: 'completed',
                              note: formData.get('note') as string
                            });

                            alert("Inventory Receipt Processed Successfully!");
                            setPurchaseFormItems([]);
                            setAdminPurchaseView('list');
                          }}>
                            {/* Information Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 pb-8 border-b border-dashed border-gray-200">
                              <div className="space-y-4">
                                <div className="grid grid-cols-3 items-center gap-4">
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Invoice NO :</label>
                                  <input 
                                    name="invoiceNo" 
                                    placeholder="e.g. ARIN27/27100" 
                                    className="col-span-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-xs font-bold font-mono outline-none focus:ring-1 focus:ring-emerald-500/20" 
                                  />
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4">
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Invoice Date :</label>
                                  <input 
                                    type="date"
                                    name="invoiceDate"
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                    className="col-span-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-xs font-bold font-mono outline-none focus:ring-1 focus:ring-emerald-500/20" 
                                  />
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="grid grid-cols-3 items-center gap-4">
                                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Supplier :</label>
                                  <select 
                                    name="supplierId"
                                    required
                                    className="col-span-2 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2 text-xs font-bold outline-none appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:0.8rem] bg-[right_1rem_center] bg-no-repeat"
                                  >
                                    <option value="">-- Search Supplier --</option>
                                    {suppliers.map(s => (
                                      <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>

                            {/* Item Details Table Style Adder */}
                            <div className="bg-gray-50/50 rounded-2xl border border-gray-200 overflow-hidden mb-6">
                              <div className="bg-gray-100/80 border-b border-gray-200 px-4 py-2 grid grid-cols-12 gap-3">
                                <span className="col-span-5 text-[9px] font-black text-gray-500 uppercase tracking-widest">Stock Item Name</span>
                                <span className="col-span-2 text-[9px] font-black text-gray-500 uppercase tracking-widest">Receive Qty</span>
                                <span className="col-span-2 text-[9px] font-black text-gray-500 uppercase tracking-widest">Rate (৳)</span>
                                <span className="col-span-2 text-[9px] font-black text-gray-500 uppercase tracking-widest">Amount</span>
                                <span className="col-span-1"></span>
                              </div>

                              <div className="p-3 bg-white grid grid-cols-12 gap-3 items-start border-b border-gray-100 shadow-inner">
                                <div className="col-span-5 relative">
                                  <input 
                                    type="text" 
                                    placeholder="SEARCH BY NAME or CODE..." 
                                    value={purchaseProductSearch}
                                    onChange={(e) => setPurchaseProductSearch(e.target.value)}
                                    className="w-full bg-emerald-50/30 border border-emerald-100 rounded-t-lg px-3 py-2 text-[10px] font-bold outline-none focus:bg-white focus:border-emerald-500 transition-all font-mono"
                                  />
                                  <div className="max-h-[200px] overflow-y-auto border-x border-b border-emerald-100 bg-white rounded-b-lg absolute z-[20] w-full shadow-2xl">
                                    {purchaseProductSearch && products.filter(p => 
                                      p.name.toLowerCase().includes(purchaseProductSearch.toLowerCase()) || 
                                      (p.partNumber || "").toLowerCase().includes(purchaseProductSearch.toLowerCase())
                                    ).slice(0, 10).map(p => (
                                      <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => {
                                          (document.getElementById('new-item-product') as HTMLSelectElement).value = p.id;
                                          setPurchaseProductSearch(p.name);
                                        }}
                                        className="w-full text-left px-3 py-2 hover:bg-emerald-50 border-b border-gray-50 last:border-0"
                                      >
                                        <p className="text-[10px] font-black text-daraz-text uppercase">{p.name}</p>
                                        {p.partNumber && <p className="text-[8px] font-bold text-emerald-600 font-mono">CODE: {p.partNumber}</p>}
                                      </button>
                                    ))}
                                    {purchaseProductSearch && products.filter(p => 
                                      p.name.toLowerCase().includes(purchaseProductSearch.toLowerCase()) || 
                                      (p.partNumber || "").toLowerCase().includes(purchaseProductSearch.toLowerCase())
                                    ).length === 0 && (
                                      <p className="p-3 text-[9px] text-gray-400 font-bold italic">No matching products found</p>
                                    )}
                                  </div>
                                  <select id="new-item-product" className="hidden">
                                    <option value="">-- Choose Stock Item --</option>
                                    {products.map(p => (
                                      <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="col-span-2">
                                  <input id="new-item-qty" type="number" placeholder="0" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[11px] font-bold font-mono outline-none focus:bg-white" />
                                </div>
                                <div className="col-span-2">
                                  <input id="new-item-cost" type="number" placeholder="0.00" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[11px] font-bold font-mono outline-none focus:bg-white" />
                                </div>
                                <div className="col-span-2 text-[11px] font-black text-emerald-600 font-mono text-center">
                                  {/* Real time amount would go here if using state */}
                                  AUTOMATIC
                                </div>
                                <div className="col-span-1 flex justify-center">
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const pId = (document.getElementById('new-item-product') as HTMLSelectElement).value;
                                      const qtyStr = (document.getElementById('new-item-qty') as HTMLInputElement).value;
                                      const costStr = (document.getElementById('new-item-cost') as HTMLInputElement).value;

                                      if (!pId || !qtyStr || !costStr) return;
                                      const qty = parseInt(qtyStr);
                                      const cost = parseFloat(costStr);

                                      const product = products.find(p => p.id === pId);
                                      if (!product) return;

                                      setPurchaseFormItems(prev => [...prev, { productId: product.id, productName: product.name, quantity: qty, costPrice: cost }]);
                                      
                                      setPurchaseProductSearch("");
                                      (document.getElementById('new-item-product') as HTMLSelectElement).value = "";
                                      (document.getElementById('new-item-qty') as HTMLInputElement).value = "";
                                      (document.getElementById('new-item-cost') as HTMLInputElement).value = "";
                                    }}
                                    className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all transform active:scale-90"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="max-h-[300px] overflow-y-auto bg-gray-50/30">
                                {purchaseFormItems.length === 0 ? (
                                  <div className="py-20 flex flex-col items-center justify-center opacity-30">
                                    <Search className="w-8 h-8 mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No Items Registered</p>
                                  </div>
                                ) : (
                                  <div className="divide-y divide-gray-100">
                                    {purchaseFormItems.map((item, i) => (
                                      <div key={i} className="px-4 py-3 grid grid-cols-12 gap-3 items-center hover:bg-white transition-all">
                                        <div className="col-span-5 flex items-center gap-3">
                                          <div className="w-5 h-5 rounded bg-daraz-text text-white flex items-center justify-center text-[8px] font-black">{i + 1}</div>
                                          <span className="text-[10px] font-black text-daraz-text uppercase">{item.productName}</span>
                                        </div>
                                        <div className="col-span-2 text-[10px] font-black font-mono text-gray-500">{item.quantity} PCS</div>
                                        <div className="col-span-2 text-[10px] font-black font-mono text-gray-500">৳{item.costPrice.toLocaleString()}</div>
                                        <div className="col-span-2 text-[10px] font-black font-mono text-daraz-text">৳{(item.quantity * item.costPrice).toLocaleString()}</div>
                                        <div className="col-span-1 flex justify-center">
                                          <button 
                                            type="button"
                                            onClick={() => setPurchaseFormItems(prev => prev.filter((_, idx) => idx !== i))}
                                            className="text-red-400 hover:bg-red-50 p-1.5 rounded transition-all"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Summary & Operations Footer */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end border-t pt-8">
                              <div className="md:col-span-6">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2 font-mono">Narration / Remarks :</label>
                                <textarea 
                                  name="note"
                                  placeholder="If necessary please insert a Comments/Remarks related with Receive Inventory operation..."
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[11px] font-bold outline-none focus:ring-1 focus:ring-emerald-500/20 min-h-[80px]"
                                ></textarea>
                              </div>

                              <div className="md:col-span-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-gray-100/50 p-3 rounded-xl border border-gray-200 flex justify-between items-center">
                                    <span className="text-[9px] font-black text-gray-400 uppercase">Total Quantity :</span>
                                    <span className="text-sm font-black font-mono text-daraz-text">
                                      {purchaseFormItems.reduce((acc, i) => acc + i.quantity, 0)}
                                    </span>
                                  </div>
                                  <div className="bg-daraz-text p-3 rounded-xl shadow-xl flex justify-between items-center">
                                    <span className="text-[9px] font-black text-white/60 uppercase">Net Total :</span>
                                    <span className="text-sm font-black font-mono text-white">
                                      ৳{purchaseFormItems.reduce((acc, i) => acc + (i.quantity * i.costPrice), 0).toLocaleString()}
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      triggerConfirm(
                                        "ফরম মুছে ফেলুন",
                                        "Clear all entry data? This will empty your current draft items.",
                                        () => {
                                          setPurchaseFormItems([]);
                                          setPurchaseProductSearch("");
                                          const form = document.getElementById('purchase-form') as HTMLFormElement;
                                          if (form) form.reset();
                                        },
                                        'warning',
                                        'Clear',
                                        'Cancel'
                                      );
                                    }}
                                    className="bg-gray-100 text-gray-500 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-gray-200 transition-all border border-gray-200"
                                  >
                                    Clear Form
                                  </button>
                                  <button 
                                    type="submit" 
                                    className="bg-emerald-500 text-white py-3 rounded-xl font-black uppercase text-[9px] tracking-[0.25em] shadow-xl shadow-emerald-200 transition-all hover:bg-emerald-600 active:scale-95"
                                  >
                                    Save Record
                                  </button>
                                </div>
                              </div>
                            </div>
                          </form>
                        </div>

                        {/* Recent History Rack - Mini Table */}
                        <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-6 overflow-hidden">
                          <h6 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            Recent Rack of Inventory Receipts
                          </h6>
                          <div className="overflow-x-auto">
                             <table className="w-full text-left">
                               <thead className="bg-gray-50 rounded-lg">
                                 <tr>
                                   <th className="px-4 py-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">Receive No</th>
                                   <th className="px-4 py-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">Receive Date</th>
                                   <th className="px-4 py-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">Supplier Name</th>
                                   <th className="px-4 py-2 text-[8px] font-black text-gray-400 uppercase tracking-widest text-right">Net Total</th>
                                   <th className="px-4 py-2 text-right"></th>
                                 </tr>
                               </thead>
                               <tbody className="divide-y divide-gray-50">
                                 {purchases.slice(0, 10).map(p => (
                                   <tr key={p.id} className="hover:bg-gray-50/50 transition-all group">
                                     <td className="px-4 py-2.5 text-[10px] font-black text-daraz-text">{p.id}</td>
                                     <td className="px-4 py-2.5 text-[10px] font-bold text-gray-400">{new Date(p.timestamp).toLocaleDateString()}</td>
                                     <td className="px-4 py-2.5 text-[10px] font-black text-daraz-text uppercase">{p.supplierName}</td>
                                     <td className="px-4 py-2.5 text-[10px] font-black text-emerald-600 font-mono text-right">৳{p.totalAmount.toLocaleString()}</td>
                                     <td className="px-4 py-2.5 text-right transition-all">
                                        <div className="flex items-center justify-end gap-2">
                                          <button 
                                            onClick={() => {
                                              setEditingPurchase(p);
                                              setEditPurchaseItems(p.items);
                                            }}
                                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg flex items-center gap-1 transition-colors"
                                            title="Edit Receipt"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                            <span className="text-[8px] font-black uppercase">Edit</span>
                                          </button>
                                          <button 
                                            onClick={() => handleDeletePurchase(p.id)}
                                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg flex items-center gap-1 transition-colors"
                                            title="Delete Receipt"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span className="text-[8px] font-black uppercase">Delete</span>
                                          </button>
                                        </div>
                                     </td>
                                   </tr>
                                 ))}
                               </tbody>
                             </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : adminTab === "homepage" ? (
                <div id="admin-panel-content" className="p-8 space-y-8 overflow-y-auto">
                   <div>
                    <h4 className="text-sm font-black text-daraz-text uppercase tracking-widest mb-4">Homepage Banners</h4>
                    <div className="space-y-6">
                      {banners.map((banner, index) => (
                        <div key={banner.id} className="p-6 border rounded-2xl bg-gray-50/50 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 md:col-span-1">
                              <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Banner Title</label>
                              <input 
                                value={banner.title}
                                onChange={(e) => {
                                  const updated = banners.map((b, i) => i === index ? { ...b, title: e.target.value } : b);
                                  setBanners(updated);
                                  safeIdbSet("buy_a_to_z_banners", updated);
                                  syncBannersToCloud(updated);
                                }}
                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                              />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                              <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Banner Subtitle</label>
                              <input 
                                value={banner.subtitle}
                                onChange={(e) => {
                                  const updated = banners.map((b, i) => i === index ? { ...b, subtitle: e.target.value } : b);
                                  setBanners(updated);
                                  safeIdbSet("buy_a_to_z_banners", updated);
                                  syncBannersToCloud(updated);
                                }}
                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Button Text</label>
                              <input 
                                value={banner.buttonText}
                                onChange={(e) => {
                                  const updated = banners.map((b, i) => i === index ? { ...b, buttonText: e.target.value } : b);
                                  setBanners(updated);
                                  safeIdbSet("buy_a_to_z_banners", updated);
                                  syncBannersToCloud(updated);
                                }}
                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                              />
                            </div>
                            <div>
                               <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Shop Now Category Link</label>
                               <select 
                                 value={banner.categoryLink || ""}
                                 onChange={(e) => {
                                   const updated = banners.map((b, i) => i === index ? { ...b, categoryLink: e.target.value } : b);
                                   setBanners(updated);
                                   safeIdbSet("buy_a_to_z_banners", updated);
                                   syncBannersToCloud(updated);
                                 }}
                                 className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-primary bg-white"
                               >
                                 <option value="">Default (All Categories)</option>
                                 {categories.map(cat => (
                                   <option key={cat.id} value={cat.name}>{cat.name}</option>
                                 ))}
                               </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Banner Image</label>
                              <div className="flex gap-3 items-center">
                                {banner.imageUrl && (
                                  <div className="w-10 h-10 rounded border overflow-hidden shrink-0">
                                    <img src={banner.imageUrl} alt="" className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <input 
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const base64 = await toBase64(file);
                                      const updated = banners.map((b, i) => i === index ? { ...b, imageUrl: base64 } : b);
                                      setBanners(updated);
                                      safeIdbSet("buy_a_to_z_banners", updated);
                                      syncBannersToCloud(updated);
                                    }
                                  }}
                                  className="w-full border border-gray-200 rounded px-3 py-1.5 text-[10px] outline-none focus:border-primary"
                                />
                              </div>
                            </div>
                            <div>
                               <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Background Color</label>
                               <div className="flex gap-2">
                                  <input 
                                    type="color"
                                    value={banner.backgroundColor || "#f85606"}
                                    onChange={(e) => {
                                      const updated = banners.map((b, i) => i === index ? { ...b, backgroundColor: e.target.value } : b);
                                      setBanners(updated);
                                      safeIdbSet("buy_a_to_z_banners", updated);
                                      syncBannersToCloud(updated);
                                    }}
                                    className="w-10 h-10 border rounded cursor-pointer"
                                  />
                                  <input 
                                    value={banner.backgroundColor || ""}
                                    placeholder="#f85606"
                                    onChange={(e) => {
                                      const updated = banners.map((b, i) => i === index ? { ...b, backgroundColor: e.target.value } : b);
                                      setBanners(updated);
                                      safeIdbSet("buy_a_to_z_banners", updated);
                                      syncBannersToCloud(updated);
                                    }}
                                    className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-primary font-mono"
                                  />
                               </div>
                            </div>
                            <div>
                               <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Text Color</label>
                               <div className="flex gap-2">
                                  <input 
                                    type="color"
                                    value={banner.textColor || "#ffffff"}
                                    onChange={(e) => {
                                      const updated = banners.map((b, i) => i === index ? { ...b, textColor: e.target.value } : b);
                                      setBanners(updated);
                                      safeIdbSet("buy_a_to_z_banners", updated);
                                      syncBannersToCloud(updated);
                                    }}
                                    className="w-10 h-10 border rounded cursor-pointer"
                                  />
                                  <input 
                                    value={banner.textColor || ""}
                                    placeholder="#ffffff"
                                    onChange={(e) => {
                                      const updated = banners.map((b, i) => i === index ? { ...b, textColor: e.target.value } : b);
                                      setBanners(updated);
                                      safeIdbSet("buy_a_to_z_banners", updated);
                                      syncBannersToCloud(updated);
                                    }}
                                    className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-primary font-mono"
                                  />
                               </div>
                            </div>
                          </div>
                          
                          {banners.length > 1 && (
                            <button 
                              onClick={async () => {
                                const bannerToRemove = banners[index];
                                const updated = banners.filter((_, i) => i !== index);
                                setBanners(updated);
                                await safeIdbSet("buy_a_to_z_banners", updated);
                                if (bannerToRemove.id) {
                                  await supabase.from('banners').delete().eq('id', bannerToRemove.id);
                                }
                              }}
                              className="text-xs text-red-500 font-bold hover:underline"
                            >
                              Remove Banner
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => {
                        const newBanner = {
                          id: Date.now().toString(),
                          title: "New Banner",
                          subtitle: "Description goes here",
                          buttonText: "Shop Now"
                        };
                        const updated = [...banners, newBanner];
                        setBanners(updated);
                        safeIdbSet("buy_a_to_z_banners", updated);
                        syncBannersToCloud(updated);
                      }}
                      className="mt-4 bg-primary/10 text-primary px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary/20 transition-all flex items-center gap-2"
                    >
                      <Plus className="w-3 h-3" /> Add Another Banner (Current will rotate or use first)
                    </button>
                  </div>

                  <div className="mt-8 border-t pt-8">
                    <h4 className="text-sm font-black text-daraz-text uppercase tracking-widest mb-4">Sidebar Offer Banners (Slideshow)</h4>
                    <div className="space-y-4">
                      {sidebarBanners.map((banner, index) => (
                        <div key={index} className="p-4 border rounded-xl bg-gray-50/50 flex items-center gap-4">
                          <div className="w-16 h-24 bg-gray-100 rounded-lg overflow-hidden border shrink-0">
                            <img src={banner} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Banner #{index + 1}</p>
                            <button 
                              onClick={() => {
                                const updated = sidebarBanners.filter((_, i) => i !== index);
                                setSidebarBanners(updated);
                                safeIdbSet("buy_a_to_z_sidebar_banners", updated);
                                syncSidebarBannersToCloud(updated);
                                if (currentSidebarIndex >= updated.length) setCurrentSidebarIndex(0);
                              }}
                              className="text-xs text-red-500 font-bold hover:underline mt-2"
                            >
                              Delete This Design
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 p-6 border rounded-2xl bg-white border-dashed border-primary/30 text-center">
                      <p className="text-xs text-gray-500 mb-4 italic">Upload vertical designs (e.g., 2:3 aspect ratio) for best appearance in the sidebar.</p>
                      <label className="bg-primary text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:scale-105 transition-all cursor-pointer inline-flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add New Sidebar Design
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const base64 = await toBase64(file);
                              const updated = [...sidebarBanners, base64];
                              setSidebarBanners(updated);
                              safeIdbSet("buy_a_to_z_sidebar_banners", updated);
                              syncSidebarBannersToCloud(updated);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ) : adminTab === "footer" ? (
                <div className="p-8 space-y-8 overflow-y-auto">
                  <div>
                    <h4 className="text-sm font-black text-daraz-text uppercase tracking-widest mb-4">Footer & Branding Settings</h4>
                    <div className="p-6 border rounded-2xl bg-gray-50/50 space-y-6">
                      {/* Logo Management */}
                      <div className="p-5 bg-white border border-dashed border-gray-200 rounded-2xl">
                        <label className="text-[11px] font-black text-daraz-text uppercase tracking-widest mb-4 block">Brand Logo</label>
                        <div className="flex flex-col md:flex-row items-center gap-6">
                          <div className="w-32 h-32 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0 group relative">
                            {footerConfig.logoUrl ? (
                              <>
                                <img src={footerConfig.logoUrl} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                                <button 
                                  onClick={() => {
                                    const updated = { ...footerConfig, logoUrl: "" };
                                    saveFooterConfig(updated);
                                  }}
                                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                >
                                  <Trash2 className="w-6 h-6" />
                                </button>
                              </>
                            ) : (
                              <div className="text-gray-300 flex flex-col items-center">
                                <Upload className="w-8 h-8 mb-1" />
                                <span className="text-[10px] font-bold">No Logo</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 space-y-3">
                            <p className="text-xs text-gray-500 leading-relaxed font-medium">
                              Upload a professional logo for your store. Recommended size: <span className="text-primary font-black">500x150px</span> (PNG with transparency preferred).
                            </p>
                            <div className="flex gap-3">
                              <label className="flex-1">
                                <span className="sr-only">Choose File</span>
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer transition-all"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setIsLoading(true);
                                      try {
                                        const base64 = await toBase64(file, 600, 200, 0.8);
                                        const updated = { ...footerConfig, logoUrl: base64 };
                                        await saveFooterConfig(updated);
                                        alert("Logo updated successfully!");
                                      } catch (err) {
                                        alert("Failed to upload logo.");
                                      } finally {
                                        setIsLoading(false);
                                      }
                                    }
                                  }}
                                />
                              </label>
                              <div className="h-px w-6 bg-gray-200 mt-5 hidden md:block"></div>
                              <div className="flex flex-col flex-1">
                                <label className="text-[9px] font-black text-gray-400 uppercase mb-1">Direct URL (Optional)</label>
                                <input 
                                  value={footerConfig.logoUrl || ""}
                                  placeholder="https://..."
                                  onChange={(e) => {
                                    const updated = { ...footerConfig, logoUrl: e.target.value };
                                    saveFooterConfig(updated);
                                  }}
                                  className="w-full border border-gray-200 rounded px-3 py-1.5 text-[11px] outline-none focus:border-primary"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Company Name</label>
                            <button 
                              onClick={() => {
                                const updated = { ...footerConfig, showName: footerConfig.showName === false ? true : false };
                                saveFooterConfig(updated);
                              }}
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded transition-all ${footerConfig.showName !== false ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                            >
                              {footerConfig.showName !== false ? "Name Enabled" : "Name Hidden"}
                            </button>
                          </div>
                          <input 
                            value={footerConfig.companyName}
                                  onChange={(e) => {
                                    const updated = { ...footerConfig, companyName: e.target.value };
                                    saveFooterConfig(updated);
                                  }}
                            className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Copyright Text</label>
                          <input 
                            value={footerConfig.copyrightText}
                            onChange={(e) => {
                              const updated = { ...footerConfig, copyrightText: e.target.value };
                              saveFooterConfig(updated);
                            }}
                            className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Customer Care Text</label>
                          <input 
                            value={footerConfig.customerCareText}
                            onChange={(e) => {
                              const updated = { ...footerConfig, customerCareText: e.target.value };
                              saveFooterConfig(updated);
                            }}
                            className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Customer Care Phone</label>
                          <input 
                            value={footerConfig.customerCarePhone}
                            placeholder="01xxxxxxxxx"
                            onChange={(e) => {
                              const updated = { ...footerConfig, customerCarePhone: e.target.value };
                              saveFooterConfig(updated);
                            }}
                            className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Sell on Text</label>
                          <input 
                            value={footerConfig.sellOnText}
                            onChange={(e) => {
                              const updated = { ...footerConfig, sellOnText: e.target.value };
                              saveFooterConfig(updated);
                            }}
                            className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">App Download Text</label>
                          <input 
                            value={footerConfig.appDownloadText}
                            onChange={(e) => {
                              const updated = { ...footerConfig, appDownloadText: e.target.value };
                              saveFooterConfig(updated);
                            }}
                            className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">App Download Link</label>
                          <input 
                            value={footerConfig.appDownloadLink}
                            placeholder="https://play.google.com/..."
                            onChange={(e) => {
                              const updated = { ...footerConfig, appDownloadLink: e.target.value };
                              saveFooterConfig(updated);
                            }}
                            className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-4">
                          <input 
                            type="checkbox"
                            id="showSecuredBy"
                            checked={footerConfig.showSecuredBy}
                            onChange={(e) => {
                              const updated = { ...footerConfig, showSecuredBy: e.target.checked };
                              saveFooterConfig(updated);
                            }}
                            className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                          />
                          <label htmlFor="showSecuredBy" className="text-xs font-bold text-gray-600 uppercase tracking-tighter">Show "Secured by Google Cloud"</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : adminTab === "promo" ? (
                <div className="p-8 space-y-8 overflow-y-auto">
                  <div>
                    <h4 className="text-sm font-black text-daraz-text uppercase tracking-widest mb-4">Promotion Settings</h4>
                    <div className="p-6 border rounded-2xl bg-gray-50/50 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Promo Title</label>
                          <input 
                            value={promotionConfig.title}
                            onChange={(e) => {
                              const updated = { ...promotionConfig, title: e.target.value };
                              savePromotionConfig(updated);
                            }}
                            className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Promo Description</label>
                          <input 
                            value={promotionConfig.description}
                            onChange={(e) => {
                              const updated = { ...promotionConfig, description: e.target.value };
                              savePromotionConfig(updated);
                            }}
                            className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Discount Amount (৳)</label>
                          <input 
                            type="number"
                            value={promotionConfig.discountAmount}
                            onChange={(e) => {
                              const updated = { ...promotionConfig, discountAmount: parseInt(e.target.value) || 0 };
                              savePromotionConfig(updated);
                            }}
                            className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-4">
                          <input 
                            type="checkbox"
                            id="promoActive"
                            checked={promotionConfig.isActive}
                            onChange={(e) => {
                              const updated = { ...promotionConfig, isActive: e.target.checked };
                              savePromotionConfig(updated);
                            }}
                            className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                          />
                          <label htmlFor="promoActive" className="text-xs font-bold text-gray-600 uppercase tracking-tighter">Promotion Active</label>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-xl text-xs text-blue-600 flex gap-3">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <div>
                          <p className="font-bold mb-1 uppercase">How it works</p>
                          <p>The system automatically checks if the logged-in user has 0 previous orders. If they do and the promotion is active, they receive the specified discount amount on their total bill at checkout.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : adminTab === "categories" ? (
                <div className="p-8 space-y-8 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-daraz-text uppercase tracking-widest">Manage Categories</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-6 border rounded-2xl bg-gray-50/50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Add New Category</p>
                        <form 
                          onSubmit={(e: FormEvent<HTMLFormElement>) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const name = formData.get("name") as string;
                            const icon = formData.get("icon") as string;
                            if (!name || !icon) return;
                            
                            const newCat: Category = {
                              id: Math.random().toString(36).substr(2, 9),
                              name,
                              icon
                            };
                            const updated = [...categories, newCat];
                            setCategories(updated);
                            safeIdbSet("buy_a_to_z_categories", updated);
                            supabase.from('categories').insert([newCat]).then(({ error }) => {
                              if (error) console.error("Cat sync error:", error);
                            });
                            e.currentTarget.reset();
                          }}
                          className="space-y-4"
                        >
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Category Name</label>
                            <input name="name" placeholder="e.g. Health" className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-primary" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase">Icon (Emoji)</label>
                            <input name="icon" placeholder="e.g. 🥦" className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-primary" />
                          </div>
                          <button type="submit" className="w-full bg-primary text-white py-2 rounded font-bold text-xs hover:scale-[1.02] transition-all">Add Category</button>
                        </form>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {categories.map((cat) => (
                        <div key={cat.id} className="p-4 border rounded-xl bg-white flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <span className="text-2xl">{cat.icon}</span>
                            <div>
                              <p className="text-sm font-black text-daraz-text">{cat.name}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID: {cat.id}</p>
                            </div>
                          </div>
                           <button 
                            onClick={() => {
                              triggerConfirm(
                                "ক্যাটেগরি ডিলিট করুন",
                                `Delete '${cat.name}'? Products using this category will still exist but won't be filterable.`,
                                async () => {
                                  try {
                                    // Update local state first for instant UI response
                                    const updated = categories.filter(c => c.id !== cat.id);
                                    setCategories(updated);
                                    await safeIdbSet("buy_a_to_z_categories", updated);
                                    
                                    // Then sync with Supabase
                                    const { error } = await supabase.from('categories').delete().eq('id', cat.id);
                                    if (error) throw error;
                                    
                                    alert("✅ Category deleted successfully!");
                                  } catch (err: any) {
                                    console.error("Delete cat error:", err);
                                    alert("❌ Delete failed: " + (err.message || "Cloud connection error"));
                                  }
                                },
                                'danger',
                                'Delete',
                                'Cancel'
                              );
                            }}
                            className="bg-red-50 text-red-500 p-2.5 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : adminTab === "users" ? (
                <div id="admin-panel-content" className="flex-1 overflow-y-auto p-8">
                  <div className="mb-6 flex justify-between items-center">
                    <h3 className="text-xl font-black text-daraz-text">User Management</h3>
                    <button 
                      onClick={async () => {
                        setIsLoading(true);
                        try {
                          const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
                          if (error) throw error;
                          if (data) {
                            setUsers(data);
                            await safeIdbSet("buy_a_to_z_users", data);
                            alert(`Fetched ${data.length} users from Cloud.`);
                          }
                        } catch (err: any) {
                          alert("Cloud fetch failed: " + err.message);
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-50 transition-all flex items-center gap-2"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                      Refresh List
                    </button>
                  </div>
                  <div className="space-y-4">
                    {users.map((user, idx) => (
                      <div key={user.uid || user.id || `user-list-${idx}`} className="border rounded-xl p-4 flex items-center justify-between bg-gray-50/30">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold overflow-hidden border ${user.isAdmin ? 'bg-primary border-primary/20' : 'bg-gray-400 border-gray-200'}`}>
                            {user.avatar ? (
                              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              (user.fullName || 'U').charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-daraz-text">{user.fullName} {(user.uid === currentUser?.uid || user.id === currentUser?.uid || user.uid === currentUser?.id) && "(You)"}</p>
                            <p className="text-[10px] text-gray-500">{user.email || user.mobileNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${user.isAdmin ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                              {user.isAdmin ? 'Admin' : 'Customer'}
                            </p>
                          </div>
                              {!(user.uid === currentUser?.uid || user.id === currentUser?.uid || user.uid === currentUser?.id) && (
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => { 
                                      setEditingSystemUser(user); 
                                      setIsUserEditModalOpen(true);
                                      setTimeout(() => {
                                        document.getElementById('admin-panel-content')?.scrollTo({ top: 0, behavior: 'smooth' });
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                      }, 100);
                                    }}
                                    className="bg-white border border-gray-200 text-daraz-text p-2 rounded-lg hover:border-primary transition-all active:scale-95"
                                    title="Edit User Profile"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => toggleUserAdmin(user.uid || user.id, user.isAdmin)}
                                    className="bg-white border border-gray-200 text-daraz-text p-2 rounded-lg hover:border-primary transition-all active:scale-95"
                                    title={user.isAdmin ? "Demote to User" : "Promote to Admin"}
                                  >
                                    <ShieldCheck className={`w-5 h-5 ${user.isAdmin ? 'text-primary' : 'text-gray-300'}`} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUser(user)}
                                    className="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-secondary hover:text-white transition-all active:scale-95"
                                    title="Delete User Profile"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isUserEditModalOpen && editingSystemUser && (
          <div className="fixed inset-0 z-[170] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUserEditModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">Edit User Profile</h3>
                <button onClick={() => setIsUserEditModalOpen(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-20 h-20 rounded-full border-2 border-primary/20 bg-gray-50 flex items-center justify-center overflow-hidden mb-3">
                    {editingSystemUser.avatar ? (
                      <img src={editingSystemUser.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                  <label className="text-xs font-bold text-primary cursor-pointer hover:underline">
                    Change User Avatar
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const base64 = await toBase64(file, 200, 200, 0.6);
                          setEditingSystemUser({ ...editingSystemUser, avatar: base64 });
                        }
                      }}
                    />
                  </label>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Full Name</label>
                  <input 
                    type="text" 
                    value={editingSystemUser.fullName}
                    onChange={(e) => setEditingSystemUser({ ...editingSystemUser, fullName: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Mobile Number</label>
                  <input 
                    type="text" 
                    value={editingSystemUser.mobileNumber}
                    onChange={(e) => setEditingSystemUser({ ...editingSystemUser, mobileNumber: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                  />
                </div>
                <button 
                  onClick={() => handleUpdateSystemUser(editingSystemUser)}
                  disabled={isLoading}
                  className="w-full bg-primary text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary-hover transition-all"
                >
                  {isLoading ? "Saving..." : "Update User Details"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Footer --- */}
      <footer className="h-auto md:h-12 bg-white text-gray-500 text-[10px] sm:text-xs flex flex-col md:flex-row items-center justify-between px-8 py-4 md:py-0 border-t z-20 mb-36 md:mb-0">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          {footerConfig.logoUrl && (
            <img src={footerConfig.logoUrl} alt="" className="h-5 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" />
          )}
          <div>
            {(footerConfig.showName !== false || !footerConfig.logoUrl) && (
              <span className="font-bold text-daraz-text mr-1">{footerConfig.companyName}</span>
            )}
            &copy; {footerConfig.copyrightText}
          </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-8">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            <a 
              href={`tel:${footerConfig.customerCarePhone}`}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              {footerConfig.customerCareText}
            </a>
            <button className="hover:text-primary transition-colors">{footerConfig.sellOnText}</button>
            <a 
              href={footerConfig.appDownloadLink}
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary transition-colors font-bold bg-primary/5 px-2 py-1 rounded"
            >
              {footerConfig.appDownloadText}
            </a>
          </div>
          {footerConfig.showSecuredBy && (
            <div className="opacity-60 uppercase tracking-tighter whitespace-nowrap hidden sm:block">Secured by Google Cloud</div>
          )}
        </div>
      </footer>

      {/* --- Cart Sidebar --- */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 inset-y-0 w-full max-w-[340px] bg-white z-[101] shadow-2xl flex flex-col border-l"
            >
              <div className="p-6 flex items-center justify-between border-b shrink-0">
                <h3 className="font-bold text-lg text-daraz-text">Your Cart</h3>
                <button onClick={() => setIsCartOpen(false)} className="text-2xl hover:text-primary transition-colors">
                  <X />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {cart.length > 0 ? (
                  cart.map(item => (
                    <div key={item.id + (item.selectedSize || '') + (item.selectedColor || '')} className="flex gap-3 items-center group">
                      <div className="w-16 h-16 bg-gray-50 rounded shrink-0 flex items-center justify-center overflow-hidden border">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate text-daraz-text group-hover:text-primary transition-colors">{item.name}</p>
                        <div className="flex flex-wrap gap-2 items-center mt-1">
                          {item.selectedSize && (
                            <span className="text-[9px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">Size: {item.selectedSize}</span>
                          )}
                          {item.selectedColor && (
                            <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded uppercase border border-emerald-100">Color: {item.selectedColor}</span>
                          )}
                          {item.partNumber && <span className="text-[9px] font-bold text-indigo-600 uppercase">PN: {item.partNumber}</span>}
                        </div>
                        <p className="text-[11px] text-primary font-bold mt-1">৳{item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center border rounded-md overflow-hidden bg-gray-50">
                        <button onClick={() => updateQuantity(item.id, -1, item.selectedSize, item.selectedColor)} className="px-2 py-1 hover:bg-gray-100 transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold px-2 w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1, item.selectedSize, item.selectedColor)} className="px-2 py-1 hover:bg-gray-100 transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)}
                        className="text-gray-300 hover:text-red-500 transition-colors ml-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <ShoppingCart className="w-16 h-16 text-gray-100 mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Cart is Empty</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="mt-6 text-primary font-bold text-sm hover:underline"
                    >
                      Browse Products
                    </button>
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t bg-gray-50">
                  <div className="flex justify-between mb-4 font-bold text-daraz-text">
                    <span>Subtotal</span>
                    <span className="text-primary text-xl">৳{cartTotal.toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={handleCheckoutInitiate}
                    className="w-full bg-secondary text-white py-4 rounded-lg font-bold shadow-lg shadow-red-100 hover:bg-secondary-hover transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    Checkout Now
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- Checkout Modal --- */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b flex items-center justify-between bg-white sticky top-0 z-10">
                <h3 className="text-xl font-bold text-daraz-text flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  Checkout Details
                </h3>
                <button 
                  onClick={() => setIsCheckoutModalOpen(false)} 
                  className="text-gray-400 hover:text-daraz-text text-2xl transition-colors"
                >
                  &times;
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  <>
                    {/* Order Details Summary */}
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-inner">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <ShoppingBag className="w-3.5 h-3.5 text-primary" /> Order Summary ({cart.reduce((s,i) => s+i.quantity, 0)} Items)
                      </h4>
                      <div className="max-h-[160px] overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                        {cart.map(item => (
                          <div key={item.id + (item.selectedSize || '') + (item.selectedColor || '')} className="flex gap-3 items-center">
                            <div className="w-10 h-10 bg-white rounded-lg p-1 border shadow-sm shrink-0 flex items-center justify-center">
                              <img src={item.image} className="w-full h-full object-contain" alt="" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-daraz-text truncate">{item.name}</p>
                              <div className="flex gap-2 items-center mt-0.5">
                                <span className="text-[9px] text-gray-500 font-bold">{item.quantity} × ৳{item.price.toLocaleString()}</span>
                                {item.selectedSize && <span className="text-[9px] bg-primary/5 text-primary px-1 rounded-sm border border-primary/10">S: {item.selectedSize}</span>}
                                {item.selectedColor && <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1 rounded-sm border border-emerald-100">C: {item.selectedColor}</span>}
                              </div>
                            </div>
                            <p className="text-[11px] font-bold text-primary">৳{(item.price * item.quantity).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping Info */}
                    <section>
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> 1. Shipping Address
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Street Address</label>
                          <input 
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full border border-gray-200 rounded px-3 py-2.5 outline-none focus:border-primary text-sm bg-gray-50/50 transition-all font-medium" 
                            placeholder="House #12, Road #420, Sector #7" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">City</label>
                          <select 
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full border border-gray-200 rounded px-3 py-2.5 outline-none focus:border-primary text-sm bg-gray-50/50 transition-all appearance-none font-medium"
                          >
                            <option>Dhaka</option>
                            <option>Chattogram</option>
                            <option>Rajshahi</option>
                            <option>Sylhet</option>
                            <option>Khulna</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Area</label>
                          <input 
                            value={area}
                            onChange={(e) => setArea(e.target.value)}
                            className="w-full border border-gray-200 rounded px-3 py-2.5 outline-none focus:border-primary text-sm bg-gray-50/50 transition-all font-medium" 
                            placeholder="Uttara / Banani" 
                          />
                        </div>
                      </div>
                    </section>
                    {/* ... Rest of the checkout form ... */}
                    {/* Delivery Type */}
                    <section>
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <ArrowRight className="w-4 h-4" /> 2. Delivery Type
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => setDeliveryType("standard")}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            deliveryType === "standard" 
                              ? "border-primary bg-primary/5" 
                              : "border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          <p className="font-bold text-sm text-daraz-text">Standard Delivery</p>
                          <p className="text-[10px] text-gray-500 mt-1">3-5 Working Days</p>
                          <p className="text-primary font-bold mt-2 text-sm">৳50</p>
                        </button>
                        <button 
                          onClick={() => setDeliveryType("express")}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            deliveryType === "express" 
                              ? "border-primary bg-primary/5" 
                              : "border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          <p className="font-bold text-sm text-daraz-text">Express Delivery</p>
                          <p className="text-[10px] text-gray-500 mt-1">1-2 Days</p>
                          <p className="text-primary font-bold mt-2 text-sm">৳120</p>
                        </button>
                      </div>
                    </section>

                    {/* Payment Method */}
                    <section>
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Star className="w-4 h-4" /> 3. Payment Method
                      </h4>
                      <div className="space-y-3">
                        {[
                          { id: "cod", name: "Cash on Delivery", desc: "Pay when you receive the package" }
                        ].map((method) => (
                          <button 
                            key={method.id}
                            onClick={() => setPaymentMethod(method.id as any)}
                            className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${
                              paymentMethod === method.id 
                                ? "border-primary bg-primary/5" 
                                : "border-gray-100 hover:border-gray-200"
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center p-1 ${
                              paymentMethod === method.id ? "border-primary" : "border-gray-300"
                            }`}>
                              {paymentMethod === method.id && <div className="w-full h-full rounded-full bg-primary" />}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-daraz-text">{method.name}</p>
                              <p className="text-[10px] text-gray-500 font-medium">{method.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </section>
                  </>
              </div>

              <div className="p-6 border-t bg-gray-50 flex items-center justify-between sticky bottom-0">
                  <div className="space-y-1">
                    {currentUser && orders.filter(o => o.customerId === currentUser.uid).length === 0 && promotionConfig.isActive && (
                      <div className="flex items-center gap-2 text-[10px] font-bold text-green-600 uppercase">
                        <Star className="w-3 h-3" /> New User Discount: -৳{promotionConfig.discountAmount}
                      </div>
                    )}
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                    <p className="text-2xl font-black text-primary">
                      ৳{(
                        cartTotal + 
                        (deliveryType === "express" ? 120 : 50) - 
                        (currentUser && orders.filter(o => o.customerId === currentUser.uid).length === 0 && promotionConfig.isActive ? promotionConfig.discountAmount : 0)
                      ).toLocaleString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleCheckout()}
                    disabled={isCheckingOut || !address || !area}
                    className="bg-secondary text-white px-10 py-4 rounded-xl font-bold shadow-xl shadow-red-100 hover:bg-secondary-hover transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isCheckingOut ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        PLACING ORDER...
                      </>
                    ) : (
                      "Confirm Order"
                    )}
                  </button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-[165] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-5xl bg-white md:rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden h-[100dvh] md:h-[85vh] flex flex-col border border-white/20"
            >
              {/* Modal Header */}
              <div className="px-8 py-4 md:py-6 border-b flex items-center justify-between bg-white shrink-0">
                <div className="flex-1">
                  <h3 className="text-xl font-black text-daraz-text flex items-center gap-2 tracking-tight uppercase">
                    <div className="w-1.5 h-6 bg-primary rounded-full mr-1"></div>
                    Account Dashboard
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 ml-3">Premium Member Experience</p>
                </div>
                <button 
                  onClick={() => setIsProfileModalOpen(false)} 
                  className="w-10 h-10 rounded-full hover:bg-gray-50 flex items-center justify-center transition-all group shrink-0"
                >
                  <X className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                </button>
              </div>
              
              <div className="flex-1 flex flex-col md:flex-row bg-[#fafafa] min-h-0 overflow-hidden">
                {/* Profile Sidebar */}
                <div className="w-full md:w-72 bg-white border-r p-6 shrink-0 overflow-y-auto no-scrollbar pb-20 md:pb-6">
                  <div className="flex flex-col gap-1">
                    {/* Compact User Header in Sidebar */}
                    <div className="mb-8 p-6 bg-gradient-to-br from-gray-50 to-white rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                      {/* Abstract Background Decoration */}
                      <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-primary/10 transition-colors"></div>
                      
                      <div className="relative">
                        <div className="relative w-20 h-20 mx-auto mb-4">
                          {/* Premium Avatar Ring */}
                          <div className="absolute inset-0 rounded-full border-4 border-white shadow-xl"></div>
                          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-primary text-3xl font-black shadow-inner overflow-hidden ring-1 ring-gray-100 p-1">
                            {uploadedAvatar ? (
                              <img src={uploadedAvatar} alt="" className="w-full h-full object-cover rounded-full" />
                            ) : currentUser?.avatar ? (
                              <img src={currentUser.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <div className="w-full h-full bg-primary/5 rounded-full flex items-center justify-center">
                                {currentUser?.fullName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <label className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-white rounded-full shadow-lg cursor-pointer flex items-center justify-center border-2 border-white hover:bg-primary-hover hover:scale-110 transition-all z-20">
                            <Plus className="w-3.5 h-3.5" />
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 2 * 1024 * 1024) {
                                    alert("Image size should be less than 2MB");
                                    return;
                                  }
                                  const base64 = await toBase64(file, 250, 250, 0.6);
                                  setUploadedAvatar(base64);
                                  if (currentUser) {
                                    const updated = { ...currentUser, avatar: base64 };
                                    setCurrentUser(updated);
                                    setUsers(prev => prev.map(u => (u.uid === updated.uid || u.id === updated.uid) ? updated : u));
                                    await safeIdbSet("buy_a_to_z_user", updated);
                                    await supabase.from('users').upsert([updated]);
                                  }
                                }
                              }}
                            />
                          </label>
                        </div>
                        
                        <div className="text-center space-y-1">
                          <p className="text-sm font-black text-daraz-text truncate tracking-tight">{currentUser?.fullName}</p>
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                            <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                            <span className="text-[9px] font-black uppercase tracking-wider">
                              {isAdmin ? "Administrator" : "Diamond Member"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Navigation Menu */}
                    <div className="space-y-1">
                      <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 hidden md:block">Account Menu</p>
                      
                      <button 
                        onClick={() => setProfileTab("info")}
                        className={`w-full text-left px-4 py-3.5 rounded-2xl font-bold text-xs flex items-center gap-4 transition-all ${
                          profileTab === "info" 
                            ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                            : "hover:bg-gray-50 text-gray-500 hover:text-daraz-text"
                        }`}
                      >
                        <Settings className={`w-4 h-4 ${profileTab === "info" ? "text-white" : "text-gray-400 font-bold"}`} />
                        Personal Profile
                      </button>

                      <button 
                        onClick={() => setProfileTab("wishlist")}
                        className={`w-full text-left px-4 py-3.5 rounded-2xl font-bold text-xs flex items-center gap-4 transition-all ${
                          profileTab === "wishlist" 
                            ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                            : "hover:bg-gray-50 text-gray-500 hover:text-daraz-text"
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${profileTab === "wishlist" ? "text-white" : "text-gray-400"}`} />
                        My Wishlist
                      </button>

                      <button 
                        onClick={() => { setIsProfileModalOpen(false); setIsOrdersModalOpen(true); }}
                        className="w-full text-left px-4 py-3.5 rounded-2xl hover:bg-gray-50 transition-all text-gray-500 hover:text-daraz-text font-bold text-xs flex items-center gap-4"
                      >
                        <ShoppingCart className="w-4 h-4 text-gray-400" />
                        Purchase History
                      </button>

                      <button 
                        onClick={() => setProfileTab("security")}
                        className={`w-full text-left px-4 py-3.5 rounded-2xl font-bold text-xs flex items-center gap-4 transition-all ${
                          profileTab === "security" 
                            ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                            : "hover:bg-gray-50 text-gray-500 hover:text-daraz-text"
                        }`}
                      >
                        <ShieldCheck className={`w-4 h-4 ${profileTab === "security" ? "text-white" : "text-gray-400"}`} />
                        Security Settings
                      </button>

                      <div className="h-px bg-gray-100 my-4 hidden md:block"></div>

                      <button 
                        onClick={() => {
                          setIsProfileModalOpen(false);
                          setCurrentUser(null);
                          setUserOrders([]);
                          safeIdbDel("buy_a_to_z_user");
                        }}
                        className="w-full text-left px-4 py-3.5 rounded-2xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all font-bold text-xs flex items-center gap-4"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>

                {/* Profile Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-10 min-h-0">
                  <AnimatePresence mode="wait">
                    {profileTab === "info" && (
                      <motion.div 
                        key="info"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="max-w-2xl"
                      >
                        <div className="flex items-center justify-between mb-8">
                          <div>
                            <h4 className="text-2xl font-black text-daraz-text tracking-tighter">Personal Profile</h4>
                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic italic">Identity & Security Information</p>
                          </div>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-5">
                              <div className="flex items-center gap-3 pb-3 border-b border-gray-50 mb-2">
                                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                  <UserIcon className="w-4 h-4 text-primary" />
                                </div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Public Details</span>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                <input 
                                  required
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-daraz-text placeholder:text-gray-300"
                                  placeholder="Full Name"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Contact</label>
                                <input 
                                  required
                                  value={editMobile}
                                  onChange={(e) => setEditMobile(e.target.value)}
                                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-daraz-text placeholder:text-gray-300"
                                  placeholder="01XXXXXXXXX"
                                />
                              </div>
                            </div>
                            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-5 flex flex-col">
                              <div className="flex items-center gap-3 pb-3 border-b border-gray-50 mb-2">
                                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                                </div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Security</span>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Email</label>
                                <div className="relative group">
                                  <div className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-xs sm:text-sm font-bold text-gray-400 break-all pr-12 min-h-[52px] flex items-center leading-tight">
                                    {currentUser?.email}
                                  </div>
                                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 bg-emerald-50 p-1 rounded-full border border-emerald-100">
                                    <ShieldCheck className="w-3 h-3" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="pt-6 flex flex-col sm:flex-row items-center justify-end gap-4">
                            <button 
                              type="submit"
                              disabled={isUpdatingProfile}
                              className="w-full sm:w-auto bg-daraz-text text-white px-12 py-4 rounded-[2.5rem] font-black text-xs h-14 uppercase tracking-[0.2em] shadow-2xl shadow-black/10 hover:bg-black hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                              {isUpdatingProfile ? "Updating..." : "Update Identity"}
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}

                    {profileTab === "wishlist" && (
                      <motion.div 
                        key="wishlist"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="max-w-4xl mx-auto"
                      >
                        <div className="mb-10">
                          <h4 className="text-2xl font-black text-daraz-text tracking-tighter">My Wishlist</h4>
                          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic italic">Curated Collection of your Favorites</p>
                        </div>

                        {wishlistedProductIds.length === 0 ? (
                          <div className="bg-white rounded-[3rem] border border-dashed border-gray-200 p-20 flex flex-col items-center justify-center text-center shadow-sm">
                            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                              <Heart className="w-10 h-10 text-primary/20" />
                            </div>
                            <h5 className="text-lg font-black text-daraz-text mb-2 tracking-tight">Your collection is empty</h5>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.filter(p => wishlistedProductIds.includes(p.id)).map(product => (
                              <div key={product.id} className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-4 group relative hover:shadow-xl hover:shadow-black/5 transition-all hover:-translate-y-1">
                                <button 
                                  onClick={() => setWishlistedProductIds(prev => prev.filter(id => id !== product.id))}
                                  className="absolute top-4 right-4 w-8 h-8 bg-white text-gray-300 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-500 z-10 border border-gray-50 shadow-sm"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                                <div className="aspect-[4/5] rounded-[2rem] bg-gray-50 overflow-hidden relative">
                                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                </div>
                                <div className="px-2">
                                  <p className="text-[11px] font-black text-daraz-text line-clamp-1 uppercase tracking-tight mb-1">{product.name}</p>
                                  <p className="text-lg font-black text-primary">৳{product.price.toLocaleString()}</p>
                                </div>
                                <button 
                                  onClick={() => { handleOpenProduct(product); setIsProfileModalOpen(false); }}
                                  className="w-full py-3.5 bg-gray-50 group-hover:bg-primary text-gray-400 group-hover:text-white text-[10px] font-black uppercase rounded-2xl transition-all shadow-sm border border-gray-100 group-hover:border-primary"
                                >
                                  View Item Details
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}

                    {profileTab === "security" && (
                      <motion.div 
                        key="security"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="max-w-2xl"
                      >
                        <div className="flex items-center justify-between mb-8">
                          <div>
                            <h4 className="text-2xl font-black text-daraz-text tracking-tighter">Security Settings</h4>
                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic italic">Manage your account access & password</p>
                          </div>
                        </div>

                        {authMessage && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mb-6 p-4 rounded-2xl text-xs font-bold uppercase tracking-wider ${
                              authMessage.type === 'success' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                : 'bg-red-50 text-red-700 border border-red-100'
                            }`}
                          >
                            {authMessage.text}
                          </motion.div>
                        )}

                        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
                          <form onSubmit={handleChangePassword} className="space-y-6">
                            <div className="space-y-2">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Password</label>
                              <div className="relative">
                                <input 
                                  required
                                  type={showPassword ? "text" : "password"}
                                  value={currentPassword}
                                  onChange={(e) => setCurrentPassword(e.target.value)}
                                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-daraz-text"
                                  placeholder="••••••••"
                                />
                                <button 
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-primary transition-colors"
                                >
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            <div className="h-px bg-gray-50 mx-4"></div>

                            <div className="space-y-2">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                              <input 
                                required
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-daraz-text"
                                placeholder="••••••••"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                              <input 
                                required
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-daraz-text"
                                placeholder="••••••••"
                              />
                            </div>

                            <div className="pt-4">
                              <button 
                                type="submit"
                                disabled={isAuthLoading}
                                className="w-full bg-primary text-white px-12 py-4 rounded-[2.5rem] font-black text-xs h-14 uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:bg-primary-hover hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                              >
                                {isAuthLoading ? (
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                  "Change Password"
                                )}
                              </button>
                            </div>
                          </form>
                        </div>
                        
                        <div className="mt-8 p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
                          <div className="w-10 h-10 bg-amber-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                            <ShieldCheck className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">Security Recommendation</p>
                            <p className="text-xs text-amber-600 font-medium leading-relaxed">
                              We recommend choosing a unique password that you haven't used on other websites. Use at least 8 characters with numbers and special symbols for maximum security.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOrdersModalOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOrdersModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-2xl bg-daraz-bg rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              <div className="p-6 border-b flex items-center justify-between bg-white shrink-0">
                <h3 className="text-xl font-bold text-daraz-text flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  My Purchase History
                </h3>
                <button onClick={() => setIsOrdersModalOpen(false)} className="text-2xl hover:text-primary">&times;</button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {userOrders.length === 0 ? (
                  <div className="py-20 text-center">
                    <ShoppingCart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No orders found</p>
                  </div>
                ) : (
                  userOrders.map((order, idx) => {
                    const statusColors = {
                      processing: "bg-blue-100 text-blue-600 border-blue-200",
                      shipped: "bg-orange-100 text-orange-600 border-orange-200",
                      delivered: "bg-green-100 text-green-600 border-green-200",
                      cancelled: "bg-red-100 text-red-600 border-red-200"
                    };
                    
                    return (
                      <div key={order.id || `myorder-${idx}`} className="bg-white border rounded-xl overflow-hidden shadow-sm">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Order ID: {order.id}</p>
                            <p className="text-[11px] text-daraz-text">{new Date(order.timestamp).toLocaleDateString()}</p>
                          </div>
                          <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest ${statusColors[order.status]}`}>
                            {order.status}
                          </span>
                        </div>
                        
                      <div className="p-4 space-y-4">
                        {order.items.map((item, i) => (
                          <div key={item.id ? `item-${order.id}-${item.id}-${i}` : i} className="flex gap-3">
                            <img src={item.image} className="w-12 h-12 rounded object-cover border" alt="" />
                              <div className="flex-1">
                                <p className="text-xs font-bold text-daraz-text line-clamp-1">{item.name}</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-[10px] text-gray-500">Qty: {item.quantity} × ৳{item.price.toLocaleString()}</p>
                                  {item.selectedSize && (
                                    <span className="text-[9px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">Size: {item.selectedSize}</span>
                                  )}
                                  {item.selectedColor && (
                                    <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded uppercase border border-emerald-100">Color: {item.selectedColor}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Tracking Timeline */}
                        <div className="px-4 pb-4 pt-2">
                          {order.trackingNumber && (
                            <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/10 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-primary" />
                                <div>
                                  <p className="text-[10px] font-black text-daraz-text uppercase tracking-tight">
                                    Tracking: {order.trackingCarrier || 'Logistic Partner'}
                                  </p>
                                  <p className="text-[9px] text-gray-500 font-bold">{order.trackingNumber}</p>
                                </div>
                              </div>
                              <a 
                                href={`https://www.google.com/search?q=${order.trackingCarrier}+tracking+${order.trackingNumber}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[9px] font-black text-primary hover:underline uppercase tracking-widest bg-white px-2 py-1 rounded shadow-sm"
                              >
                                Track Package
                              </a>
                            </div>
                          )}
                          <div className="relative flex justify-between items-center">
                            <div className="absolute left-0 right-0 h-0.5 bg-gray-100 -z-10 top-1/2 -translate-y-1/2"></div>
                            {['processing', 'shipped', 'delivered'].map((step, idx) => {
                              const isActive = 
                                (order.status === 'processing' && idx === 0) ||
                                (order.status === 'shipped' && idx <= 1) ||
                                (order.status === 'delivered' && idx <= 2);
                              
                              return (
                                <div key={step} className="flex flex-col items-center">
                                  <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${isActive ? 'bg-primary' : 'bg-gray-200'}`}></div>
                                  <span className={`text-[8px] font-bold mt-1 uppercase ${isActive ? 'text-primary' : 'text-gray-400'}`}>{step}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="px-4 py-3 bg-gray-50/50 border-t flex justify-between items-center">
                            <div className="flex flex-col">
                              {order.status === 'processing' && (
                                <div className="mt-1">
                                  {cancellingOrderId === order.id ? (
                                    <div className="flex items-center gap-2">
                                      <p className="text-[9px] font-black text-primary uppercase shrink-0">Confirm?</p>
                                      <button 
                                        onClick={() => handleCancelOrder(order.id)}
                                        className="bg-red-500 text-white text-[8px] font-bold px-2 py-0.5 rounded hover:bg-red-600 transition-colors"
                                      >
                                        YES
                                      </button>
                                      <button 
                                        onClick={() => setCancellingOrderId(null)}
                                        className="text-gray-400 text-[8px] font-bold px-2 py-0.5"
                                      >
                                        NO
                                      </button>
                                    </div>
                                  ) : (order.status === 'cancelled' || cancelSuccessId === order.id) ? (
                                    <motion.p 
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      className="text-[9px] font-bold text-green-500 uppercase flex items-center gap-1"
                                    >
                                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                      Cancelled Successfully
                                    </motion.p>
                                  ) : (
                                    <button 
                                      onClick={() => setCancellingOrderId(order.id)}
                                      className="group flex items-center gap-1 text-[9px] font-black text-red-500 uppercase tracking-widest hover:text-red-600 transition-all"
                                    >
                                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">✕</span>
                                      Cancel Order
                                    </button>
                                  )}
                                </div>
                              )}
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">
                                Payment: <span className="text-daraz-text ml-1">{order.payment.method.toUpperCase()}</span>
                              </p>
                            </div>
                          <p className="text-sm font-black text-primary">Total: ৳{order.total.toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[170] flex items-center justify-center sm:p-4 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 50 }}
              className="relative w-full max-w-4xl bg-white sm:rounded-lg shadow-2xl overflow-hidden h-full sm:h-auto sm:max-h-[90vh] flex flex-col"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-50 text-gray-400 hover:text-black transition-colors"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  
                  {/* Left Column: Visuals */}
                  <div className="p-4 md:p-8 flex flex-col items-center">
                    <div className="w-full aspect-square bg-[#F9F9F9] rounded-lg overflow-hidden relative mb-4">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeDetailImage}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="w-full h-full"
                        >
                          <img 
                            src={activeDetailImage || selectedProduct.image} 
                            className="w-full h-full object-contain" 
                            alt={selectedProduct.name} 
                          />
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Gallery Thumbnails */}
                    {selectedProduct.galleryImages && selectedProduct.galleryImages.length > 0 && (
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full pb-2">
                        <button 
                          onClick={() => setActiveDetailImage(selectedProduct.image)}
                          className={`w-14 h-14 rounded border-2 shrink-0 overflow-hidden transition-all bg-white ${
                            activeDetailImage === selectedProduct.image ? "border-primary" : "border-gray-100 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <img src={selectedProduct.image} className="w-full h-full object-cover" alt="Main" />
                        </button>
                        {selectedProduct.galleryImages.map((url, i) => (
                          <button 
                            key={i}
                            onClick={() => setActiveDetailImage(url)}
                            className={`w-14 h-14 rounded border-2 shrink-0 overflow-hidden transition-all bg-white ${
                              activeDetailImage === url ? "border-primary" : "border-gray-100 opacity-70 hover:opacity-100"
                            }`}
                          >
                            <img src={url} className="w-full h-full object-cover" alt={`Gallery ${i}`} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Info */}
                  <div className="p-4 md:p-8 pt-0 md:pt-8 flex flex-col">
                    <h2 className="text-xl md:text-2xl font-heading font-bold text-[#212121] leading-tight mb-3">
                      {selectedProduct.name}
                    </h2>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(selectedProduct.rating) ? "fill-primary text-primary" : "text-gray-200"}`} />
                          ))}
                        </div>
                        <span className="text-[12px] font-medium text-daraz-text">{selectedProduct.rating}</span>
                        <div className="h-3 w-px bg-gray-200" />
                        <span className="text-[12px] text-gray-500">{productReviews.length} Ratings</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleShareProduct(selectedProduct.id)}
                          className="text-gray-400 hover:text-primary transition-colors relative"
                        >
                          {copySuccessId === selectedProduct.id && (
                            <motion.span 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-2 py-1 rounded whitespace-nowrap z-50"
                            >
                              Copied!
                            </motion.span>
                          )}
                          <Share2 className="w-4.5 h-4.5" />
                        </button>
                        <button 
                          onClick={() => {
                            if (wishlistedProductIds.includes(selectedProduct.id)) {
                              setWishlistedProductIds(prev => prev.filter(id => id !== selectedProduct.id));
                            } else {
                              setWishlistedProductIds(prev => [...prev, selectedProduct.id]);
                            }
                          }}
                          className={`transition-colors relative ${wishlistedProductIds.includes(selectedProduct.id) ? "text-primary" : "text-gray-400"}`}
                        >
                          <Heart className={`w-4.5 h-4.5 ${wishlistedProductIds.includes(selectedProduct.id) ? "fill-current" : ""}`} />
                        </button>
                      </div>
                    </div>

                    {/* Removed Brand Information */}

                    {/* Promo Banner Removed */}

                    <div className="mb-6 border-t pt-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-heading font-bold text-primary">৳</span>
                          <span className="text-4xl font-heading font-bold text-primary tracking-tight">{selectedProduct.price.toLocaleString()}</span>
                        </div>
                        {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400 line-through">৳{selectedProduct.originalPrice.toLocaleString()}</span>
                            <span className="text-sm text-[#212121]">-{Math.round(((selectedProduct.originalPrice - selectedProduct.price) / selectedProduct.originalPrice) * 100)}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Options Selection */}
                    <div className="space-y-6 mb-8 border-t pt-6">
                      {/* Color Selection */}
                      {selectedProduct.showColors !== false && selectedProduct.availableColors && selectedProduct.availableColors.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[14px] font-heading font-bold text-gray-500 w-24">Color Family</span>
                            <span className="text-[14px] font-heading font-bold text-[#212121]">{selectedColor || "Please select"}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedProduct.availableColors.map((color) => (
                              <button
                                key={color}
                                onClick={() => setSelectedColor(color)}
                                className={`w-10 h-10 rounded border-2 transition-all p-0.5 ${
                                  selectedColor === color
                                    ? "border-primary"
                                    : "border-gray-100 hover:border-primary/50"
                                }`}
                              >
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase truncate">
                                  {color.charAt(0)}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Size Selection */}
                      {selectedProduct.showSizes !== false && selectedProduct.availableSizes && selectedProduct.availableSizes.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[14px] font-heading font-bold text-gray-500 w-24">Size</span>
                            <span className="text-[14px] font-heading font-bold text-[#212121]">{selectedSize || "Please select"}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedProduct.availableSizes.map((size) => (
                              <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                className={`h-8 min-w-[48px] px-3 rounded border text-[13px] transition-all ${
                                  selectedSize === size
                                    ? "border-primary text-primary"
                                    : "border-gray-200 text-gray-600 hover:border-primary/50 hover:text-primary"
                                }`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quantity Selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-heading font-bold text-gray-500 w-24">Quantity</span>
                        <div className="flex items-center">
                          <button 
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-8 h-8 rounded border bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                            disabled={quantity <= 1}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <div className="w-12 h-8 flex items-center justify-center text-[14px] font-medium">
                            {quantity}
                          </div>
                          <button 
                            onClick={() => setQuantity(Math.min(selectedProduct.stock, quantity + 1))}
                            className="w-8 h-8 rounded border bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                            disabled={quantity >= selectedProduct.stock}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {selectedProduct.stock > 0 && selectedProduct.stock < 10 && (
                          <span className="ml-2 text-[12px] text-secondary font-medium">Only {selectedProduct.stock} left</span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-auto pb-6">
                      <button 
                        onClick={() => { 
                          if (selectedProduct.availableSizes && selectedProduct.availableSizes.length > 0 && selectedProduct.showSizes !== false && !selectedSize) {
                            alert("PLEASE SELECT A SIZE FIRST");
                            return;
                          }
                          if (selectedProduct.availableColors && selectedProduct.availableColors.length > 0 && selectedProduct.showColors !== false && !selectedColor) {
                            alert("PLEASE SELECT A COLOR FIRST");
                            return;
                          }
                          handleBuyNow(selectedProduct, selectedSize || undefined, selectedColor || undefined); 
                          setSelectedProduct(null); 
                        }}
                        className="flex-1 bg-primary hover:bg-primary-hover text-white h-12 rounded-sm text-[16px] font-heading font-bold transition-all active:scale-95 flex items-center justify-center"
                      >
                        Buy Now
                      </button>
                      <button 
                        onClick={() => { 
                          if (selectedProduct.availableSizes && selectedProduct.availableSizes.length > 0 && selectedProduct.showSizes !== false && !selectedSize) {
                            alert("PLEASE SELECT A SIZE FIRST");
                            return;
                          }
                          if (selectedProduct.availableColors && selectedProduct.availableColors.length > 0 && selectedProduct.showColors !== false && !selectedColor) {
                            alert("PLEASE SELECT A COLOR FIRST");
                            return;
                          }
                          // Add multiple items if quantity > 1
                          for (let i = 0; i < quantity; i++) {
                            addToCart(selectedProduct, selectedSize || undefined, selectedColor || undefined, i === quantity - 1); 
                          }
                          setSelectedProduct(null); 
                        }}
                        disabled={selectedProduct.stock <= 0}
                        className="flex-1 bg-primary hover:bg-primary-hover disabled:bg-gray-300 text-white h-12 rounded-sm text-[16px] font-heading font-bold transition-all active:scale-95 flex items-center justify-center"
                      >
                        {selectedProduct.stock > 0 ? "Add to Cart" : "Out of Stock"}
                      </button>
                    </div>

                    {/* Product Details Section */}
                    {selectedProduct.description && (
                      <div className="mt-4 border-t pt-6 pb-6">
                         <h4 className="text-[14px] font-heading font-bold text-[#212121] mb-2 uppercase tracking-wide">Product Details</h4>
                         <p className="text-[13px] text-gray-600 leading-relaxed font-sans">
                           {selectedProduct.description}
                         </p>
                      </div>
                    )}

                    {/* Reviews Section */}
                    <div className="mt-4 border-t pt-6">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-[14px] font-heading font-bold text-[#212121] uppercase tracking-wide">Ratings & Reviews</h4>
                        {currentUser && !isReviewFormOpen && (
                          <button 
                            onClick={() => setIsReviewFormOpen(true)}
                            className="text-[12px] font-bold text-primary hover:underline"
                          >
                            Add Review
                          </button>
                        )}
                      </div>

                      {isReviewFormOpen && (
                        <motion.form 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          onSubmit={handleSubmitReview}
                          className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100"
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <p className="text-[12px] font-bold text-gray-500">Rate:</p>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setReviewRating(star)}
                                  className="focus:outline-none transition-transform hover:scale-110"
                                >
                                  <Star className={`w-5 h-5 ${star <= reviewRating ? "fill-primary text-primary" : "text-gray-200"}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                          <textarea
                            required
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Share your experience..."
                            className="w-full border rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 mb-4 h-24"
                          />
                          <div className="flex gap-2">
                            <button 
                              type="submit"
                              disabled={isLoading}
                              className="bg-primary text-white px-6 py-2 rounded font-bold text-xs uppercase"
                            >
                              {isLoading ? "Posting..." : "Submit"}
                            </button>
                            <button 
                              type="button"
                              onClick={() => setIsReviewFormOpen(false)}
                              className="bg-white border text-gray-400 px-6 py-2 rounded font-bold text-xs uppercase"
                            >
                              Cancel
                            </button>
                          </div>
                        </motion.form>
                      )}

                      <div className="space-y-6 pb-12">
                        {productReviews.length === 0 ? (
                          <div className="py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <p className="text-gray-400 text-xs font-bold uppercase">No reviews yet</p>
                          </div>
                        ) : (
                          productReviews.map((review) => (
                            <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black uppercase text-gray-400">
                                    {review.userName.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-[12px] font-bold text-[#212121]">{review.userName}</p>
                                    <div className="flex gap-0.5 mt-0.5">
                                      {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} className={`w-2.5 h-2.5 ${s <= review.rating ? "fill-primary text-primary" : "text-gray-200"}`} />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <p className="text-[10px] text-gray-400">
                                  {new Date(review.timestamp).toLocaleDateString()}
                                </p>
                              </div>
                              <p className="text-[13px] text-gray-600 leading-relaxed italic ml-10">
                                "{review.comment}"
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      <AnimatePresence>
        {orderSuccess && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-primary/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative bg-white rounded-2xl p-10 shadow-2xl flex flex-col items-center text-center max-w-sm w-full"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <ShoppingCart className="w-10 h-10 text-primary" />
                </motion.div>
              </div>
              <h2 className="text-2xl font-black text-daraz-text mb-2">Order Placed!</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                Your order was successfully received and is being processed for delivery. Check your email for details.
              </p>
              <button 
                onClick={() => { setOrderSuccess(false); setIsCartOpen(false); }}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg hover:bg-primary-hover transition-all active:scale-95"
              >
                GOT IT, THANKS!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Auth Modal --- */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <button 
                  onClick={() => setIsAuthModalOpen(false)} 
                  className="absolute top-4 right-4 text-gray-400 hover:text-daraz-text text-2xl transition-colors"
                >
                  &times;
                </button>
                <h3 className="text-2xl font-bold mb-6 text-daraz-text">
                  {authMode === "login" ? "Welcome back!" : "Join Buy A to z"}
                </h3>
                
                {authMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-6 p-4 rounded-lg text-sm font-medium ${
                      authMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}
                  >
                    {authMessage.text}
                  </motion.div>
                )}
                
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                    {authMode === "signup" && signupStep === 1 && (
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">FULL NAME</label>
                        <input 
                          required
                          type="text" 
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full border border-gray-200 rounded px-3 py-2.5 outline-none focus:border-primary text-sm bg-gray-50/50 transition-all" 
                          placeholder="আপনার নাম লিখুন" 
                        />
                      </div>
                    )}
                    
                    {authMode === "signup" && signupStep === 1 && (
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">MOBILE NUMBER</label>
                        <input 
                          required={authMode === "signup"}
                          type="tel" 
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          className="w-full border border-gray-200 rounded px-3 py-2.5 outline-none focus:border-primary text-sm bg-gray-50/50 transition-all font-medium" 
                          placeholder="01xxxxxxxxx" 
                        />
                      </div>
                    )}

                    {signupStep === 1 && (
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">
                          {authMode === "signup" ? "EMAIL ADDRESS" : "EMAIL OR MOBILE NUMBER"}
                        </label>
                        <input 
                          required
                          type={authMode === "signup" ? "email" : "text"} 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full border border-gray-200 rounded px-3 py-2.5 outline-none focus:border-primary text-sm bg-gray-50/50 transition-all font-medium" 
                          placeholder={authMode === "signup" ? "email@example.com" : "email@example.com or 017xxxxxxxx"} 
                        />
                      </div>
                    )}

                    {signupStep === 1 && (
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">PASSWORD</label>
                        <div className="relative">
                          <input 
                            required
                            type={showPassword ? "text" : "password"} 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-gray-200 rounded px-3 py-2.5 outline-none focus:border-primary text-sm bg-gray-50/50 transition-all font-medium" 
                            placeholder="••••••••" 
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-primary transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {authMode === "signup" && signupStep === 2 && (
                      <div className="space-y-4">
                        <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0">✓</div>
                            <div className="text-xs text-emerald-800 font-medium font-bold">ভেরিফিকেশন কোড পাঠানো হয়েছে!</div>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            আমরা আপনার {email ? "ইমেইল" : "মোবাইল"}-এ একটি ৬ অক্ষরের কোড পাঠিয়েছি। সেটি এখানে দিন।
                        </p>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">6-DIGIT VERIFICATION CODE</label>
                            <input 
                              required
                              type="text" 
                              maxLength={6}
                              value={userEnteredCode}
                              onChange={(e) => setUserEnteredCode(e.target.value)}
                              className="w-full border border-gray-200 rounded px-3 py-8 outline-none focus:border-primary text-center text-3xl font-bold tracking-[0.5em] bg-gray-50/50 transition-all" 
                              placeholder="000000" 
                            />
                        </div>
                      </div>
                    )}

                    <button 
                      type="submit"
                      disabled={isAuthLoading}
                      className="w-full bg-secondary text-white py-3.5 rounded-lg font-bold shadow-lg shadow-red-100 mt-4 active:scale-95 transition-all hover:bg-secondary-hover disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isAuthLoading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        authMode === "login" ? "LOGIN" : 
                        signupStep === 1 ? "REGISTER" : "VERIFY CODE"
                      )}
                    </button>

                    <div className="flex items-center gap-4 py-2">
                      <div className="flex-1 h-px bg-gray-100"></div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">OR</span>
                      <div className="flex-1 h-px bg-gray-100"></div>
                    </div>

                    <button 
                      type="button"
                      disabled={isLoading}
                      onClick={handleGoogleLogin}
                      className="w-full bg-white border border-gray-300 text-daraz-text py-3 rounded-lg font-bold flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-400 transition-all active:scale-95 shadow-sm group"
                    >
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="group-hover:text-primary transition-colors">Sign in with Google</span>
                  </button>

                  <p className="text-center text-[11px] text-gray-500 mt-4">
                    {authMode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                    <button 
                      type="button"
                      onClick={() => {
                        setAuthMode(authMode === "login" ? "signup" : "login");
                        setSignupStep(1);
                        setSignupUserData(null);
                        setAuthMessage(null);
                      }}
                      className="text-secondary cursor-pointer font-bold hover:underline"
                    >
                      {authMode === "login" ? "Register here" : "Login here"}
                    </button>
                  </p>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Category Sidebar (Drawer) */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-[120] md:hidden"
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="fixed left-0 top-0 h-screen w-80 bg-white z-[121] md:hidden p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  {footerConfig.logoUrl && (
                    <img src={footerConfig.logoUrl} alt="" className="h-8 w-auto object-contain" />
                  )}
                  {footerConfig.showName !== false && (
                    <h2 className="text-xl font-heading font-black text-primary">{footerConfig.companyName}</h2>
                  )}
                </div>
                <button onClick={() => setSidebarOpen(false)}><X className="w-6 h-6" /></button>
              </div>
              <nav className="space-y-4">
                {currentUser ? (
                  <div className="mb-8 p-4 bg-gray-50 rounded-xl border">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full border border-primary/20 flex items-center justify-center overflow-hidden">
                        {currentUser.avatar ? (
                          <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium tracking-wide">Welcome back,</p>
                        <p className="text-sm font-bold text-daraz-text">{currentUser.fullName}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => { setIsProfileModalOpen(true); setSidebarOpen(false); }}
                        className="w-full text-left py-2.5 px-4 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-3 active:scale-[0.98] transition-all"
                      >
                        <UserIcon className="w-4 h-4 text-primary" /> MY PROFILE
                      </button>
                      <button 
                        onClick={() => { setIsOrdersModalOpen(true); setSidebarOpen(false); }}
                        className="w-full text-left py-2.5 px-4 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-3 active:scale-[0.98] transition-all"
                      >
                        <ShoppingCart className="w-4 h-4 text-primary" /> MY ORDERS
                      </button>
                      <button 
                        onClick={() => { setShowGmailView(true); setSidebarOpen(false); }}
                        className="w-full text-left py-2.5 px-4 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-3 active:scale-[0.98] transition-all"
                      >
                        <Mail className="w-4 h-4 text-primary" /> MY GMAIL
                      </button>
                      <button 
                        onClick={() => { handleLogout(); setSidebarOpen(false); }}
                        className="w-full text-left py-2.5 px-4 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-secondary flex items-center gap-3 active:scale-[0.98] transition-all"
                      >
                        <LogOut className="w-4 h-4" /> LOGOUT
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    <button 
                      onClick={() => { setAuthMode("login"); setIsAuthModalOpen(true); setSidebarOpen(false); }}
                      className="bg-primary text-white py-3 rounded-lg font-bold text-sm shadow-md"
                    >
                      Login
                    </button>
                    <button 
                      onClick={() => { setAuthMode("signup"); setIsAuthModalOpen(true); setSidebarOpen(false); }}
                      className="border border-secondary text-secondary py-3 rounded-lg font-bold text-sm"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
                <button
                  onClick={() => { setSelectedCategory("All Categories"); setSidebarOpen(false); }}
                  className={`w-full text-left py-2 border-b border-gray-50 text-base font-medium flex items-center justify-between ${
                    selectedCategory === "All Categories" ? "text-primary" : "text-gray-600"
                  }`}
                >
                  All Categories
                  <ChevronRight className="w-4 h-4" />
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.name); setSidebarOpen(false); }}
                    className={`w-full text-left py-2 border-b border-gray-50 text-base font-medium flex items-center justify-between ${
                      selectedCategory === cat.name ? "text-primary" : "text-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span>{cat.icon}</span>
                      {cat.name}
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Floating Bottom Navigation (Tabbar) for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2 pb-safe-area flex items-center justify-between z-[100] md:hidden shadow-[0_-5px_15px_rgba(0,0,0,0.03)]">
        <button onClick={() => setSelectedCategory("All Categories")} className={`flex flex-col items-center gap-1 ${selectedCategory === "All Categories" ? "text-primary" : "text-gray-400"}`}>
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button onClick={() => { setSearchQuery(""); setSelectedCategory("All Categories"); }} className="flex flex-col items-center gap-1 text-gray-400">
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] font-bold">Mall</span>
        </button>
        <button 
          onClick={() => {
            if (currentUser) {
              setShowGmailView(true);
            } else {
              setIsAuthModalOpen(true);
            }
          }} 
          className={`flex flex-col items-center gap-1 ${showGmailView ? "text-primary" : "text-gray-400"}`}
        >
          <Mail className="w-5 h-5" />
          <span className="text-[10px] font-bold">Gmail</span>
        </button>
        <button onClick={() => setIsCartOpen(true)} className="flex flex-col items-center gap-1 text-gray-400 relative">
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[10px] font-bold">Cart</span>
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-secondary text-white text-[9px] font-bold px-1 rounded-full">{cart.length}</span>
          )}
        </button>
        <button onClick={() => { if (currentUser) setIsProfileModalOpen(true); else setIsAuthModalOpen(true); }} className={`flex flex-col items-center gap-1 ${isProfileModalOpen ? "text-primary" : "text-gray-400"}`}>
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold">Account</span>
        </button>
      </nav>

      <AnimatePresence>
        {showGmailView && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGmailView(false)}
              className="fixed inset-0 bg-black/60 z-[200]"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[201] shadow-2xl overflow-hidden"
            >
              <GmailView />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              id="confirm-modal-overlay"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 flex flex-col items-center text-center overflow-hidden"
              id="confirm-modal-content"
            >
              {/* Decorative accent top */}
              <div className={`w-12 h-12 rounded-full mb-4 flex items-center justify-center ${
                confirmModal.variant === 'danger' 
                  ? 'bg-red-50 text-red-500' 
                  : confirmModal.variant === 'warning'
                  ? 'bg-amber-50 text-amber-500'
                  : 'bg-blue-50 text-blue-500'
              }`}>
                {confirmModal.variant === 'danger' ? (
                  <Trash2 className="w-6 h-6" />
                ) : confirmModal.variant === 'warning' ? (
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                ) : (
                  <Info className="w-6 h-6 text-blue-500" />
                )}
              </div>

              <h4 className="text-sm font-black text-daraz-text tracking-tight uppercase mb-2">
                {confirmModal.title}
              </h4>
              <p className="text-[11px] text-gray-500 leading-relaxed font-semibold mb-6">
                {confirmModal.message}
              </p>

              <div className="grid grid-cols-2 gap-2.5 w-full">
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="py-2.5 px-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all font-black uppercase text-[9px] tracking-wider"
                  id="confirm-modal-cancel"
                >
                  {confirmModal.cancelText || "বাতিল"}
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className={`py-2.5 px-4 rounded-xl text-white font-black uppercase text-[9px] tracking-wider transition-all shadow-lg active:scale-95 ${
                    confirmModal.variant === 'danger'
                      ? 'bg-red-500 hover:bg-red-600 shadow-red-100'
                      : confirmModal.variant === 'warning'
                      ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-100'
                      : 'bg-primary hover:bg-primary/90 shadow-primary/20'
                  }`}
                  id="confirm-modal-btn"
                >
                  {confirmModal.confirmText || "ঠিক আছে"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-sm z-[100]">
        <div className="bg-white/90 backdrop-blur-2xl border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[2.5rem] p-1.5 flex items-center justify-between ring-1 ring-black/5">
          <button 
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex flex-col items-center gap-1 flex-1 py-1.5 group"
          >
            <div className="p-1.5 rounded-xl group-hover:bg-primary/10 transition-all">
              <Home className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
            </div>
            <span className="text-[9px] font-black text-gray-400 group-hover:text-primary capitalize whitespace-nowrap tracking-tight transition-colors">Home</span>
          </button>

          <button 
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center gap-1 flex-1 py-1.5 group"
          >
            <div className="p-1.5 rounded-xl group-hover:bg-primary/10 transition-all">
              <Menu className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
            </div>
            <span className="text-[9px] font-black text-gray-400 group-hover:text-primary capitalize whitespace-nowrap tracking-tight transition-colors">List</span>
          </button>

          {/* Special Center Button for Cart */}
          <div className="relative -mt-8 px-1">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="w-14 h-14 bg-secondary text-white rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(244,67,54,0.4)] ring-4 ring-white active:scale-90 transition-all group"
            >
              <ShoppingBag className="w-6 h-6 animate-pulse" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-black w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>

          <button 
            onClick={() => {
              if (currentUser) {
                setIsOrdersModalOpen(true);
              } else {
                setAuthMode("login");
                setIsAuthModalOpen(true);
              }
            }}
            className="flex flex-col items-center gap-1 flex-1 py-1.5 group"
          >
            <div className="p-1.5 rounded-xl group-hover:bg-primary/10 transition-all relative">
              <ShoppingCart className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
              {userOrders.filter(o => o.status === 'processing').length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full border border-white"></span>
              )}
            </div>
            <span className="text-[9px] font-black text-gray-400 group-hover:text-primary capitalize whitespace-nowrap tracking-tight transition-colors">Orders</span>
          </button>

          <button 
            onClick={() => {
              if (currentUser) {
                setIsProfileModalOpen(true);
              } else {
                setAuthMode("login");
                setIsAuthModalOpen(true);
              }
            }}
            className="flex flex-col items-center gap-1 flex-1 py-1.5 group"
          >
            <div className="p-1.5 rounded-xl group-hover:bg-primary/10 transition-all">
              <UserIcon className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
            </div>
            <span className="text-[9px] font-black text-gray-400 group-hover:text-primary capitalize whitespace-nowrap tracking-tight transition-colors">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
