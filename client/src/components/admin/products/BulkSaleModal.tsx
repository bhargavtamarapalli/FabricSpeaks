
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/admin/api';
import { Loader2 } from 'lucide-react';

interface Category {
    id: string;
    name: string;
}

interface BulkSaleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: Category[];
    selectedProductIds: string[];
    onSuccess: () => void;
}

export function BulkSaleModal({ open, onOpenChange, categories, selectedProductIds, onSuccess }: BulkSaleModalProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Form State
    const [targetType, setTargetType] = useState<'selection' | 'category'>('category');
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
    const [discountValue, setDiscountValue] = useState<string>('20');

    const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>('');

    const handleSubmit = async (action: 'apply' | 'remove') => {
        // Validation
        if (targetType === 'category' && !selectedCategory) {
            toast({ title: "Error", description: "Please select a category", variant: "destructive" });
            return;
        }
        if (targetType === 'selection' && selectedProductIds.length === 0) {
            toast({ title: "Error", description: "No products selected", variant: "destructive" });
            return;
        }
        if (action === 'apply' && (!discountValue || Number(discountValue) <= 0)) {
            toast({ title: "Error", description: "Please enter a valid discount value", variant: "destructive" });
            return;
        }

        try {
            setLoading(true);
            const payload: any = {
                targetType,
                action,
                discountParam: {
                    type: discountType,
                    value: Number(discountValue)
                }
            };

            if (targetType === 'category') {
                payload.categoryId = selectedCategory;
            } else {
                payload.targetIds = selectedProductIds;
            }

            if (action === 'apply') {
                payload.dates = {
                    start: startDate ? new Date(startDate).toISOString() : undefined,
                    end: endDate ? new Date(endDate).toISOString() : undefined
                };
            }

            // We need to implement this API call in adminApi first, but for now we'll call fetch directly or extend the api object later.
            // Assuming adminApi.products.bulkSale exists or we make a raw call.
            // Let's make a raw fetch call for now to ensure it works then refactor into api lib if needed.
            const response = await fetch('/api/admin/products/bulk-sale', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Auth header is handled by browser cookie usually or interceptor. 
                    // Since we are in frontend code, we hope the auth mechanism works standardly.
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to update bulk sale');
            }

            const result = await response.json();

            toast({
                title: action === 'apply' ? "Sale Applied" : "Sale Removed",
                description: result.message || `Successfully updated ${result.updatedCount} products.`,
            });

            onSuccess();
            onOpenChange(false);

        } catch (error: any) {
            console.error('Bulk Sale Error:', error);
            toast({
                title: "Error",
                description: error.message || "Something went wrong",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Bulk Sale Management</DialogTitle>
                    <DialogDescription>
                        Apply discounts to multiple products at once.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Target Selection */}
                    <div className="space-y-2">
                        <Label>Target Scope</Label>
                        <RadioGroup
                            value={targetType}
                            onValueChange={(v: any) => setTargetType(v)}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="category" id="r-category" />
                                <Label htmlFor="r-category">By Category</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="selection" id="r-selection" />
                                <Label htmlFor="r-selection">Selected Items ({selectedProductIds.length})</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {targetType === 'category' && (
                        <div className="space-y-2">
                            <Label>Select Category</Label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a category..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="border-t pt-4"></div>

                    {/* Discount Configuration */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Discount Type</Label>
                            <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percent">Percentage Off (%)</SelectItem>
                                    <SelectItem value="fixed">Fixed Amount Off (Rs)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Value</Label>
                            <Input
                                type="number"
                                value={discountValue}
                                onChange={(e) => setDiscountValue(e.target.value)}
                                placeholder={discountType === 'percent' ? "20" : "500"}
                            />
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Date (Optional)</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date (Optional)</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => handleSubmit('remove')} disabled={loading} className="mr-auto text-destructive border-destructive hover:bg-destructive/10">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove Sale"}
                    </Button>
                    <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={() => handleSubmit('apply')} disabled={loading}>
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Apply Sale
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
