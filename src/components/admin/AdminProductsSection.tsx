import React, { useState, useEffect, useMemo } from 'react';
import { getImageURL, apiFetch } from '@/lib/api';
import { Trash2, Edit2, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { ProductForm } from './ProductForm';
import { Input } from '@/components/ui/input';
import { useSearchParams } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url: string;
  secondary_image_url?: string;
  is_featured: boolean;
  isFeatured?: boolean;
  is_available: boolean;
  isAvailable?: boolean;
  preparation_time: number;
}

interface ProductCategory {
  id: string;
  name: string;
}

export const AdminProductsSection = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');

  useEffect(() => {
    setSearchInput(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Product[]>('/admin/products');
      setProducts(data);
    } catch (error) {
      toast.error('Failed to load products');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await apiFetch<ProductCategory[]>('/admin/categories');
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const query = (searchParams.get('q') || '').trim().toLowerCase();
  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name || ''])),
    [categories]
  );
  const filteredProducts = useMemo(() => {
    if (!query) return products;

    return products.filter((product) => {
      const categoryName = categoryNameById.get(product.category_id) || '';
      return (
        product.name.toLowerCase().includes(query) ||
        (product.description || '').toLowerCase().includes(query) ||
        categoryName.toLowerCase().includes(query)
      );
    });
  }, [products, categoryNameById, query]);

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

  const handleSubmit = async (formData: FormData) => {
    try {
      const method = editingProduct ? 'PUT' : 'POST';
      await apiFetch(editingProduct
        ? `/admin/products/${editingProduct.id}`
        : '/admin/products', {
        method,
        body: formData,
      });

      toast.success(editingProduct ? 'Product updated!' : 'Product created!');
      setShowForm(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save product');
      throw error;
    }
  };

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) return;

    try {
      await apiFetch(`/admin/products/${productId}`, {
        method: 'DELETE',
      });

      toast.success('Product deleted');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
      console.error(error);
    }
  };

  if (showForm) {
    return (
      <div className="space-y-4">
        <ProductForm
          product={editingProduct}
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Products</h2>
        <Button
          onClick={() => setShowForm(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          placeholder="Search products by name, description, or category..."
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

      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Loading products...</p>
          </CardContent>
        </Card>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">No products yet. Create one to get started!</p>
          </CardContent>
        </Card>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">No products match this search.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(product => (
            <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative w-full h-48 overflow-hidden bg-gray-100">
                {product.image_url && (
                  <img
                    src={getImageURL(product.image_url)}
                    alt={product.name}
                  className="w-full h-48 object-cover"
                  />
                )}
              </div>
              <CardContent className="pt-4">
                <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                {product.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                )}

                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                  <div>
                    <span className="text-gray-500">Price:</span>
                    <p className="font-semibold">KES {parseFloat(String(product.price)).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <p className={`font-semibold ${product.is_available ? 'text-green-600' : 'text-red-600'}`}>
                      {product.is_available ? 'Available' : 'Unavailable'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingProduct(product);
                      setShowForm(true);
                    }}
                    className="flex-1 gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(product.id, product.name)}
                    className="flex-1 gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminProductsSection;
