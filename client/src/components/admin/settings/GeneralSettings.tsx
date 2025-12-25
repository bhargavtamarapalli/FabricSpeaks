/**
 * General Settings Component
 * 
 * Form for configuring general store settings.
 * Features:
 * - Store profile (Name, Email, Phone)
 * - Localization (Currency, Timezone)
 * - Address configuration
 * 
 * @example
 * <GeneralSettings settings={settings} onSave={handleSave} />
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Store, Globe, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/admin/utils';

// Validation Schema
const generalSettingsSchema = z.object({
    storeName: z.string().min(1, 'Store name is required'),
    storeEmail: z.string().email('Invalid email address'),
    storePhone: z.string().optional(),
    currency: z.string(),
    timezone: z.string(),
    address: z.object({
        line1: z.string().min(1, 'Address is required'),
        city: z.string().min(1, 'City is required'),
        state: z.string().min(1, 'State is required'),
        postalCode: z.string().min(1, 'Postal code is required'),
        country: z.string().min(1, 'Country is required'),
    }),
});

export type GeneralSettingsData = z.infer<typeof generalSettingsSchema>;

export interface GeneralSettingsProps {
    /** Current settings */
    defaultValues?: Partial<GeneralSettingsData>;

    /** Save handler */
    onSave: (data: GeneralSettingsData) => Promise<void>;

    /** Loading state */
    loading?: boolean;

    /** Additional CSS classes */
    className?: string;
}

export function GeneralSettings({
    defaultValues,
    onSave,
    loading = false,
    className,
}: GeneralSettingsProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<GeneralSettingsData>({
        resolver: zodResolver(generalSettingsSchema),
        defaultValues: defaultValues || {
            storeName: 'Fabric Speaks',
            storeEmail: 'admin@fabricspeaks.com',
            currency: 'INR',
            timezone: 'Asia/Kolkata',
            address: {
                country: 'India',
            }
        },
    });

    return (
        <form onSubmit={handleSubmit(onSave)} className={cn('space-y-8', className)}>
            {/* Store Profile */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-bold text-foreground">
                    <Store className="h-5 w-5 text-primary" />
                    <h3>Store Profile</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="font-bold">Store Name</Label>
                        <Input
                            {...register('storeName')}
                            className="border-border bg-background text-foreground"
                        />
                        {errors.storeName && (
                            <p className="text-xs text-red-400">{errors.storeName.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label className="font-bold">Store Email</Label>
                        <Input
                            {...register('storeEmail')}
                            className="border-border bg-background text-foreground"
                        />
                        {errors.storeEmail && (
                            <p className="text-xs text-red-400">{errors.storeEmail.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label className="font-bold">Support Phone</Label>
                        <Input
                            {...register('storePhone')}
                            className="border-border bg-background text-foreground"
                        />
                    </div>
                </div>
            </div>

            <Separator className="bg-border" />

            {/* Localization */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-bold text-foreground">
                    <Globe className="h-5 w-5 text-primary" />
                    <h3>Localization</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="font-bold">Currency</Label>
                        <Select defaultValue={defaultValues?.currency || 'INR'}>
                            <SelectTrigger className="border-border bg-background text-foreground">
                                <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent className="border-border bg-background text-foreground">
                                <SelectItem value="INR">Indian Rupee (INR)</SelectItem>
                                <SelectItem value="USD">US Dollar (USD)</SelectItem>
                                <SelectItem value="EUR">Euro (EUR)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="font-bold">Timezone</Label>
                        <Select defaultValue={defaultValues?.timezone || 'Asia/Kolkata'}>
                            <SelectTrigger className="border-border bg-background text-foreground">
                                <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent className="border-border bg-background text-foreground">
                                <SelectItem value="Asia/Kolkata">India Standard Time (IST)</SelectItem>
                                <SelectItem value="UTC">Coordinated Universal Time (UTC)</SelectItem>
                                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <Separator className="bg-border" />

            {/* Address */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-bold text-foreground">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h3>Business Address</h3>
                </div>
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <Label className="font-bold">Address Line 1</Label>
                        <Input
                            {...register('address.line1')}
                            className="border-border bg-background text-foreground"
                        />
                        {errors.address?.line1 && (
                            <p className="text-xs text-red-400">{errors.address.line1.message}</p>
                        )}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="font-bold">City</Label>
                            <Input
                                {...register('address.city')}
                                className="border-border bg-background text-foreground"
                            />
                            {errors.address?.city && (
                                <p className="text-xs text-red-400">{errors.address.city.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">State / Province</Label>
                            <Input
                                {...register('address.state')}
                                className="border-border bg-background text-foreground"
                            />
                            {errors.address?.state && (
                                <p className="text-xs text-red-400">{errors.address.state.message}</p>
                            )}
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="font-bold">Postal Code</Label>
                            <Input
                                {...register('address.postalCode')}
                                className="border-border bg-background text-foreground"
                            />
                            {errors.address?.postalCode && (
                                <p className="text-xs text-red-400">{errors.address.postalCode.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">Country</Label>
                            <Input
                                {...register('address.country')}
                                className="border-border bg-background text-foreground"
                            />
                            {errors.address?.country && (
                                <p className="text-xs text-red-400">{errors.address.country.message}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button
                    type="submit"
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm"
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </form>
    );
}
