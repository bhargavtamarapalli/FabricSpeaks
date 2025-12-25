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
                <div className="flex items-center gap-2 text-lg font-bold text-foreground">
                    <Key className="h-5 w-5 text-primary" />
                    <h3>Change Password</h3>
                </div>
                <form onSubmit={handleSubmit(handlePasswordSubmit)} className="space-y-4 max-w-md">
                    <div className="space-y-2">
                        <Label className="font-bold">Current Password</Label>
                        <Input
                            type="password"
                            {...register('currentPassword')}
                            className="border-border bg-background text-foreground"
                        />
                        {errors.currentPassword && (
                            <p className="text-xs text-red-400">{errors.currentPassword.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label className="font-bold">New Password</Label>
                        <Input
                            type="password"
                            {...register('newPassword')}
                            className="border-border bg-background text-foreground"
                        />
                        {errors.newPassword && (
                            <p className="text-xs text-red-400">{errors.newPassword.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label className="font-bold">Confirm New Password</Label>
                        <Input
                            type="password"
                            {...register('confirmPassword')}
                            className="border-border bg-background text-foreground"
                        />
                        {errors.confirmPassword && (
                            <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
                        )}
                    </div>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm"
                    >
                        Update Password
                    </Button>
                </form>
            </div>

            <Separator className="bg-border" />

            {/* Two-Factor Authentication */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-bold text-foreground">
                    <Shield className="h-5 w-5 text-primary" />
                    <h3>Two-Factor Authentication</h3>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background border border-border">
                            <Smartphone className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-bold text-foreground">Authenticator App</p>
                            <p className="text-sm text-muted-foreground">
                                Use an app like Google Authenticator to generate verification codes.
                            </p>
                        </div>
                    </div>
                    <Switch
                        checked={twoFactorEnabled}
                        onCheckedChange={handle2FAToggle}
                        className="data-[state=checked]:bg-primary"
                    />
                </div>
            </div>

            <Separator className="bg-border" />

            {/* Active Sessions */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-bold text-foreground">
                    <LogOut className="h-5 w-5 text-primary" />
                    <h3>Active Sessions</h3>
                </div>
                <div className="rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center justify-between p-4">
                        <div>
                            <p className="font-bold text-foreground">Windows PC - Chrome</p>
                            <p className="text-xs text-muted-foreground">Mumbai, India • Active now</p>
                        </div>
                        <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:bg-muted hover:text-foreground">
                            Current Session
                        </Button>
                    </div>
                    <Separator className="bg-border" />
                    <div className="flex items-center justify-between p-4">
                        <div>
                            <p className="font-bold text-foreground">iPhone 13 - Safari</p>
                            <p className="text-xs text-muted-foreground">Mumbai, India • 2 hours ago</p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                            Revoke
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
