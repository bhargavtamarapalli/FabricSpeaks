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
                <div className="flex items-center gap-2 text-lg font-medium text-white">
                    <Store className="h-5 w-5 text-indigo-400" />
                    <h3>Store Profile</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Store Name</Label>
                        <Input
                            {...register('storeName')}
                            className="border-slate-700 bg-slate-800 text-white"
                        />
                        {errors.storeName && (
                            <p className="text-xs text-red-400">{errors.storeName.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label>Store Email</Label>
                        <Input
                            {...register('storeEmail')}
                            className="border-slate-700 bg-slate-800 text-white"
                        />
                        {errors.storeEmail && (
                            <p className="text-xs text-red-400">{errors.storeEmail.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label>Support Phone</Label>
                        <Input
                            {...register('storePhone')}
                            className="border-slate-700 bg-slate-800 text-white"
                        />
                    </div>
                </div>
            </div>

            <Separator className="bg-slate-800" />

            {/* Localization */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-medium text-white">
                    <Globe className="h-5 w-5 text-pink-400" />
                    <h3>Localization</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select defaultValue={defaultValues?.currency || 'INR'}>
                            <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                                <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent className="border-slate-700 bg-slate-800 text-white">
                                <SelectItem value="INR">Indian Rupee (INR)</SelectItem>
                                <SelectItem value="USD">US Dollar (USD)</SelectItem>
                                <SelectItem value="EUR">Euro (EUR)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Select defaultValue={defaultValues?.timezone || 'Asia/Kolkata'}>
                            <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                                <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent className="border-slate-700 bg-slate-800 text-white">
                                <SelectItem value="Asia/Kolkata">India Standard Time (IST)</SelectItem>
                                <SelectItem value="UTC">Coordinated Universal Time (UTC)</SelectItem>
                                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <Separator className="bg-slate-800" />

            {/* Address */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-medium text-white">
                    <MapPin className="h-5 w-5 text-green-400" />
                    <h3>Business Address</h3>
                </div>
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <Label>Address Line 1</Label>
                        <Input
                            {...register('address.line1')}
                            className="border-slate-700 bg-slate-800 text-white"
                        />
                        {errors.address?.line1 && (
                            <p className="text-xs text-red-400">{errors.address.line1.message}</p>
                        )}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>City</Label>
                            <Input
                                {...register('address.city')}
                                className="border-slate-700 bg-slate-800 text-white"
                            />
                            {errors.address?.city && (
                                <p className="text-xs text-red-400">{errors.address.city.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>State / Province</Label>
                            <Input
                                {...register('address.state')}
                                className="border-slate-700 bg-slate-800 text-white"
                            />
                            {errors.address?.state && (
                                <p className="text-xs text-red-400">{errors.address.state.message}</p>
                            )}
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Postal Code</Label>
                            <Input
                                {...register('address.postalCode')}
                                className="border-slate-700 bg-slate-800 text-white"
                            />
                            {errors.address?.postalCode && (
                                <p className="text-xs text-red-400">{errors.address.postalCode.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Country</Label>
                            <Input
                                {...register('address.country')}
                                className="border-slate-700 bg-slate-800 text-white"
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
                    className="bg-indigo-600 hover:bg-indigo-700"
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </form>
    );
}
