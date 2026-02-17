import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, CreditCard, Smartphone, MoreVertical, Trash2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface PaymentMethod {
  id: string;
  type: string;
  label: string;
  phone_number: string;
  is_default: boolean;
}

export const PaymentsPage = () => {
  const navigate = useNavigate();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getPaymentMethods();
        setMethods(data || []);
      } catch (err) {
        console.error('Failed to load payment methods', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleAddMethod = async () => {
    if (!newPhone || newPhone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    setIsSaving(true);
    try {
      const method = await api.addPaymentMethod({
        type: 'mpesa',
        label: 'M-Pesa',
        phone_number: newPhone,
      });
      setMethods(prev => [...prev, method]);
      setNewPhone('');
      setIsDialogOpen(false);
      toast.success('Payment method added');
    } catch (err) {
      toast.error('Failed to add payment method');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deletePaymentMethod(id);
      setMethods(prev => prev.filter(m => m.id !== id));
      toast.success('Payment method removed');
    } catch (err) {
      toast.error('Failed to remove');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.setDefaultPaymentMethod(id);
      setMethods(prev => prev.map(m => ({ ...m, is_default: m.id === id })));
      toast.success('Default payment method updated');
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const maskPhone = (phone: string) => {
    if (phone.length < 6) return phone;
    return `${phone.slice(0, 4)} *** ${phone.slice(-3)}`;
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Payment Methods</h1>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost">
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle>Add M-Pesa Number</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="0712 345 678"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                This number will be used for M-Pesa STK Push payments
              </p>
              <Button onClick={handleAddMethod} className="w-full" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add M-Pesa Number
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <main className="px-4 py-4">
        {/* M-Pesa Info */}
        <div className="mb-6 rounded-xl bg-green-500/10 border border-green-500/20 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-green-700 dark:text-green-400">M-Pesa Payments</h3>
              <p className="text-sm text-muted-foreground">Quick & secure mobile payments</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : methods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CreditCard className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No payment methods</h3>
            <p className="text-muted-foreground mb-6">Add your M-Pesa number for faster checkout</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add M-Pesa Number
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {methods.map((method) => (
              <div
                key={method.id}
                className={cn(
                  'flex items-center gap-4 rounded-xl border p-4 transition-colors',
                  method.is_default && 'border-primary bg-primary/5'
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                  <Smartphone className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{method.label}</h3>
                    {method.is_default && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{maskPhone(method.phone_number)}</p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 -mr-2">
                      <MoreVertical className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!method.is_default && (
                      <DropdownMenuItem onClick={() => handleSetDefault(method.id)}>
                        <Check className="h-4 w-4 mr-2" />
                        Set as Default
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(method.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PaymentsPage;
