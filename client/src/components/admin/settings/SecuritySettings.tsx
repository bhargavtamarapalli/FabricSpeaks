/**
 * Security Settings Component
 * 
 * Form for configuring account security.
 * Features:
 * - Password update
 * - Two-factor authentication (2FA) toggle
 * - Session management
 * 
 * @example
 * <SecuritySettings onUpdatePassword={handleUpdatePassword} />
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Shield, Key, Smartphone, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/admin/utils';

// Validation Schema
const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type PasswordData = z.infer<typeof passwordSchema>;

export interface SecuritySettingsProps {
    /** Password update handler */
    onUpdatePassword: (data: PasswordData) => Promise<void>;

    /** 2FA toggle handler */
    onToggle2FA: (enabled: boolean) => Promise<void>;

    /** Current 2FA status */
    is2FAEnabled?: boolean;

    /** Loading state */
    loading?: boolean;

    /** Additional CSS classes */
    className?: string;
}

export function SecuritySettings({
    onUpdatePassword,
    onToggle2FA,
    is2FAEnabled = false,
    loading = false,
    className,
}: SecuritySettingsProps) {
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(is2FAEnabled);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<PasswordData>({
        resolver: zodResolver(passwordSchema),
    });

    const handlePasswordSubmit = async (data: PasswordData) => {
        await onUpdatePassword(data);
        reset();
    };

    const handle2FAToggle = async (checked: boolean) => {
        setTwoFactorEnabled(checked);
        await onToggle2FA(checked);
    };

    return (
        <div className={cn('space-y-8', className)}>
            {/* Change Password */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-medium text-white">
                    <Key className="h-5 w-5 text-indigo-400" />
                    <h3>Change Password</h3>
                </div>
                <form onSubmit={handleSubmit(handlePasswordSubmit)} className="space-y-4 max-w-md">
                    <div className="space-y-2">
                        <Label>Current Password</Label>
                        <Input
                            type="password"
                            {...register('currentPassword')}
                            className="border-slate-700 bg-slate-800 text-white"
                        />
                        {errors.currentPassword && (
                            <p className="text-xs text-red-400">{errors.currentPassword.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label>New Password</Label>
                        <Input
                            type="password"
                            {...register('newPassword')}
                            className="border-slate-700 bg-slate-800 text-white"
                        />
                        {errors.newPassword && (
                            <p className="text-xs text-red-400">{errors.newPassword.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label>Confirm New Password</Label>
                        <Input
                            type="password"
                            {...register('confirmPassword')}
                            className="border-slate-700 bg-slate-800 text-white"
                        />
                        {errors.confirmPassword && (
                            <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
                        )}
                    </div>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        Update Password
                    </Button>
                </form>
            </div>

            <Separator className="bg-slate-800" />

            {/* Two-Factor Authentication */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-medium text-white">
                    <Shield className="h-5 w-5 text-green-400" />
                    <h3>Two-Factor Authentication</h3>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
                            <Smartphone className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                            <p className="font-medium text-white">Authenticator App</p>
                            <p className="text-sm text-slate-400">
                                Use an app like Google Authenticator to generate verification codes.
                            </p>
                        </div>
                    </div>
                    <Switch
                        checked={twoFactorEnabled}
                        onCheckedChange={handle2FAToggle}
                        className="data-[state=checked]:bg-indigo-500"
                    />
                </div>
            </div>

            <Separator className="bg-slate-800" />

            {/* Active Sessions */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-medium text-white">
                    <LogOut className="h-5 w-5 text-red-400" />
                    <h3>Active Sessions</h3>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/50">
                    <div className="flex items-center justify-between p-4">
                        <div>
                            <p className="font-medium text-white">Windows PC - Chrome</p>
                            <p className="text-xs text-slate-400">Mumbai, India • Active now</p>
                        </div>
                        <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                            Current Session
                        </Button>
                    </div>
                    <Separator className="bg-slate-800" />
                    <div className="flex items-center justify-between p-4">
                        <div>
                            <p className="font-medium text-white">iPhone 13 - Safari</p>
                            <p className="text-xs text-slate-400">Mumbai, India • 2 hours ago</p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-400/10 hover:text-red-300">
                            Revoke
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
