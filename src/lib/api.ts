// API Configuration - frontend will call the local API server by default
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Helper to construct full image URLs from stored relative paths
export const getImageURL = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (API_BASE_URL.startsWith('http')) {
    try {
      const url = new URL(API_BASE_URL);
      return `${url.origin}${path}`;
    } catch (e) {
      return path;
    }
  }
  return path;
};

// Token storage keys (unified with AuthContext)
const TOKEN_KEY = 'speedy_bites_auth_token';
const REFRESH_TOKEN_KEY = 'speedy_bites_refresh_token';

// Helper to get stored token
export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// Helper to set token
export const setAuthToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

// Helper to clear auth data
export const clearAuth = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('speedy_bites_user');
};

// Generic fetch wrapper with auth and error handling
export const apiFetch = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();

  const headers: HeadersInit = {
    'Accept': 'application/json',
    ...options.headers,
  };

  // Only set Content-Type to JSON if not sending FormData
  if (!(options.body instanceof FormData)) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const doFetch = async (hdrs: HeadersInit) => fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers: hdrs });

  let response = await doFetch(headers);

  // If unauthorized, try to refresh access token once (if refresh token present)
  if (response && response.status === 401) {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        const refreshed = await api.refreshAuthToken(refreshToken);
        if (refreshed && (refreshed as any).accessToken) {
          setAuthToken((refreshed as any).accessToken);
          if ((refreshed as any).refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, (refreshed as any).refreshToken);
          }
          // retry original request with new token
          const newHeaders = { ...headers } as Record<string, string>;
          newHeaders['Authorization'] = `Bearer ${(refreshed as any).accessToken}`;
          response = await doFetch(newHeaders);
        }
      } catch (err) {
        // refresh failed — fall through to logout
      }
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearAuth();
      // Avoid forcing a full-page reload to /login if we're already there —
      // that can create a reload loop when many components trigger 401s.
      try {
        const currentPath = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '';
        if (currentPath !== '/login') {
          window.location.href = '/login';
        }
      } catch (e) {
        // ignore in non-browser environments
      }
    }
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || 'Something went wrong');
  }

  return response.json();
};

