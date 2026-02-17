import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { CartItemCard } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { EmptyCart } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/components/ui/PriceDisplay';

export const CartPage = () => {
  const navigate = useNavigate();
  const { cart, itemCount, clearCart } = useCart();

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-background lg:min-h-0 lg:bg-transparent">
        <Header title="Your Cart" showBack showCart={false} />
        <EmptyCart onBrowse={() => navigate('/menu')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 lg:min-h-0 lg:bg-transparent lg:pb-0">
      <Header title="Your Cart" showBack showCart={false} />

      <main className="px-4 py-4">
        {/* Item count & clear */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-muted-foreground">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </p>
          <button
            onClick={clearCart}
            className="text-sm font-medium text-destructive"
          >
            Clear Cart
          </button>
        </div>

        {/* Cart Items */}
        <div className="space-y-3 mb-6">
          {cart.items.map(item => (
            <CartItemCard key={item.id} item={item} />
          ))}
        </div>

        {/* Promo Code */}
        <div className="mb-6 rounded-xl bg-card p-4 shadow-card">
          <h3 className="font-semibold mb-3">Have a promo code?</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter code"
              className="flex-1 rounded-lg border bg-background px-4 py-2 text-sm"
            />
            <Button variant="secondary" size="sm">
              Apply
            </Button>
          </div>
          {cart.promoCode && (
            <p className="mt-2 text-sm text-success">
              Promo "{cart.promoCode}" applied! You save {formatPrice(cart.discount)}
            </p>
          )}
        </div>

        {/* Summary */}
        <div className="rounded-xl bg-card p-4 shadow-card">
          <h3 className="font-semibold mb-4">Order Summary</h3>
          <CartSummary />
        </div>
      </main>

      {/* Checkout Button */}
      <div className="fixed bottom-20 left-0 right-0 z-40 bg-gradient-to-t from-background via-background to-transparent px-4 pb-4 pt-6 xl:bottom-0 safe-bottom">
        <Button
          onClick={() => navigate('/checkout')}
          className="w-full h-14 text-base font-semibold gap-2"
          size="lg"
        >
          <ShoppingBag className="h-5 w-5" />
          Checkout • {formatPrice(cart.total)}
        </Button>
      </div>
    </div>
  );
};

export default CartPage;
