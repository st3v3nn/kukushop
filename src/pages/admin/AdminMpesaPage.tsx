import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AdminMpesaPage = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [callbacks, setCallbacks] = useState<any[]>([]);
  const [requestLimit, setRequestLimit] = useState<number | 'all'>(10);
  const [callbackLimit, setCallbackLimit] = useState<number | 'all'>(10);

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

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>MPesa STK Requests</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Show:</span>
            <Select value={String(requestLimit)} onValueChange={(val) => setRequestLimit(val === 'all' ? 'all' : Number(val))}>
              <SelectTrigger className="w-[80px] h-8">
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
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Order</th>
                  <th>CheckoutRequestID</th>
                  <th>Amount</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {requests.slice(0, requestLimit === 'all' ? undefined : requestLimit).map(r => (
                  <tr key={r.id}>
                    <td className="p-2">{r.id.slice(0, 8)}</td>
                    <td className="p-2">{r.order_id || '-'}</td>
                    <td className="p-2">{r.checkout_request_id || r.merchant_request_id}</td>
                    <td className="p-2">{r.amount}</td>
                    <td className="p-2">{r.phone}</td>
                    <td className="p-2">{r.status}</td>
                    <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>MPesa Callbacks</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Show:</span>
            <Select value={String(callbackLimit)} onValueChange={(val) => setCallbackLimit(val === 'all' ? 'all' : Number(val))}>
              <SelectTrigger className="w-[80px] h-8">
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
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>CheckoutRequestID</th>
                  <th>Result</th>
                  <th>Receipt</th>
                  <th>Amount</th>
                  <th>Phone</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {callbacks.slice(0, callbackLimit === 'all' ? undefined : callbackLimit).map(c => (
                  <tr key={c.id}>
                    <td className="p-2">{c.id.slice(0, 8)}</td>
                    <td className="p-2">{c.checkout_request_id || c.merchant_request_id}</td>
                    <td className="p-2">{c.result_code} - {c.result_desc}</td>
                    <td className="p-2">{c.mpesa_receipt_number || '-'}</td>
                    <td className="p-2">{c.amount || '-'}</td>
                    <td className="p-2">{c.phone || '-'}</td>
                    <td className="p-2">{new Date(c.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMpesaPage;
