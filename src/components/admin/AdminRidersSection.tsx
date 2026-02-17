import { useState, useEffect } from 'react';
import { Phone, Star, Package, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { Rider } from '@/data/mockData';

const statusColors: Record<Rider['status'], string> = {
  available: 'bg-green-100 text-green-700',
  busy: 'bg-yellow-100 text-yellow-700',
  offline: 'bg-gray-100 text-gray-700',
};

export const AdminRidersSection = () => {
  const [riders, setRiders] = useState<any[]>([]);
  const [newRider, setNewRider] = useState({ name: '', email: '', phone: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Try fetching riders from backend if endpoint exists
        const resp: any = await (api as any).getRiders?.().catch(() => null);
        if (resp && Array.isArray(resp)) setRiders(resp);
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
        setNewRider({ name: '', email: '', phone: '' });
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
