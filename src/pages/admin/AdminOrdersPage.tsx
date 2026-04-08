import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminOrdersSection } from '@/components/admin/AdminOrdersSection';

const AdminOrdersPage = () => {
  return (
    <AdminLayout title="Orders Management">
      <AdminOrdersSection />
    </AdminLayout>
  );
};

export default AdminOrdersPage;

