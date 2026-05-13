import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { apiFetch, api } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DollarSign, CheckCircle, Clock, AlertCircle, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { toast } from 'sonner';

const AdminMpesaContent = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [callbacks, setCallbacks] = useState<any[]>([]);
  const [requestLimit, setRequestLimit] = useState<number | 'all'>(10);
  const [callbackLimit, setCallbackLimit] = useState<number | 'all'>(10);
  const [isClearing, setIsClearing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const load = async () => {
    try {
      const r = await apiFetch<any[]>('/mpesa/requests');
      setRequests(r || []);
    } catch (err) {
      console.error('Failed to load mpesa requests', err);
    }
    try {
      const c = await apiFetch<any[]>('/mpesa/callbacks');
      setCallbacks(c || []);
    } catch (err) {
      console.error('Failed to load mpesa callbacks', err);
    }
  };

  const handleClearTransactions = async () => {
    if (!window.confirm('⚠️ Are you sure? This will permanently delete ALL M-Pesa transactions and cannot be undone.')) {
      return;
    }

    setIsClearing(true);
    try {
      await api.clearMpesaTransactionsAdmin();
      toast.success('All M-Pesa transactions cleared successfully');
      setRequests([]);
      setCallbacks([]);
    } catch (err) {
      console.error('Failed to clear transactions', err);
      toast.error('Failed to clear M-Pesa transactions');
    } finally {
      setIsClearing(false);
    }
  };

  const handleExportPayments = async () => {
    setIsExporting(true);
    try {
      const blob = await api.exportMpesaPayments();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mpesa_payments_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('M-Pesa payments exported successfully');
    } catch (err) {
      console.error('Failed to export payments', err);
      toast.error('Failed to export M-Pesa payments');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Calculate statistics
  const totalRequests = requests.length;
  const totalCallbacks = callbacks.length;
  const successfulTransactions = callbacks.filter(c => c.result_code === '0').length;
  const totalAmount = callbacks
    .filter(c => c.result_code === '0')
    .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const pendingRequests = requests.filter(r => r.status !== 'completed').length;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Requests</p>
                  <p className="text-2xl font-bold mt-1">{totalRequests}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Callbacks</p>
                  <p className="text-2xl font-bold mt-1">{totalCallbacks}</p>
                </div>
                <div className="p-3 bg-info/10 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Successful</p>
                  <p className="text-2xl font-bold mt-1 text-success">{successfulTransactions}</p>
                </div>
                <div className="p-3 bg-success/10 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold mt-1"><PriceDisplay price={totalAmount} /></p>
                </div>
                <div className="p-3 bg-accent/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              M-Pesa STK Requests
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Show:</span>
              <Select value={String(requestLimit)} onValueChange={(val) => setRequestLimit(val === 'all' ? 'all' : Number(val))}>
                <SelectTrigger className="w-[100px] h-9">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPayments}
                disabled={isExporting}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearTransactions}
                disabled={isClearing}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="px-4 py-3 text-left font-semibold">ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Order</th>
                  <th className="px-4 py-3 text-left font-semibold">Checkout ID</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {requests.slice(0, requestLimit === 'all' ? undefined : requestLimit).map((r, idx) => (
                  <tr key={r.id} className={`border-b transition-colors hover:bg-muted/30 ${idx % 2 === 0 ? '' : 'bg-muted/5'}`}>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-medium">{r.order_id || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs truncate max-w-[150px]">{r.checkout_request_id || r.merchant_request_id}</td>
                    <td className="px-4 py-3 text-right font-semibold"><PriceDisplay price={r.amount} /></td>
                    <td className="px-4 py-3 font-medium">{r.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        r.status === 'completed' ? 'bg-success/10 text-success' :
                        r.status === 'pending' ? 'bg-warning/10 text-warning' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {r.status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.created_at ? new Date(r.created_at).toLocaleDateString() + ' ' + new Date(r.created_at).toLocaleTimeString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {requests.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No requests found</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Callbacks Table */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gradient-to-r from-success/5 to-success/10 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              M-Pesa Callbacks
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Show:</span>
              <Select value={String(callbackLimit)} onValueChange={(val) => setCallbackLimit(val === 'all' ? 'all' : Number(val))}>
                <SelectTrigger className="w-[100px] h-9">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="px-4 py-3 text-left font-semibold">ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Checkout ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Result</th>
                  <th className="px-4 py-3 text-left font-semibold">Receipt</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">Phone</th>
                  <th className="px-4 py-3 text-left font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {callbacks.slice(0, callbackLimit === 'all' ? undefined : callbackLimit).map((c, idx) => (
                  <tr key={c.id} className={`border-b transition-colors hover:bg-muted/30 ${idx % 2 === 0 ? '' : 'bg-muted/5'}`}>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-mono text-xs truncate max-w-[150px]">{c.checkout_request_id || c.merchant_request_id}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        c.result_code === '0' ? 'bg-success/10 text-success' :
                        'bg-destructive/10 text-destructive'
                      }`}>
                        {c.result_code === '0' ? 'Success' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{c.mpesa_receipt_number || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold"><PriceDisplay price={c.amount} /></td>
                    <td className="px-4 py-3 font-medium">{c.phone || '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.created_at ? new Date(c.created_at).toLocaleDateString() + ' ' + new Date(c.created_at).toLocaleTimeString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {callbacks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No callbacks found</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AdminMpesaPage = () => {
  return (
    <AdminLayout title="Payments">
      <AdminMpesaContent />
    </AdminLayout>
  );
};

export default AdminMpesaPage;
