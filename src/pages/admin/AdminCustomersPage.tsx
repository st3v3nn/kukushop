import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminCustomersSection } from '@/components/admin/AdminCustomersSection';

const AdminCustomersPage = () => {
  return (
    <AdminLayout title="Customers">
      <AdminCustomersSection />
    </AdminLayout>
  );
};

export default AdminCustomersPage;
