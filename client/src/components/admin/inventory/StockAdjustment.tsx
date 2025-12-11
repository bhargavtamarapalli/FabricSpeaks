/**
 * Stock Adjustment Component
 * 
 * Dialog for adjusting stock levels with reason tracking.
 * Features:
 * - Add/Remove stock
 * - Reason selection
 * - Note input
 * - Validation
 * 
 * @example
 * <StockAdjustment
 *   product={product}
 *   variant={variant}
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   onSave={handleSave}
 * />
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { STOCK_ADJUSTMENT_REASONS } from '@/lib/admin/constants';
import { Loader2, Minus, Plus } from 'lucide-react';
import type { InventoryItem } from '@/types/admin';

// Validation Schema
const adjustmentSchema = z.object({
    type: z.enum(['add', 'remove']),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    reason: z.string().min(1, 'Reason is required'),
    note: z.string().optional(),
});

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

export interface StockAdjustmentProps {
    /** Target inventory item */
    item: InventoryItem;

    /** Dialog open state */
    isOpen: boolean;

    /** Close handler */
    onClose: () => void;

    /** Save handler */
    onSave: (data: AdjustmentFormData) => Promise<void>;

    /** Loading state */
    loading?: boolean;
}

export function StockAdjustment({
    item,
    isOpen,
    onClose,
    onSave,
    loading = false,
}: StockAdjustmentProps) {
    const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = useForm<AdjustmentFormData>({
        resolver: zodResolver(adjustmentSchema),
        defaultValues: {
            type: 'add',
            quantity: 1,
            reason: '',
            note: '',
        },
    });

    // Handle type change
    const handleTypeChange = (type: 'add' | 'remove') => {
        setAdjustmentType(type);
        setValue('type', type);
    };

    // Handle form submission
    const onSubmit = async (data: AdjustmentFormData) => {
        await onSave(data);
        reset();
        onClose();
    };

    // Current stock display
    const currentStock = item.stockQuantity;
    const itemName = item.variant
        ? `${item.product.name} (${item.variant.size} / ${item.variant.color})`
        : item.product.name;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="border-slate-800 bg-slate-900 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Adjust Stock Level</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Update inventory for <span className="font-medium text-white">{itemName}</span>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
                    {/* Current Stock Display */}
                    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 p-4">
                        <span className="text-sm text-slate-400">Current Stock</span>
                        <span className="text-xl font-bold text-white">{currentStock}</span>
                    </div>

                    {/* Adjustment Type */}
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            type="button"
                            variant={adjustmentType === 'add' ? 'default' : 'outline'}
                            onClick={() => handleTypeChange('add')}
                            className={adjustmentType === 'add'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'border-slate-700 hover:bg-slate-800'
                            }
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Stock
                        </Button>
                        <Button
                            type="button"
                            variant={adjustmentType === 'remove' ? 'default' : 'outline'}
                            onClick={() => handleTypeChange('remove')}
                            className={adjustmentType === 'remove'
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'border-slate-700 hover:bg-slate-800'
                            }
                        >
                            <Minus className="mr-2 h-4 w-4" />
                            Remove Stock
                        </Button>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                            type="number"
                            min="1"
                            {...register('quantity', { valueAsNumber: true })}
                            className="border-slate-700 bg-slate-800 text-white"
                        />
                        {errors.quantity && (
                            <p className="text-xs text-red-400">{errors.quantity.message}</p>
                        )}
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label>Reason</Label>
                        <Select onValueChange={(val) => setValue('reason', val)}>
                            <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                                <SelectValue placeholder="Select reason" />
                            </SelectTrigger>
                            <SelectContent className="border-slate-700 bg-slate-800 text-white">
                                {STOCK_ADJUSTMENT_REASONS.map((reason) => (
                                    <SelectItem key={reason.value} value={reason.value}>
                                        {reason.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.reason && (
                            <p className="text-xs text-red-400">{errors.reason.message}</p>
                        )}
                    </div>

                    {/* Note */}
                    <div className="space-y-2">
                        <Label>Note (Optional)</Label>
                        <Textarea
                            {...register('note')}
                            className="border-slate-700 bg-slate-800 text-white"
                            placeholder="Additional details..."
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="text-slate-400 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Update Stock'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
