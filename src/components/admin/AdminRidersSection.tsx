import { useState, useEffect } from 'react';
import { Phone, Star, Package, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface Rider {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: 'available' | 'busy' | 'offline';
  currentOrder?: string;
  completedToday: number;
  rating: number;
  avatar?: string;
}

const statusColors: Record<Rider['status'], string> = {
  available: 'bg-green-100 text-green-700',
  busy: 'bg-yellow-100 text-yellow-700',
  offline: 'bg-gray-100 text-gray-700',
};

export const AdminRidersSection = () => {
  const [riders, setRiders] = useState<any[]>([]);
  const [newRider, setNewRider] = useState({ name: '', email: '', phone: '', password: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [ordersByRider, setOrdersByRider] = useState<any[]>([]);
  const [ordersDialogOpen, setOrdersDialogOpen] = useState(false);
  const [selectedRiderName, setSelectedRiderName] = useState<string | null>(null);
  const [freeDeliveryEnabled, setFreeDeliveryEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem('free_delivery_enabled') === 'true'; } catch { return false; }
  });

  useEffect(() => {
    (async () => {
      try {
        // Try fetching riders from backend if endpoint exists
        const resp: any = await (api as any).getRiders?.().catch(() => null);
        if (resp && Array.isArray(resp)) setRiders(resp);
        // Fetch global free delivery setting from server if available
        try {
          const s: any = await (api as any).getFreeDeliverySetting?.().catch(() => null);
          if (s && typeof s.enabled === 'boolean') {
            setFreeDeliveryEnabled(Boolean(s.enabled));
            try { localStorage.setItem('free_delivery_enabled', s.enabled ? 'true' : 'false'); } catch {}
          }
        } catch (e) {
          // ignore
        }
      } catch (err) {
        // ignore - keep empty state
      }
    })();
  }, []);

  const handleAddRider = async () => {
    if (!newRider.email || !newRider.name) {
      toast.error('Name and email are required');
      return;
    }
    setIsCreating(true);
    try {
      const resp: any = await (api as any).createRider({ ...newRider });
      if (resp && resp.rider) {
        setRiders(prev => [resp.rider, ...prev]);
        toast.success(`Rider ${resp.rider.name} created`);
        if (resp.password) {
          setCreatedPassword(resp.password);
          setIsPasswordDialogOpen(true);
        }
        setNewRider({ name: '', email: '', phone: '', password: '' });
      }
    } catch (err) {
      console.error('Failed to create rider', err);
      toast.error('Failed to create rider');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteRider = (id: string) => {
    setPendingDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteRider = async () => {
    if (!pendingDeleteId) return;
    try {
      await (api as any).deleteRider(pendingDeleteId);
      setRiders(prev => prev.filter(r => r.id !== pendingDeleteId));
      toast.success('Rider removed');
    } catch (err) {
      console.error('Failed to delete rider', err);
      toast.error('Failed to remove rider');
    } finally {
      setDeleteDialogOpen(false);
      setPendingDeleteId(null);
    }
  };

  const toggleRiderStatus = (riderId: string) => {
    setRiders(prev => prev.map(rider => {
      if (rider.id === riderId) {
        const newStatus = rider.status === 'offline' ? 'available' : 'offline';
        toast.success(`${rider.name} is now ${newStatus}`);
        return { ...rider, status: newStatus };
      }
      return rider;
    }));
  };

  const availableCount = riders.filter(r => r.status === 'available').length;
  const busyCount = riders.filter(r => r.status === 'busy').length;

  // Fetch admin orders and filter by rider when requested
  const fetchOrdersForRider = async (riderId: string) => {
    try {
      const all = await (api as any).getAdminOrders?.();
      if (all && Array.isArray(all)) {
        // Try several fields that might reference rider assignment
        const filtered = all.filter((o: any) => (
          (o.driver && o.driver.id === riderId) ||
          o.rider_id === riderId ||
          o.assigned_rider_id === riderId ||
          (o.driver && o.driver.name && o.driver.name.toLowerCase().includes((riders.find(r => r.id === riderId)?.name || '').toLowerCase()))
        ));
        setOrdersByRider(filtered);
      } else {
        setOrdersByRider([]);
      }
    } catch (err) {
      console.error('Failed to fetch admin orders', err);
      setOrdersByRider([]);
    }
  };

  const openOrdersDialog = async (riderId: string, riderName: string) => {
    setSelectedRiderName(riderName);
    await fetchOrdersForRider(riderId);
    setOrdersDialogOpen(true);
  };

  const toggleFreeDelivery = (enabled: boolean) => {
    (async () => {
      try {
        const resp: any = await (api as any).setFreeDeliverySetting?.(enabled).catch(() => null);
        if (resp && typeof resp.enabled === 'boolean') {
          setFreeDeliveryEnabled(Boolean(resp.enabled));
          try { localStorage.setItem('free_delivery_enabled', resp.enabled ? 'true' : 'false'); } catch {}
          toast.success(resp.enabled ? 'Free delivery enabled' : 'Free delivery disabled');
          return;
        }
      } catch (err) {
        console.error('Failed to update free delivery setting', err);
      }
      // Fallback to local toggle if API not available
      try { localStorage.setItem('free_delivery_enabled', enabled ? 'true' : 'false'); } catch {}
      setFreeDeliveryEnabled(enabled);
      toast.success(enabled ? 'Free delivery enabled (local)' : 'Free delivery disabled (local)');
    })();
  };

  return (
    <div className="space-y-6">
      {/* Add rider form */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label>Name</Label>
              <Input value={newRider.name} onChange={(e) => setNewRider(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={newRider.email} onChange={(e) => setNewRider(prev => ({ ...prev, email: e.target.value }))} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={newRider.phone} onChange={(e) => setNewRider(prev => ({ ...prev, phone: e.target.value }))} />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={newRider.password} onChange={(e) => setNewRider(prev => ({ ...prev, password: e.target.value }))} placeholder="Optional custom password" />
            </div>
          </div>
          <div className="mt-3">
            <Button onClick={handleAddRider} disabled={isCreating} size="sm">{isCreating ? 'Adding...' : 'Add Rider'}</Button>
          </div>
        </CardContent>
      </Card>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{availableCount}</p>
            <p className="text-sm text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{busyCount}</p>
            <p className="text-sm text-muted-foreground">Busy</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{riders.length}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin controls */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <h4 className="font-semibold">Platform Delivery Settings</h4>
            <p className="text-sm text-muted-foreground">Enable free delivery for all orders</p>
          </div>
          <div className="flex items-center gap-4">
            <Switch checked={freeDeliveryEnabled} onCheckedChange={(v) => toggleFreeDelivery(Boolean(v))} />
          </div>
        </CardContent>
      </Card>

      {/* Riders List */}
      <div className="space-y-3">
        {riders.map((rider) => (
          <Card key={rider.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {rider.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{rider.name}</h3>
                      <Badge className={statusColors[rider.status]}>
                        {rider.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <Phone className="h-3 w-3" />
                      {rider.phone}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 text-yellow-500" />
                        {rider.rating}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Package className="h-4 w-4" />
                        {rider.completedToday} today
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {rider.status === 'busy' && rider.currentOrder && (
                    <Badge variant="outline" className="bg-blue-50">
                      <MapPin className="h-3 w-3 mr-1" />
                      On delivery
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleRiderStatus(rider.id)}
                    disabled={rider.status === 'busy'}
                  >
                    {rider.status === 'offline' ? 'Set Available' : 'Set Offline'}
                  </Button>
                  <Button size="sm" onClick={() => openOrdersDialog(rider.id, rider.name)}>View Orders</Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteRider(rider.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders dialog per rider */}
      <Dialog open={ordersDialogOpen} onOpenChange={setOrdersDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Orders by {selectedRiderName}</DialogTitle>
            <DialogDescription>Shows orders assigned to this rider and total delivery fees collected.</DialogDescription>
          </DialogHeader>
          <div className="mt-3 space-y-3 max-h-80 overflow-auto">
            {ordersByRider.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders found for this rider.</p>
            ) : (
              ordersByRider.map(o => (
                <div key={o.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{o.order_number || o.id}</p>
                    <p className="text-sm text-muted-foreground">{o.status} • {o.created_at || o.createdAt ? new Date(o.created_at || o.createdAt).toLocaleString() : new Date(Date.now()).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{o.delivery_fee != null ? `KES ${o.delivery_fee}` : o.deliveryFee ? `KES ${o.deliveryFee}` : 'KES 0'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Total Orders: {ordersByRider.length}</div>
            <div className="font-semibold">Total Delivery Fees: KES {ordersByRider.reduce((sum, o) => sum + (Number(o.delivery_fee ?? o.deliveryFee ?? 0) || 0), 0)}</div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password dialog shown after creating a rider */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rider Created</DialogTitle>
            <DialogDescription>Save this password and share it with the rider.</DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <p className="font-mono bg-muted p-2 rounded">{createdPassword}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsPasswordDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Rider</DialogTitle>
            <DialogDescription>This action cannot be undone. Are you sure?</DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setPendingDeleteId(null); }}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteRider}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
