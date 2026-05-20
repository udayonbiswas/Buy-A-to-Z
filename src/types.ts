export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviewCount: number;
  discount?: number;
  stock: number;
  location?: string;
  partNumber?: string;
  galleryImages?: string[];
  description?: string;
  availableSizes?: string[];
  showSizes?: boolean;
  availableColors?: string[];
  showColors?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface User {
  uid: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  password?: string;
  avatar?: string;
  role?: 'admin' | 'user';
  isAdmin?: boolean;
  isVerified?: boolean;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  items: CartItem[];
  total: number;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  timestamp: any;
  delivery: {
    address: string;
    city: string;
    area: string;
    deliveryType: 'standard' | 'express';
  };
  payment: {
    method: 'cod' | 'bkash' | 'card';
  };
  trackingNumber?: string;
  trackingCarrier?: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  timestamp: any;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  imageUrl?: string; // Optional if we use gradient instead
  backgroundColor?: string;
  textColor?: string;
  categoryLink?: string;
}

export interface FooterConfig {
  companyName: string;
  logoUrl?: string;
  showName?: boolean;
  copyrightText: string;
  customerCareText: string;
  customerCarePhone: string;
  sellOnText: string;
  appDownloadText: string;
  appDownloadLink: string;
  showSecuredBy: boolean;
}

export interface PromotionConfig {
  title: string;
  description: string;
  discountAmount: number;
  isActive: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  timestamp: any;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    costPrice: number;
  }[];
  totalAmount: number;
  status: 'completed' | 'pending';
  note?: string;
}
