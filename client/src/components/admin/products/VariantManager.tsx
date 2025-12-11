/**
 * Variant Manager Component
 * 
 * Component for managing product variants (size, color, stock).
 * Features:
 * - Add/Remove variants
 * - Edit variant details
 * - Stock management
 * - Validation
 * - Responsive design
 * 
 * @example
 * <VariantManager
 *   variants={variants}
 *   onChange={handleVariantsChange}
 * />
 */

import { useState } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/admin/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface Variant {
  id?: string;
  size: string;
  color: string;
  stock: number;
  sku?: string;
  price?: number;
  images?: string[]; // Kept for compatibility but not used here
}

export interface VariantManagerProps {
  /** Current variants */
  value?: Variant[];

  /** Change handler */
  onChange?: (variants: Variant[]) => void;

  /** Disabled state */
  disabled?: boolean;

  /** Error message */
  error?: string;

  /** Additional CSS classes */
  className?: string;
}

// Common sizes and colors
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'];
const COLORS = [
  { label: 'Black', value: 'Black', hex: '#000000' },
  { label: 'White', value: 'White', hex: '#FFFFFF' },
  { label: 'Red', value: 'Red', hex: '#FF0000' },
  { label: 'Blue', value: 'Blue', hex: '#0000FF' },
  { label: 'Green', value: 'Green', hex: '#008000' },
  { label: 'Yellow', value: 'Yellow', hex: '#FFFF00' },
  { label: 'Pink', value: 'Pink', hex: '#FFC0CB' },
  { label: 'Purple', value: 'Purple', hex: '#800080' },
  { label: 'Grey', value: 'Grey', hex: '#808080' },
  { label: 'Beige', value: 'Beige', hex: '#F5F5DC' },
  { label: 'Brown', value: 'Brown', hex: '#A52A2A' },
  { label: 'Navy', value: 'Navy', hex: '#000080' },
  { label: 'Maroon', value: 'Maroon', hex: '#800000' },
  { label: 'Orange', value: 'Orange', hex: '#FFA500' },
  { label: 'Teal', value: 'Teal', hex: '#008080' },
  { label: 'Gold', value: 'Gold', hex: '#FFD700' },
  { label: 'Silver', value: 'Silver', hex: '#C0C0C0' },
  { label: 'Multi', value: 'Multi', hex: 'linear-gradient(45deg, red, blue)' },
];

export function VariantManager({
  value = [],
  onChange,
  disabled = false,
  error,
  className,
}: VariantManagerProps) {

  // Add new variant
  const addVariant = () => {
    const newVariant: Variant = {
      size: '',
      color: '',
      stock: 0,
      sku: '',
      images: [],
    };
    onChange?.([...value, newVariant]);
  };

  // Remove variant
  const removeVariant = (index: number) => {
    const newVariants = [...value];
    newVariants.splice(index, 1);
    onChange?.(newVariants);
  };

  // Update variant
  const updateVariant = (index: number, field: keyof Variant, val: any) => {
    const newVariants = [...value];
    newVariants[index] = { ...newVariants[index], [field]: val };
    onChange?.(newVariants);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium text-white">Product Variants</Label>
        <Button
          type="button"
          onClick={addVariant}
          disabled={disabled}
          variant="outline"
          size="sm"
          className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Variant
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Variants List */}
      <div className="space-y-3">
        {value.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/30 p-8 text-center">
            <p className="text-sm text-slate-400">
              No variants added yet. Click "Add Variant" to start.
            </p>
          </div>
        ) : (
          value.map((variant, index) => (
            <div
              key={index}
              className="relative rounded-lg border border-slate-800 bg-slate-900/50 p-4"
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Size */}
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">Size</Label>
                  <Select
                    value={variant.size}
                    onValueChange={(val) => updateVariant(index, 'size', val)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-9 border-slate-700 bg-slate-800 text-white">
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-700 bg-slate-800 text-white">
                      {SIZES.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">Color</Label>
                  <Select
                    value={variant.color}
                    onValueChange={(val) => updateVariant(index, 'color', val)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-9 border-slate-700 bg-slate-800 text-white">
                      <div className="flex items-center gap-2">
                        {variant.color && (
                          <div
                            className="h-3 w-3 rounded-full border border-slate-600"
                            style={{
                              background: COLORS.find((c) => c.value === variant.color)?.hex,
                            }}
                          />
                        )}
                        <SelectValue placeholder="Color" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="border-slate-700 bg-slate-800 text-white">
                      {COLORS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full border border-slate-600"
                              style={{ background: color.hex }}
                            />
                            {color.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Stock */}
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">Stock</Label>
                  <Input
                    type="number"
                    value={variant.stock}
                    onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                    disabled={disabled}
                    className="h-9 border-slate-700 bg-slate-800 text-white"
                  />
                </div>

                {/* SKU */}
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">SKU</Label>
                  <Input
                    value={variant.sku || ''}
                    onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                    disabled={disabled}
                    placeholder="Optional"
                    className="h-9 border-slate-700 bg-slate-800 text-white"
                  />
                </div>
              </div>

              {/* Remove Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeVariant(index)}
                disabled={disabled}
                className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
