import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, MapPin, Home, Briefcase, MoreVertical, Trash2, Edit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  phone: string | null;
  instructions: string | null;
  is_default: boolean;
}

export const AddressesPage = () => {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: 'Home', street: '', city: 'Nakuru', phone: '', instructions: '' });

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getAddresses();
        setAddresses(data || []);
      } catch (err) {
        console.error('Failed to load addresses', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleAddAddress = async () => {
    if (!newAddress.street) {
      toast.error('Please enter a street address');
      return;
    }
    setIsSaving(true);
    try {
      const addr = await api.addAddress({
        ...newAddress,
        is_default: addresses.length === 0,
      });
      setAddresses(prev => [...prev, addr]);
      setNewAddress({ label: 'Home', street: '', city: 'Nakuru', phone: '', instructions: '' });
      setIsDialogOpen(false);
      toast.success('Address added successfully');
    } catch (err) {
      toast.error('Failed to add address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteAddress(id);
      setAddresses(prev => prev.filter(a => a.id !== id));
      toast.success('Address deleted');
    } catch (err) {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.updateAddress(id, { is_default: true });
      setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })));
      toast.success('Default address updated');
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const getIcon = (label: string) => {
    const l = label?.toLowerCase() || '';
    if (l.includes('home')) return Home;
    if (l.includes('work') || l.includes('office')) return Briefcase;
    return MapPin;
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Saved Addresses</h1>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost">
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle>Add New Address</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  value={newAddress.label}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g., Home, Office"
                />
              </div>
              <div className="space-y-2">
                <Label>Street Address</Label>
                <Input
                  value={newAddress.street}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, street: e.target.value }))}
                  placeholder="Nakuru Nyahururu Highway"
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={newAddress.city}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Nakuru"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone (optional)</Label>
                <Input
                  type="tel"
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="0712 345 678"
                />
              </div>
              <div className="space-y-2">
                <Label>Delivery Instructions (optional)</Label>
                <Input
                  value={newAddress.instructions}
                  onChange={(e) => setNewAddress(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Ring the bell, gate code 1234"
                />
              </div>
              <Button onClick={handleAddAddress} className="w-full" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Address
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <main className="px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MapPin className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No addresses saved</h3>
            <p className="text-muted-foreground mb-6">Add your delivery addresses for faster checkout</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => {
              const Icon = getIcon(addr.label);
              return (
                <div
                  key={addr.id}
                  className={cn(
                    'flex items-start gap-4 rounded-xl border p-4 transition-colors',
                    addr.is_default && 'border-primary bg-primary/5'
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{addr.label}</h3>
                      {addr.is_default && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{addr.street}</p>
                    <p className="text-xs text-muted-foreground">{addr.city}</p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 -mr-2">
                        <MoreVertical className="h-5 w-5 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!addr.is_default && (
                        <DropdownMenuItem onClick={() => handleSetDefault(addr.id)}>
                          <MapPin className="h-4 w-4 mr-2" />
                          Set as Default
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(addr.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default AddressesPage;
