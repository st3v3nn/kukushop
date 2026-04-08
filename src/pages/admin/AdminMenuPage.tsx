import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminProductsSection } from '@/components/admin/AdminProductsSection';
import { AdminCategoriesSection } from '@/components/admin/AdminCategoriesSection';

export const AdminMenuPage = () => {
  return (
    <AdminLayout title="Menu Management">
      <div className="max-w-7xl mx-auto">
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            <AdminProductsSection />
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <AdminCategoriesSection />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminMenuPage;
