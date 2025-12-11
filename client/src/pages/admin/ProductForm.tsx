/**
 * Admin Product Form Page
 * 
 * Page for creating and editing products.
 * Features:
 * - Create/Edit mode
 * - Data fetching for edit mode
 * - Form submission handling
 * - Error handling
 * 
 * @route /admin/products/new
 * @route /admin/products/:id
 */

import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { ProductForm } from '@/components/admin/products/ProductForm';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/admin/api';
import { SEO } from '@/components/SEO';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminProductFormPage() {
  const [, params] = useRoute('/admin/products/:id');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = params?.id && params.id !== 'new';
  const productId = params?.id;

  // Fetch product data if in edit mode
  const {
    data: product,
    isLoading: isLoadingProduct,
    error: fetchError,
  } = useQuery({
    queryKey: ['admin', 'product', productId],
    queryFn: async () => {
      const data = await adminApi.products.getProduct(productId!);
      console.log('[DEBUG] Fetched Product Data:', data);
      return data;
    },
    enabled: !!isEditMode,
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminApi.products.getCategories(),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: adminApi.products.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast({
        title: "Product created",
        description: "The product has been successfully created.",
      });
      navigate('/admin/products');
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create product.",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminApi.products.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'product', productId] });
      toast({
        title: "Product updated",
        description: "The product has been successfully updated.",
      });
      navigate('/admin/products');
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update product.",
      });
    },
  });

  // Create Category mutation
  const createCategoryMutation = useMutation({
    mutationFn: adminApi.products.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      toast({
        title: "Category created",
        description: "New category has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create category.",
      });
    },
  });

  // Handle form submission
  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // 1. Handle Color Images Upload
      const processedColorImages: Record<string, string[]> = {};
      const fileToUrlMap = new Map<File, string>();

      if (data.colorImages) {
        console.log('[DEBUG] Processing colorImages:', data.colorImages);
        for (const [color, images] of Object.entries(data.colorImages)) {
          const processedImages: string[] = [];

          // Cast to array to iterate
          const imageArray = Array.isArray(images) ? images : [];
          console.log(`[DEBUG] Processing ${color} images:`, imageArray);

          for (let i = 0; i < imageArray.length; i++) {
            const img = imageArray[i];
            console.log(`[DEBUG] Processing image ${i} for ${color}:`, img instanceof File ? 'File' : typeof img, img);

            // Skip null/undefined images
            if (!img) {
              console.warn(`[DEBUG] Skipping null/undefined image at index ${i} for ${color}`);
              continue;
            }

            if (img instanceof File) {
              // Check if already uploaded
              let url = fileToUrlMap.get(img);
              if (!url) {
                try {
                  console.log(`[DEBUG] Uploading File for ${color}:`, img.name);
                  const uploaded = await adminApi.upload.uploadImage(img);
                  url = uploaded.url;
                  console.log(`[DEBUG] Upload successful for ${color}:`, url);
                  fileToUrlMap.set(img, url);
                } catch (uploadError) {
                  console.error(`[DEBUG] Upload failed for ${color}:`, uploadError);
                  throw uploadError;
                }
              }
              processedImages.push(url);
            } else if (typeof img === 'string' && img.trim()) {
              console.log(`[DEBUG] Using existing URL for ${color}:`, img);
              processedImages.push(img);
            } else {
              console.warn(`[DEBUG] Invalid image type for ${color}:`, typeof img, img);
            }
          }

          console.log(`[DEBUG] Processed ${color} images:`, processedImages);
          processedColorImages[color] = processedImages;
        }
      }

      // 2. Handle Main Image - user must explicitly select this
      let processedMainImage = data.mainImage;
      if (data.mainImage instanceof File) {
        const existingUrl = fileToUrlMap.get(data.mainImage);
        if (existingUrl) {
          processedMainImage = existingUrl;
        } else {
          const uploaded = await adminApi.upload.uploadImage(data.mainImage);
          processedMainImage = uploaded.url;
        }
      }
      console.log('[DEBUG] Main Image:', processedMainImage);

      // Transform frontend camelCase to backend snake_case
      const payload = {
        ...data,
        sale_price: data.salePrice ? String(data.salePrice) : null,
        low_stock_threshold: data.lowStockThreshold ? Number(data.lowStockThreshold) : 10,
        fabric_quality: data.fabricQuality,
        fabric: data.fabric,
        wash_care: data.washCare,
        category_id: data.categoryId,
        color_images: processedColorImages,
        main_image: processedMainImage,
        // New Attributes Mapping
        brand: data.brand || null,
        imported_from: data.importedFrom || null,
        is_imported: data.isImported,
        is_signature: data.isSignature,
        gsm: data.gsm ? Number(data.gsm) : null,
        weave: data.weave,
        occasion: data.occasion,
        pattern: data.pattern,
        fit: data.fit,
        sale_start_at: data.saleStartAt ? new Date(data.saleStartAt).toISOString() : null,
        sale_end_at: data.saleEndAt ? new Date(data.saleEndAt).toISOString() : null,
        signature_details: data.signatureDetails,
      };

      // Remove camelCase versions to avoid conflicts and Zod errors
      delete payload.salePrice;
      delete payload.lowStockThreshold;
      delete payload.fabricQuality;
      delete payload.washCare;
      delete payload.categoryId;
      delete payload.colorImages;
      delete payload.mainImage;
      delete payload.isImported;
      delete payload.isSignature;
      delete payload.importedFrom;
      delete payload.saleStartAt;
      delete payload.saleEndAt;

      console.log('[DEBUG] ProductForm Payload:', {
        fabric_quality: payload.fabric_quality,
        fabric: payload.fabric,
        wash_care: payload.wash_care,
        category_id: payload.category_id,
        sale_price: payload.sale_price,
        low_stock_threshold: payload.low_stock_threshold,
        color_images: payload.color_images,
        main_image: payload.main_image,
        brand: payload.brand,
        imported_from: payload.imported_from,
        is_imported: payload.is_imported,
        is_signature: payload.is_signature,
        sale_start_at: payload.sale_start_at,
        sale_end_at: payload.sale_end_at,
        variants: payload.variants,
        isEditMode,
        productId
      });
      console.log('[DEBUG] Full Payload Keys:', Object.keys(payload));

      if (isEditMode && productId) {
        updateMutation.mutate({ id: productId, data: payload });
      } else {
        createMutation.mutate(payload);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Failed to process images or save product.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle loading state
  if (isEditMode && isLoadingProduct) {
    return (
      <AdminLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </AdminLayout>
    );
  }

  // Handle error state
  if (isEditMode && fetchError) {
    return (
      <AdminLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-red-400">Failed to load product</p>
          <Button onClick={() => navigate('/admin/products')}>
            Go Back
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <SEO
        title={`${isEditMode ? 'Edit' : 'New'} Product - Admin Panel`}
        description="Create or edit a product"
        noIndex
      />

      <div className="mx-auto max-w-5xl">
        <ProductForm
          initialData={product}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/admin/products')}
          loading={createMutation.isPending || updateMutation.isPending || isSubmitting}
          categories={categories || []}
          onCreateCategory={async (name, parentId) => {
            await createCategoryMutation.mutateAsync({ name, parentId });
          }}
        />
      </div>
    </AdminLayout>
  );
}