// API Endpoints (to be connected to Laravel backend)
export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiFetch<{ accessToken: string; refreshToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: RegisterData) =>
    apiFetch<{ accessToken: string; refreshToken: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: (refreshToken?: string) => apiFetch<void>('/auth/logout', { method: 'POST', body: JSON.stringify({ refresh_token: refreshToken }) }),

  refreshAuthToken: async (refreshToken: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) throw new Error('Failed to refresh token');
    return response.json() as Promise<{ accessToken: string; refreshToken?: string }>;
  },

  // Menu
  getCategories: async () => {
    const data = await apiFetch<any[]>('/categories');
    return data.map(cat => ({
      id: cat.id,
      name: cat.name,
      image: cat.image_url || '',
      itemCount: cat.item_count || 0,
    })) as Category[];
  },

  getMenuItems: async (categoryId?: string) => {
    const data = await apiFetch<any[]>(categoryId ? `/menu?category=${categoryId}` : '/menu');
    return data.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: Number(item.price) || 0,
      originalPrice: item.original_price ? Number(item.original_price) : undefined,
      image: item.image_url || '',
      image_url: item.image_url || '', // Keep both for compatibility
      category: item.category_name || '',
      categoryId: item.category_id || '',
      is_available: item.is_available !== false,
      isAvailable: item.is_available !== false,
      isFeatured: item.is_featured === true,
      is_featured: item.is_featured === true,
      rating: item.rating ? Number(item.rating) : undefined,
    })) as MenuItem[];
  },

  getMenuItem: async (id: string) => {
    // Fetch all menu items and find the one with matching ID
    // (backend doesn't have /menu/:id endpoint yet)
    const allItems = await apiFetch<any[]>('/menu');
    const item = allItems.find(i => i.id === id);

    if (!item) {
      throw new Error('Menu item not found');
    }

    return {
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: Number(item.price) || 0,
      originalPrice: item.original_price ? Number(item.original_price) : undefined,
      image: item.image_url || '',
      image_url: item.image_url || '',
      category: item.category_name || '',
      categoryId: item.category_id || '',
      isAvailable: item.is_available !== false,
      isFeatured: item.is_featured === true,
      rating: item.rating ? Number(item.rating) : undefined,
    } as MenuItem;
  },

  getFeaturedItems: async () => {
    const data = await apiFetch<any[]>('/menu/featured');
    return data.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: Number(item.price) || 0,
      originalPrice: item.original_price ? Number(item.original_price) : undefined,
      image: item.image_url || '',
      image_url: item.image_url || '',
      category: item.category_name || '',
      categoryId: item.category_id || '',
      isAvailable: item.is_available !== false,
      isFeatured: item.is_featured === true,
      rating: item.rating ? Number(item.rating) : undefined,
    })) as MenuItem[];
  },

  // Cart
  getCart: () => apiFetch<Cart>('/cart'),
  addToCart: (itemId: string, quantity: number, options?: CartItemOptions) =>
    apiFetch<Cart>('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId, quantity, options }),
    }),
  updateCartItem: (cartItemId: string, quantity: number) =>
    apiFetch<Cart>(`/cart/${cartItemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),
  removeFromCart: (cartItemId: string) =>
    apiFetch<Cart>(`/cart/${cartItemId}`, { method: 'DELETE' }),
  clearCart: () => apiFetch<void>('/cart/clear', { method: 'DELETE' }),

  // Promo Codes
  validatePromoCode: async (code: string, subtotal: number) => {
    const data = await apiFetch<any>('/promo/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal }),
    });
    return {
      code: data.code,
      discountAmount: Number(data.discount_amount) || 0,
      discountType: data.discount_type,
    };
  },

  // Orders
  createOrder: (data: CreateOrderData) =>
    apiFetch<{ success: boolean; orderId: string; error?: string }>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getOrders: async () => {
    const data = await apiFetch<any[]>('/orders');
    return data.map(order => ({
      id: order.id,
      orderNumber: order.order_number || `ORD-${String(order.id).slice(-6).toUpperCase()}`,
      status: order.status as OrderStatus,
      subtotal: Number(order.subtotal) || 0,
      deliveryFee: Number(order.delivery_fee) || 0,
      discount: Number(order.discount) || 0,
      total: Number(order.total) || 0,
      paymentMethod: order.payment_method || 'mpesa',
      paymentStatus: order.payment_status || 'pending',
      createdAt: order.created_at,
      address: {
        ...(order.address || order.delivery_address || {}),
        lat: order.address?.latitude || order.delivery_address?.latitude || order.latitude,
        lng: order.address?.longitude || order.delivery_address?.longitude || order.longitude,
      },

      items: (order.items || order.order_items || []).map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        totalPrice: Number(item.total_price) || 0,
        menuItem: {
          id: item.menu_item_id || item.id,
          name: item.name || item.menu_item_name || 'Item',
          price: Number(item.unit_price) || 0,
        }
      })),
    })) as Order[];
  },

  getOrder: async (id: string) => {
    const order = await apiFetch<any>(`/orders/${id}`);
    return {
      id: order.id,
      orderNumber: order.order_number || `ORD-${String(order.id).slice(-6).toUpperCase()}`,
      status: order.status as OrderStatus,
      subtotal: Number(order.subtotal) || 0,
      deliveryFee: Number(order.delivery_fee) || 0,
      discount: Number(order.discount) || 0,
      total: Number(order.total) || 0,
      paymentMethod: order.payment_method || 'mpesa',
      paymentStatus: order.payment_status || 'pending',
      createdAt: order.created_at,
      address: {
        ...(order.address || order.delivery_address || {}),
        lat: order.address?.latitude || order.delivery_address?.latitude || order.latitude,
        lng: order.address?.longitude || order.delivery_address?.longitude || order.longitude,
      },

      items: (order.items || order.order_items || []).map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        totalPrice: Number(item.total_price) || 0,
        menuItem: {
          id: item.menu_item_id || item.id,
          name: item.name || item.menu_item_name || 'Item',
          price: Number(item.unit_price) || 0,
        }
      })),
      estimatedDelivery: order.estimated_delivery_time,
    } as Order;
  },


  // Admin order management
  getAdminOrders: () => apiFetch<any[]>('/admin/orders'),
  getAdminOrder: (id: string) => apiFetch<any>(`/admin/orders/${id}`),
  updateOrderStatusAdmin: (id: string, status: string) => apiFetch<any>(`/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  assignRiderToOrder: (id: string, riderId: string) => apiFetch<any>(`/admin/orders/${id}/assign-rider`, { method: 'POST', body: JSON.stringify({ rider_id: riderId }) }),
  getReports: () => apiFetch<any>('/admin/reports'),



  // Rider endpoints
  getAvailableRiderOrders: () => apiFetch<any[]>('/rider/available'),
  getRiderHistory: () => apiFetch<any[]>('/rider/history'),
  acceptRiderOrder: (orderId: string) => apiFetch<any>(`/rider/accept/${orderId}`, { method: 'POST' }),
  updateRiderOrderStatus: (orderId: string, status: string) => apiFetch<any>(`/rider/update/${orderId}`, { method: 'POST', body: JSON.stringify({ status }) }),

  // Admin riders
  getRiders: () => apiFetch<any[]>('/admin/riders'),
  createRider: (data: { email: string; name: string; phone?: string; password?: string }) =>
    apiFetch<any>('/admin/riders', { method: 'POST', body: JSON.stringify(data) }),
  deleteRider: (id: string) => apiFetch<void>(`/admin/riders/${id}`, { method: 'DELETE' }),

  // Favorites
  getFavorites: () => apiFetch<string[]>('/favorites'),
  addFavorite: (menuItemId: string) => apiFetch<void>('/favorites', { method: 'POST', body: JSON.stringify({ menu_item_id: menuItemId }) }),
  removeFavorite: (menuItemId: string) => apiFetch<void>(`/favorites/${menuItemId}`, { method: 'DELETE' }),

  // Profile
  getProfile: () => apiFetch<User>('/profile'),
  updateProfile: (data: Partial<User>) =>
    apiFetch<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiFetch<User>('/auth/avatar', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set content-type for FormData
    });
  },

  // Saved Addresses
  getAddresses: () => apiFetch<any[]>('/addresses'),
  addAddress: (data: any) => apiFetch<any>('/addresses', { method: 'POST', body: JSON.stringify(data) }),
  updateAddress: (id: string, data: any) => apiFetch<any>(`/addresses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAddress: (id: string) => apiFetch<void>(`/addresses/${id}`, { method: 'DELETE' }),

  // Payment Methods
  getPaymentMethods: () => apiFetch<any[]>('/payment-methods'),
  addPaymentMethod: (data: any) => apiFetch<any>('/payment-methods', { method: 'POST', body: JSON.stringify(data) }),
  setDefaultPaymentMethod: (id: string) => apiFetch<any>(`/payment-methods/${id}/default`, { method: 'PUT' }),
  deletePaymentMethod: (id: string) => apiFetch<void>(`/payment-methods/${id}`, { method: 'DELETE' }),

  // Password Management
  changePassword: (current_password: string, new_password: string) =>
    apiFetch<any>('/auth/change-password', { method: 'PUT', body: JSON.stringify({ current_password, new_password }) }),
  forgotPassword: (email: string) =>
    apiFetch<any>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, new_password: string) =>
    apiFetch<any>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, new_password }) }),

  // Sessions (refresh token management)
  getSessions: () => apiFetch<Array<{ token: string; createdAt: string; expiresAt: string }>>('/auth/sessions'),
  revokeSession: (token: string) => apiFetch<void>(`/auth/revoke/${token}`, { method: 'POST' }),

  // Promos
  getPromos: () => apiFetch<Promo[]>('/promos'),
  validatePromo: (code: string) => apiFetch<Promo>(`/promos/validate/${code}`),

  // Auth helpers
  setAuthToken,
  clearAuth,
};

// Type definitions
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role?: string;
  address?: Address;
}

export interface Address {
  street: string;
  city: string;
  landmark?: string;
  lat?: number;
  lng?: number;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  itemCount: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  categoryId: string;
  isAvailable: boolean;
  isFeatured?: boolean;
  rating?: number;
  options?: MenuItemOption[];
}

export interface MenuItemOption {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  choices: {
    id: string;
    name: string;
    price: number;
  }[];
}

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  options?: CartItemOptions;
  totalPrice: number;
  notes?: string;
}


export interface CartItemOptions {
  [optionId: string]: string | string[];
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  promoCode?: string;
}

export interface CreateOrderData {
  customer_id?: string;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  delivery_address: Address;
  items: {
    menu_item_id: string;
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    notes?: string | null;
  }[];
  payment_method: 'cash' | 'mpesa';
  notes?: string | null;
  promo_code?: string | null;
}


export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  address: Address;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  createdAt: string;
  estimatedDelivery?: string;
  driver?: {
    name: string;
    phone: string;
  };
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'on_the_way' | 'delivered' | 'cancelled' | 'assigned' | 'picked_up' | 'arrived' | 'accepted';


export interface Promo {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrder?: number;
  expiresAt: string;
}
