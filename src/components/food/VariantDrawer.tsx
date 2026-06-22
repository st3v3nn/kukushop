import { useMemo, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { useCart } from '@/contexts/CartContext';
import { getMenuItemStartingPrice, getProductVariants, type MenuItem } from '@/lib/api';

interface VariantDrawerProps {
  item: MenuItem;
  isOpen: boolean;
  onClose: () => void;
}

export const VariantDrawer = ({ item, isOpen, onClose }: VariantDrawerProps) => {
  const { addItems } = useCart();
  const variants = useMemo(() => getProductVariants(item), [item]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const selections = variants
    .map((variant) => ({ variant: variant.name, quantity: quantities[variant.name] || 0 }))
    .filter((selection) => selection.quantity > 0);

  const total = variants.reduce(
    (sum, variant) => sum + variant.price * (quantities[variant.name] || 0),
    0,
  );

  const selectedCount = selections.reduce((sum, selection) => sum + selection.quantity, 0);

  const updateQuantity = (name: string, quantity: number) => {
    setQuantities((current) => ({
      ...current,
      [name]: Math.max(0, quantity),
    }));
  };

  const addToCart = () => {
    if (selections.length === 0) {
      toast.error('Choose at least one size');
      return;
    }

    addItems(item, selections);
    toast.success(`${item.name} added to cart!`);
    setQuantities({});
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{item.name}</DrawerTitle>
        </DrawerHeader>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto px-4 pb-2">
          {variants.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No sizes are available for this item. Starting price is <PriceDisplay price={getMenuItemStartingPrice(item)} size="sm" />.
            </div>
          ) : (
            variants.map((variant) => (
              <div
                key={variant.id}
                className="flex items-center justify-between gap-4 rounded-lg border bg-card p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{variant.name}</p>
                  <PriceDisplay price={variant.price} size="sm" />
                </div>
                <QuantitySelector
                  quantity={quantities[variant.name] || 0}
                  onIncrease={() => updateQuantity(variant.name, (quantities[variant.name] || 0) + 1)}
                  onDecrease={() => updateQuantity(variant.name, (quantities[variant.name] || 0) - 1)}
                  size="sm"
                />
              </div>
            ))
          )}
        </div>

        <DrawerFooter>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{selectedCount} selected</span>
            <span className="font-bold"><PriceDisplay price={total} size="sm" /></span>
          </div>
          <Button onClick={addToCart} disabled={selectedCount === 0} className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            Add to cart
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
