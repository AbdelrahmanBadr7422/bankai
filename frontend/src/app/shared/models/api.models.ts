export type Role = 'CUSTOMER' | 'ADMIN';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'CANCELLED';
export type PaymentMethod = 'COD';

export const ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

/** UI hint only. The backend enforces the real transition rules (409 on invalid changes). */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: Record<string, string>;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
  createdAt: string;
}
export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: User;
}
export interface LoginRequest {
  email: string;
  password: string;
}
export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string | null;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
}
export interface CategoryRequest {
  name: string;
  description?: string | null;
}

export interface Product {
  id: number;
  title: string;
  description: string | null;
  author: string;
  isbn: string;
  price: number;
  stockQuantity: number;
  coverImageUrl: string | null;
  categoryId: number;
  categoryName: string;
  active: boolean;
  createdAt: string;
}
export interface ProductRequest {
  title: string;
  description: string | null;
  author: string;
  isbn: string;
  price: number;
  stockQuantity: number;
  coverImageUrl: string | null;
  categoryId: number;
  active: boolean;
}

export interface CartItem {
  productId: number;
  title: string;
  coverImageUrl: string | null;
  unitPrice: number;
  quantity: number;
  availableStock: number;
  lineTotal: number;
}
export interface Cart {
  items: CartItem[];
  totalQuantity: number;
  subtotal: number;
  estimatedShippingFee: number;
  total: number;
}

export interface Address {
  id: number;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  postalCode: string;
  country: string;
}
export type AddressRequest = Omit<Address, 'id'>;

export interface OrderItem {
  productId: number;
  productTitle: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}
export interface OrderSummary {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  createdAt: string;
  customerEmail: string;
}
export interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shippingFee: number;
  total: number;
  shippingAddress: Omit<Address, 'id'>;
  items: OrderItem[];
  createdAt: string;
  customerEmail: string;
}

export interface Dashboard {
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: Record<OrderStatus, number>;
  totalCustomers: number;
  lowStockThreshold: number;
  recentOrders: OrderSummary[];
  lowStockProducts: Product[];
}
