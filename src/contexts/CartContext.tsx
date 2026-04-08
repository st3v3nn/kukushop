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
}

const defaultCart: Cart = {
  items: [],
  subtotal: 0,
  deliveryFee: 50, // Default delivery fee in KES (fixed)
  discount: 0,
  total: 0,
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'speedy_bites_cart';
const DELIVERY_FEE = 50; // fixed delivery fee in KES

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  const calculateTotals = useCallback((items: CartItem[], discount = 0, promoCode?: string): Cart => {
    const subtotal = items.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
    const deliveryFee = DELIVERY_FEE;

    const total = Math.max(0, subtotal + deliveryFee - discount);

    return {
      items,
      subtotal,
      deliveryFee,
      discount,
      total,
      promoCode: promoCode || (cart ? cart.promoCode : undefined),
    };
  }, [cart?.promoCode]);

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
