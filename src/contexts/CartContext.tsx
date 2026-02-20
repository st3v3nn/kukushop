import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Cart, CartItem, MenuItem, CartItemOptions } from '@/lib/api';
import { api } from '@/lib/api';

interface CartContextType {
  cart: Cart;
  itemCount: number;
  addItem: (item: MenuItem, quantity?: number, options?: CartItemOptions) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  applyPromo: (code: string) => Promise<{ success: boolean; discount?: number; error?: string }>;
  removePromo: () => void;
  setUserLocation: (location: { lat: number; lng: number } | null) => void;
}

interface CartContextType {
  cart: Cart;
  itemCount: number;
  addItem: (item: MenuItem, quantity?: number, options?: CartItemOptions) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  applyPromo: (code: string) => Promise<{ success: boolean; discount?: number; error?: string }>;
  removePromo: () => void;
}

const defaultCart: Cart = {
  items: [],
  subtotal: 0,
  deliveryFee: 150, // Default delivery fee in KES
  discount: 0,
  total: 0,
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'speedy_bites_cart';
const DELIVERY_FEE = 150;
const FREE_DELIVERY_THRESHOLD = 1000;

// Restaurant location in Nakuru (Q447+CF Nakuru)
const RESTAURANT_LOCATION = { lat: -0.2831, lng: 36.0664 };
const MIN_DELIVERY_FEE = 50;
const MAX_DELIVERY_FEE = 100;
const FEE_PER_KM = 15;

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const deg2rad = (deg: number) => deg * (Math.PI / 180);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [cart, setCart] = useState<Cart>(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return defaultCart;
      }
    }
    return defaultCart;
  });

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const calculateTotals = useCallback((items: CartItem[], discount = 0, promoCode?: string, location?: { lat: number; lng: number } | null): Cart => {
    const subtotal = items.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);

    let deliveryFee = DELIVERY_FEE;

    const loc = location || userLocation;
    if (loc && loc.lat && loc.lng) {
      const distance = calculateDistance(RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lng, loc.lat, loc.lng);
      // Base fee + per km charge, clamped between 50 and 100
      deliveryFee = Math.min(MAX_DELIVERY_FEE, Math.max(MIN_DELIVERY_FEE, Math.round(distance * FEE_PER_KM)));
    } else if (subtotal >= FREE_DELIVERY_THRESHOLD) {
      deliveryFee = 0;
    }

    const total = Math.max(0, subtotal + deliveryFee - discount);

    return {
      items,
      subtotal,
      deliveryFee,
      discount,
      total,
      promoCode: promoCode || (cart ? cart.promoCode : undefined),
    };
  }, [cart?.promoCode, userLocation]);

  const addItem = useCallback((item: MenuItem, quantity = 1, options?: CartItemOptions) => {
    setCart(prev => {
      // Check if item with same options already exists
      const existingIndex = prev.items.findIndex(
        cartItem => cartItem.menuItem.id === item.id &&
          JSON.stringify(cartItem.options) === JSON.stringify(options)
      );

      let newItems: CartItem[];

      if (existingIndex >= 0) {
        // Update quantity of existing item
        newItems = prev.items.map((cartItem, idx) =>
          idx === existingIndex
            ? {
              ...cartItem,
              quantity: cartItem.quantity + quantity,
              totalPrice: (cartItem.quantity + quantity) * item.price,
            }
            : cartItem
        );
      } else {
        // Add new item to cart
        newItems = [
          ...prev.items,
          {
            id: `${item.id}-${Date.now()}`,
            menuItem: item,
            quantity,
            totalPrice: item.price * quantity,
            options,
          },
        ];
      }

      return calculateTotals(newItems, prev.discount, prev.promoCode);
    });
  }, [calculateTotals]);

  const removeItem = useCallback((cartItemId: string) => {
    setCart(prev => {
      const newItems = prev.items.filter(item => item.id !== cartItemId);
      return calculateTotals(newItems, prev.discount, prev.promoCode);
    });
  }, [calculateTotals]);

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartItemId);
      return;
    }

    setCart(prev => {
      const newItems = prev.items.map(item => {
        if (item.id === cartItemId) {
          const newQuantity = Math.max(0, quantity);
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: item.menuItem.price * newQuantity,
          };
        }
        return item;
      });
      return calculateTotals(newItems, prev.discount, prev.promoCode);
    });
  }, [calculateTotals, removeItem]);

  const clearCart = useCallback(() => {
    setCart(defaultCart);
  }, []);

  const applyPromo = useCallback(async (code: string): Promise<{ success: boolean; discount?: number; error?: string }> => {
    try {
      // Call API to validate and apply promo code
      const result = await api.validatePromoCode(code, cart.subtotal);

      setCart(prev => {
        const newCart = calculateTotals(prev.items, result.discountAmount || 0, code);
        return newCart;
      });

      return { success: true, discount: result.discountAmount || 0 };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid promo code',
      };
    }
  }, [calculateTotals, cart.subtotal]);

  const removePromo = useCallback(() => {
    setCart(prev => calculateTotals(prev.items, 0, undefined));
  }, [calculateTotals]);

  const itemCount = cart.items.length;

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        applyPromo,
        removePromo,
        setUserLocation,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
