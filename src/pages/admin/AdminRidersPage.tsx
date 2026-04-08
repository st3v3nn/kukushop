import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminRidersSection } from '@/components/admin/AdminRidersSection';

const AdminRidersPage = () => {
  return (
    <AdminLayout title="Riders Management">
      <AdminRidersSection />
    </AdminLayout>
  );
};

export default AdminRidersPage;

