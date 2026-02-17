import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Upload, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { toast } from 'sonner';

// Helper to get API base URL (relative for production, absolute for dev)
const getAPIBaseURL = () => import.meta.env.VITE_API_URL || '/api';

// Helper to construct image URLs - handles both dev (different ports) and production (same origin)
const getImageURL = (path: string) => {
  if (path.startsWith('http')) return path;
  
  const apiBase = getAPIBaseURL();
  
  // If API base is absolute (dev mode with hardcoded backend), use same origin for images
  if (apiBase.startsWith('http')) {
    const url = new URL(apiBase);
    // Extract the origin (e.g., http://localhost:4000)
    return `${url.origin}${path}`;
  }
  
  // If API base is relative (production Docker same-origin), use relative path for images
  return path;
};

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  category_id: string;
  image_url: string;
  is_featured: boolean;
  is_available: boolean;
  preparation_time: number;
}

interface MenuCategory {
  id: string;
  name: string;
  description: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
}

export const AdminMenuSection = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    preparation_time: '',
    is_featured: false,
    is_available: true,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const apiBase = getAPIBaseURL();
      const [itemsRes, catsRes] = await Promise.all([
        fetch(`${apiBase}/admin/products`),
        fetch(`${apiBase}/categories`),
      ]);

      if (itemsRes.ok) {
        const items = await itemsRes.json();
        setMenuItems(items);
      }
      if (catsRes.ok) {
        const cats = await catsRes.json();
        setCategories(cats);
      }
    } catch (error) {
      console.error('Failed to load menu data:', error);
      toast.error('Failed to load menu data');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category_id: '',
      preparation_time: '',
      is_featured: false,
      is_available: true,
    });
    setSelectedImage(null);
    setImagePreview('');
    setDialogOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category_id: item.category_id,
      preparation_time: item.preparation_time.toString(),
      is_featured: item.is_featured,
      is_available: item.is_available,
    });
    setImagePreview(item.image_url);
    setSelectedImage(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.category_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('description', formData.description);
      fd.append('price', formData.price);
      fd.append('category_id', formData.category_id);
      fd.append('preparation_time', formData.preparation_time || '15');
      fd.append('is_featured', String(formData.is_featured));
      fd.append('is_available', String(formData.is_available));

      if (selectedImage) {
        fd.append('image', selectedImage);
      }

      const apiBase = getAPIBaseURL();
      const url = editingItem
        ? `${apiBase}/admin/products/${editingItem.id}`
        : `${apiBase}/admin/products`;

      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        body: fd,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save product');
      }

      toast.success(editingItem ? 'Product updated' : 'Product created');
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save product');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;

    try {
      const apiBase = getAPIBaseURL();
      const response = await fetch(`${apiBase}/admin/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      toast.success('Product deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Menu Items ({menuItems.length})</h2>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Menu Items Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item) => (
          <Card key={item.id} className={!item.is_available ? 'opacity-60' : ''}>
            <CardContent className="p-4">
              <div className="aspect-video bg-muted rounded-lg mb-3 overflow-hidden">
                {item.image_url ? (
                  <img 
                    src={getImageURL(item.image_url)}
                    alt={item.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      console.error('Image failed to load:', item.image_url);
                      (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3C/svg%3E';
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">No image</div>
                )}
              </div>
              
              <h3 className="font-semibold text-sm mb-1">{item.name}</h3>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
              
              <div className="flex items-center justify-between mb-3">
                <PriceDisplay price={Number(item.price)} size="sm" />
                <span className="text-xs bg-muted px-2 py-1 rounded">
                  {item.preparation_time}min
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(item)}
                  className="flex-1"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(item.id)}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Product Image</Label>
              <div className="relative aspect-square rounded-lg border-2 border-dashed bg-muted/50 overflow-hidden">
                {imagePreview ? (
                  <>
                    <img 
                      src={getImageURL(imagePreview)}
                      alt="Preview" 
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        console.error('Preview image failed to load:', imagePreview);
                        (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3C/svg%3E';
                      }}
                    />
                    <button
                      onClick={() => {
                        setImagePreview('');
                        setSelectedImage(null);
                      }}
                      className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <label className="flex h-full items-center justify-center cursor-pointer hover:bg-muted/70 transition-colors">
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Click to upload</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                placeholder="Product name"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                placeholder="Product description"
                rows={2}
              />
            </div>

            {/* Price & Category */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (KES) *</Label>
                <Input 
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(f => ({ ...f, price: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={formData.category_id} 
                  onValueChange={(v) => setFormData(f => ({ ...f, category_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Prep Time */}
            <div className="space-y-2">
              <Label htmlFor="prep">Preparation Time (mins)</Label>
              <Input 
                id="prep"
                type="number"
                min="1"
                value={formData.preparation_time}
                onChange={(e) => setFormData(f => ({ ...f, preparation_time: e.target.value }))}
                placeholder="15"
              />
            </div>

            {/* Toggles */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Available</Label>
                <Switch 
                  checked={formData.is_available}
                  onCheckedChange={(v) => setFormData(f => ({ ...f, is_available: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Featured</Label>
                <Switch 
                  checked={formData.is_featured}
                  onCheckedChange={(v) => setFormData(f => ({ ...f, is_featured: v }))}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={uploading}
                className="flex-1"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingItem ? 'Update' : 'Create'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
