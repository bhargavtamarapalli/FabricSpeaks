import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Shield, Save, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useMe, useUpdateMe } from '@/hooks/useProfile';
import { SEO } from '@/components/SEO';
import { api } from '@/lib/api';

export default function AdminProfile() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { data: user, isLoading } = useMe();
    const updateMe = useUpdateMe();
    const [activeTab, setActiveTab] = useState('profile');

    // Password state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Update password mutation
    const updatePasswordMutation = useMutation({
        mutationFn: async (data: any) => {
            return api.post('/api/auth/update-password', {
                password: data.newPassword
            });
        },
        onSuccess: () => {
            toast({
                title: "Password updated",
                description: "Your password has been changed successfully.",
            });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to update password.",
            });
        }
    });

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const updates = {
            full_name: formData.get('full_name') as string,
            email: formData.get('email') as string,
            phone: formData.get('phone') as string,
        };

        try {
            await updateMe.mutateAsync(updates);
            toast({
                title: "Profile updated",
                description: "Your profile information has been saved.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to update profile.",
            });
        }
    };

    const handlePasswordUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast({
                variant: "destructive",
                title: "Passwords do not match",
                description: "New password and confirmation must match.",
            });
            return;
        }
        if (passwordData.newPassword.length < 8) {
            toast({
                variant: "destructive",
                title: "Weak password",
                description: "Password must be at least 8 characters long.",
            });
            return;
        }
        updatePasswordMutation.mutate(passwordData);
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-[50vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <SEO
                title="My Profile - Admin Panel"
                description="Manage your admin profile"
                noIndex
            />

            <div className="space-y-6 max-w-4xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold text-white">My Profile</h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Manage your personal information and security settings.
                    </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="border-slate-800 bg-slate-900/50">
                        <TabsTrigger
                            value="profile"
                            className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
                        >
                            <User className="mr-2 h-4 w-4" />
                            Profile Details
                        </TabsTrigger>
                        <TabsTrigger
                            value="security"
                            className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white"
                        >
                            <Shield className="mr-2 h-4 w-4" />
                            Security
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile">
                        <Card className="border-slate-800 bg-slate-900/50">
                            <CardHeader>
                                <CardTitle className="text-white">Personal Information</CardTitle>
                                <CardDescription className="text-slate-400">
                                    Update your personal details.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleProfileUpdate} className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="username" className="text-slate-300">Username</Label>
                                        <Input
                                            id="username"
                                            value={user?.username || ''}
                                            disabled
                                            className="bg-slate-950 border-slate-800 text-slate-500"
                                        />
                                        <p className="text-xs text-slate-500">Username cannot be changed.</p>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="full_name" className="text-slate-300">Full Name</Label>
                                        <Input
                                            id="full_name"
                                            name="full_name"
                                            defaultValue={(user as any)?.full_name || ''}
                                            className="bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="email" className="text-slate-300">Email</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            defaultValue={(user as any)?.email || ''}
                                            className="bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="phone" className="text-slate-300">Phone</Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            defaultValue={user?.phone || ''}
                                            className="bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
                                        />
                                    </div>

                                    <div className="pt-4">
                                        <Button
                                            type="submit"
                                            disabled={updateMe.isPending}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                        >
                                            {updateMe.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Changes
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security">
                        <Card className="border-slate-800 bg-slate-900/50">
                            <CardHeader>
                                <CardTitle className="text-white">Change Password</CardTitle>
                                <CardDescription className="text-slate-400">
                                    Ensure your account is using a long, random password to stay secure.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="newPassword" className="text-slate-300">New Password</Label>
                                        <Input
                                            id="newPassword"
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
                                            placeholder="Min. 8 characters"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password</Label>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="bg-slate-950 border-slate-800 text-white focus:border-indigo-500"
                                            placeholder="Re-enter new password"
                                        />
                                    </div>

                                    <div className="pt-4">
                                        <Button
                                            type="submit"
                                            disabled={updatePasswordMutation.isPending}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                        >
                                            {updatePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            <Shield className="mr-2 h-4 w-4" />
                                            Update Password
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    );
}
