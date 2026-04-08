import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';

interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export const AdminCustomersSection = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: '', name: '', phone: '' });
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');

  useEffect(() => {
    setSearchInput(searchParams.get('q') || '');
  }, [searchParams]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminCustomers();
      setCustomers(data || []);
    } catch (err) {
      console.error('Failed to fetch customers', err);
      toast.error('Failed to fetch customers from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleCreate = async () => {
    if (!form.email || !form.name) return toast.error('Name and email required');
    try {
      await api.createAdminCustomer(form);
      toast.success('Customer created');
      setForm({ email: '', name: '', phone: '' });
      fetchCustomers();
    } catch (err) {
      toast.error('Failed to create customer');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await api.deleteAdminCustomer(id);
      toast.success('Customer deleted');
      fetchCustomers();
    } catch (err) {
      toast.error('Failed to delete customer');
    }
  };

  const query = (searchParams.get('q') || '').trim().toLowerCase();
  const filteredCustomers = useMemo(() => {
    if (!query) return customers;
    return customers.filter((customer) => {
      return (
        (customer.name || '').toLowerCase().includes(query) ||
        (customer.email || '').toLowerCase().includes(query) ||
        (customer.phone || '').toLowerCase().includes(query)
      );
    });
  }, [customers, query]);

  const handleSearch = () => {
    const nextParams = new URLSearchParams(searchParams);
    const next = searchInput.trim();
    if (next) {
      nextParams.set('q', next);
    } else {
      nextParams.delete('q');
    }
    setSearchParams(nextParams);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Customers ({filteredCustomers.length})</h2>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          placeholder="Search customers by name, email, or phone..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleSearch();
            }
          }}
          className="sm:max-w-md"
        />
        <Button onClick={handleSearch} className="sm:w-auto">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>

          <div className="mt-4">
            <Button onClick={handleCreate}>Create Customer</Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">Loading customers...</CardContent>
        </Card>
      ) : filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">No customers found.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
        {filteredCustomers.map(c => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-sm text-muted-foreground">{c.email} {c.phone ? `• ${c.phone}` : ''}</div>
              </div>
              <div>
                <Button variant="destructive" onClick={() => handleDelete(c.id)}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
};
