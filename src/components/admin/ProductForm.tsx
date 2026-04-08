import React, { useEffect, useRef, useState } from 'react';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { getImageURL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface ProductFormProps {
  product?: any;
  categories: any[];
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  categories,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    category_id: product?.category_id || '',
    preparation_time: product?.preparation_time || '',
    is_featured: product?.is_featured || false,
    is_available: product?.is_available ?? true,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(product?.image_url || '');
  const [secondaryImageFile, setSecondaryImageFile] = useState<File | null>(null);
  const [secondaryImagePreview, setSecondaryImagePreview] = useState<string>(product?.secondary_image_url || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const secondaryFileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      previewUrlsRef.current = [];
    };
  }, []);

  const revokePreviewUrl = (url: string) => {
    if (!url.startsWith('blob:')) return;
    URL.revokeObjectURL(url);
    previewUrlsRef.current = previewUrlsRef.current.filter((item) => item !== url);
  };

  const registerPreviewUrl = (url: string) => {
    previewUrlsRef.current.push(url);
    return url;
  };

  const optimizeImageFile = async (file: File) => {
    const MAX_DIMENSION = 1600;
    const TARGET_TYPE = file.type === 'image/png' ? 'image/png' : 'image/webp';
    const QUALITY = TARGET_TYPE === 'image/png' ? undefined : 0.8;

    if (!file.type.startsWith('image/')) {
      return file;
    }

    const imageUrl = URL.createObjectURL(file);

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageUrl;
      });

      const { naturalWidth, naturalHeight } = image;
      if (!naturalWidth || !naturalHeight) {
        return file;
      }

      const scale = Math.min(1, MAX_DIMENSION / Math.max(naturalWidth, naturalHeight));
      const width = Math.max(1, Math.round(naturalWidth * scale));
      const height = Math.max(1, Math.round(naturalHeight * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) {
        return file;
      }

      context.drawImage(image, 0, 0, width, height);

      const optimizedBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, TARGET_TYPE, QUALITY);
      });

      if (!optimizedBlob) {
        return file;
      }

      const extension = TARGET_TYPE === 'image/png' ? 'png' : 'webp';
      const baseName = file.name.replace(/\.[^.]+$/, '');

      return new File([optimizedBlob], `${baseName}.${extension}`, {
        type: TARGET_TYPE,
        lastModified: Date.now(),
      });
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Please use JPEG, PNG, WebP, or GIF');
        return;
      }

      void (async () => {
        try {
          const optimizedFile = await optimizeImageFile(file);
          const previewUrl = registerPreviewUrl(URL.createObjectURL(optimizedFile));

          revokePreviewUrl(imagePreview);
          setImageFile(optimizedFile);
          setImagePreview(previewUrl);

          if (optimizedFile.size < file.size) {
            const savedKb = Math.round((file.size - optimizedFile.size) / 1024);
            if (savedKb > 0) {
              toast.success(`Image optimized. Saved about ${savedKb}KB.`);
            }
          }
        } catch (error) {
          console.error('Failed to optimize image:', error);
          const previewUrl = registerPreviewUrl(URL.createObjectURL(file));
          revokePreviewUrl(imagePreview);
          setImageFile(file);
          setImagePreview(previewUrl);
        }
      })();
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSecondaryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Secondary image must be less than 5MB');
        return;
      }

      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid secondary image type. Use JPEG, PNG, WebP, or GIF');
        return;
      }

      void (async () => {
        try {
          const optimizedFile = await optimizeImageFile(file);
          const previewUrl = registerPreviewUrl(URL.createObjectURL(optimizedFile));

          revokePreviewUrl(secondaryImagePreview);
          setSecondaryImageFile(optimizedFile);
          setSecondaryImagePreview(previewUrl);

          if (optimizedFile.size < file.size) {
            const savedKb = Math.round((file.size - optimizedFile.size) / 1024);
            if (savedKb > 0) {
              toast.success(`Secondary image optimized. Saved about ${savedKb}KB.`);
            }
          }
        } catch (error) {
          console.error('Failed to optimize secondary image:', error);
          const previewUrl = registerPreviewUrl(URL.createObjectURL(file));
          revokePreviewUrl(secondaryImagePreview);
          setSecondaryImageFile(file);
          setSecondaryImagePreview(previewUrl);
        }
      })();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.price || !formData.category_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    setUploading(true);
    try {
      const submitFormData = new FormData();
      submitFormData.append('name', formData.name);
      submitFormData.append('description', formData.description);
      submitFormData.append('price', formData.price);
      submitFormData.append('category_id', formData.category_id);
      submitFormData.append('preparation_time', formData.preparation_time);
      submitFormData.append('is_featured', String(formData.is_featured));
      submitFormData.append('is_available', String(formData.is_available));

      if (imageFile) {
        submitFormData.append('image', imageFile);
      }
      if (secondaryImageFile) {
        submitFormData.append('secondary_image', secondaryImageFile);
      }

      await onSubmit(submitFormData);
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to save product');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{product ? 'Edit Product' : 'Add New Product'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload Section */}
          <div className="space-y-3">
            <Label>Product Image</Label>
            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary transition-colors">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img 
                    src={getImageURL(imagePreview)} 
                    alt="Preview" 
                    className="h-48 w-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      revokePreviewUrl(imagePreview);
                      setImagePreview('');
                      setImageFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center cursor-pointer py-12"
                >
                  <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-700">Click to upload or drag image</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP or GIF (max 5MB)</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={uploading}
              />
            </div>
            <p className="text-xs text-gray-500">
              Images will be automatically optimized and converted to WebP/JPEG formats
            </p>
          </div>
          <div className="space-y-3">
            <Label>Secondary Hover Image</Label>
            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary transition-colors">
              {secondaryImagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={getImageURL(secondaryImagePreview)}
                    alt="Secondary preview"
                    className="h-48 w-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      revokePreviewUrl(secondaryImagePreview);
                      setSecondaryImagePreview('');
                      setSecondaryImageFile(null);
                      if (secondaryFileInputRef.current) secondaryFileInputRef.current.value = '';
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => secondaryFileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center cursor-pointer py-12"
                >
                  <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-700">Upload secondary image for hover reveal</p>
                  <p className="text-xs text-gray-500 mt-1">Optional, max 5MB</p>
                </div>
              )}
              <input
                ref={secondaryFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleSecondaryImageChange}
                className="hidden"
                disabled={uploading}
              />
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Chapati Chicken"
                className="mt-1"
                disabled={uploading}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your product..."
                className="mt-1"
                rows={3}
                disabled={uploading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (KES) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                  disabled={uploading}
                />
              </div>

              <div>
                <Label htmlFor="preparation_time">Prep Time (mins)</Label>
                <Input
                  id="preparation_time"
                  type="number"
                  value={formData.preparation_time}
                  onChange={(e) => handleInputChange('preparation_time', e.target.value)}
                  placeholder="10"
                  className="mt-1"
                  disabled={uploading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                value={formData.category_id}
                onChange={(e) => handleInputChange('category_id', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={uploading}
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                  disabled={uploading}
                />
                <span className="text-sm">Featured Product</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={(e) => handleInputChange('is_available', e.target.checked)}
                  disabled={uploading}
                />
                <span className="text-sm">Available</span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploading}
              className="gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {product ? 'Update Product' : 'Add Product'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProductForm;
