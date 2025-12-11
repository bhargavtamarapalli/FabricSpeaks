import { useAuth } from '@/hooks/useAuth';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocation } from 'wouter';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function DebugAuth() {
    const { user, isLoading: authLoading, login, logout } = useAuth();
    const { isAdmin, isSuperAdmin, permissions, role, isLoading: adminLoading } = useAdminAuth();
    const [, navigate] = useLocation();
    const { toast } = useToast();

    // Login state
    const [loginEmail, setLoginEmail] = useState('bhargav1999.t@gmail.com');
    const [loginPassword, setLoginPassword] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Password reset state
    const [resetEmail, setResetEmail] = useState('bhargav1999.t@gmail.com');
    const [newPassword, setNewPassword] = useState('');
    const [isResetting, setIsResetting] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!loginEmail || !loginPassword) {
            toast({
                title: 'Validation Error',
                description: 'Please enter email and password',
                variant: 'destructive',
            });
            return;
        }

        setIsLoggingIn(true);
        try {
            await login(loginEmail, loginPassword);
            toast({
                title: 'Success',
                description: 'Login successful!',
            });
            setLoginPassword(''); // Clear password
        } catch (error: any) {
            toast({
                title: 'Login Failed',
                description: error.message || 'Invalid credentials',
                variant: 'destructive',
            });
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        toast({
            title: 'Logged Out',
            description: 'You have been logged out',
        });
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newPassword || newPassword.length < 6) {
            toast({
                title: 'Validation Error',
                description: 'Password must be at least 6 characters',
                variant: 'destructive',
            });
            return;
        }

        setIsResetting(true);
        try {
            const response = await fetch('/api/debug/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: resetEmail,
                    newPassword: newPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to reset password');
            }

            toast({
                title: 'Success',
                description: `Password reset successfully for ${data.email}. You can now login with the new password.`,
            });

            setNewPassword('');
            // Update login email to match reset email
            setLoginEmail(resetEmail);
        } catch (error: any) {
            toast({
                title: 'Reset Failed',
                description: error.message || 'Unknown error',
                variant: 'destructive',
            });
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold">Authentication Debug Panel</h1>

                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Auth State</h2>
                    <div className="space-y-2 font-mono text-sm">
                        <p><strong>Auth Loading:</strong> {authLoading ? 'Yes' : 'No'}</p>
                        <p><strong>Admin Loading:</strong> {adminLoading ? 'Yes' : 'No'}</p>
                        <p><strong>User Logged In:</strong> {user ? 'Yes' : 'No'}</p>
                        {user && (
                            <>
                                <p><strong>User ID:</strong> {user.id}</p>
                                <p><strong>Username:</strong> {user.username}</p>
                                <p><strong>Email:</strong> {user.email}</p>
                                <p><strong>Role:</strong> {user.role}</p>
                            </>
                        )}
                    </div>
                </Card>

                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Admin State</h2>
                    <div className="space-y-2 font-mono text-sm">
                        <p><strong>Is Admin:</strong> {isAdmin ? 'Yes ✅' : 'No ❌'}</p>
                        <p><strong>Is Super Admin:</strong> {isSuperAdmin ? 'Yes' : 'No'}</p>
                        <p><strong>Role:</strong> {role || 'None'}</p>
                        <p><strong>Permissions:</strong> {permissions.length > 0 ? permissions.join(', ') : 'None'}</p>
                    </div>
                </Card>

                {!user ? (
                    <>
                        <Card className="p-6 border-2 border-indigo-500">
                            <h2 className="text-xl font-semibold mb-4">Login</h2>
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <Label htmlFor="login-email">Email Address</Label>
                                    <Input
                                        id="login-email"
                                        type="email"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="mt-1"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="login-password">Password</Label>
                                    <Input
                                        id="login-password"
                                        type="password"
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className="mt-1"
                                        required
                                    />
                                </div>
                                <Button type="submit" disabled={isLoggingIn} className="w-full">
                                    {isLoggingIn ? 'Logging in...' : 'Login'}
                                </Button>
                            </form>
                        </Card>

                        <Card className="p-6">
                            <h2 className="text-xl font-semibold mb-4">Password Reset</h2>
                            <p className="text-sm text-gray-600 mb-4">Forgot your password? Reset it here.</p>
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div>
                                    <Label htmlFor="reset-email">Email Address</Label>
                                    <Input
                                        id="reset-email"
                                        type="email"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        placeholder="Enter email address"
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="new-password">New Password</Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password (min 6 chars)"
                                        className="mt-1"
                                    />
                                </div>
                                <Button type="submit" disabled={isResetting} variant="outline" className="w-full">
                                    {isResetting ? 'Resetting...' : 'Reset Password'}
                                </Button>
                            </form>
                        </Card>
                    </>
                ) : (
                    <Card className="p-6 border-2 border-green-500">
                        <h2 className="text-xl font-semibold mb-4">Actions</h2>
                        <div className="flex flex-col gap-3">
                            {isAdmin ? (
                                <Button onClick={() => navigate('/admin')} size="lg" className="w-full">
                                    🎯 Go to Admin Panel
                                </Button>
                            ) : (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm text-yellow-800">
                                        ⚠️ You are logged in but don't have admin privileges. Contact your administrator to grant admin access.
                                    </p>
                                </div>
                            )}
                            <Button onClick={handleLogout} variant="outline" className="w-full">
                                Logout
                            </Button>
                        </div>
                    </Card>
                )}

                <Card className="p-6 bg-blue-50">
                    <h2 className="text-xl font-semibold mb-4">📖 Instructions</h2>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li><strong>Forgot Password?</strong> Use the "Password Reset" form to set a new password</li>
                        <li><strong>Login:</strong> Enter your email and password in the "Login" form above</li>
                        <li><strong>Check Admin Status:</strong> Once logged in, verify "Is Admin" shows "Yes ✅"</li>
                        <li><strong>Access Admin Panel:</strong> Click "Go to Admin Panel" button</li>
                        <li>If you're not an admin, the role needs to be updated in the database</li>
                    </ol>
                </Card>
            </div>
        </div>
    );
}
