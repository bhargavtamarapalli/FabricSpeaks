import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMe, useUpdateMe } from "@/hooks/useProfile";
import { Loader2, CheckCircle, AlertCircle, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

export function ProfileInfo() {
    const meQuery = useMe();
    const updateMe = useUpdateMe();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Local state for form fields
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: ''
    });

    // Verification State
    const [verificationModal, setVerificationModal] = useState<{ open: boolean, type: 'email' | 'phone' | null, identifier: string }>({ open: false, type: null, identifier: '' });
    const [otp, setOtp] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);

    // Password Change State
    const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
    const [passwordError, setPasswordError] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Upload State
    const [isUploading, setIsUploading] = useState(false);

    // Sync form data when meQuery.data loads
    useEffect(() => {
        if (meQuery.data) {
            setFormData({
                firstName: meQuery.data.full_name?.split(' ')[0] || meQuery.data.username?.split(' ')[0] || '',
                lastName: meQuery.data.full_name?.split(' ')[1] || meQuery.data.username?.split(' ')[1] || '',
                phone: meQuery.data.phone || ''
            });
        }
    }, [meQuery.data]);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Simple validation
        if (!file.type.startsWith('image/')) {
            toast({ variant: "destructive", title: "Invalid file", description: "Please upload an image file." });
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB
            toast({ variant: "destructive", title: "File too large", description: "Image must be less than 5MB." });
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);

            // api.upload deals with FormData correctly
            const res = await api.upload<{ message: string, image: { thumbnail: string, original: string } }>('/api/upload', formData);

            if (res?.image?.thumbnail) {
                await updateMe.mutateAsync({ avatar_url: res.image.thumbnail });
                toast({ title: "Profile picture updated" });
                queryClient.invalidateQueries({ queryKey: ["me"] });
            }
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Upload failed", description: "Could not upload image. Please try again." });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
        }
    };

    const handlePasswordChange = async () => {
        setPasswordError("");

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError("Passwords do not match.");
            return;
        }

        // Regex: At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(passwordData.newPassword)) {
            setPasswordError("Password must be at least 8 characters and include uppercase, lowercase, number, and special character.");
            return;
        }

        setIsChangingPassword(true);
        try {
            await api.post('/api/auth/update-password', { password: passwordData.newPassword });
            toast({ title: "Password updated", description: "Your password has been changed successfully." });
            setPasswordData({ newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            const message = error?.message || "Failed to update password.";
            setPasswordError(message);
            toast({ variant: "destructive", title: "Password update failed", description: message });
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleSave = async () => {
        try {
            await updateMe.mutateAsync({
                full_name: `${formData.firstName} ${formData.lastName}`.trim(),
                phone: formData.phone
            });
            toast({
                title: "Profile updated",
                description: "Your personal information has been saved successfully.",
            });
            queryClient.invalidateQueries({ queryKey: ["me"] });
        } catch (error) {
            console.error('[ProfileInfo] Save failed:', error);
            toast({
                variant: "destructive",
                title: "Update failed",
                description: "Failed to update profile. Please try again.",
            });
        }
    };

    const handleDeleteAccount = async () => {
        try {
            const response = await fetch('/api/auth/me', { method: 'DELETE' });
            if (response.ok) {
                toast({
                    title: "Account deleted",
                    description: "Your account has been permanently deleted.",
                });
                // Short delay to show toast before redirect
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            } else {
                throw new Error("Failed to delete account");
            }
        } catch (e) {
            console.error(e);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete account. Please try again.",
            });
        }
    };

    const initiateVerification = async (type: 'email' | 'phone') => {
        const identifier = type === 'email' ? meQuery.data?.email : formData.phone; // Use form phone for verifying new number

        if (!identifier) {
            toast({ variant: "destructive", title: "Missing information", description: `Please enter a valid ${type}.` });
            return;
        }

        setIsVerifying(true);
        try {
            // Check if phone matches saved profile phone, if not warn user or just verify
            await api.post('/api/auth/verify/initiate', { type, identifier });
            setVerificationModal({ open: true, type, identifier });
            toast({ title: "OTP Sent", description: `We sent a verification code to your ${type}.` });
        } catch (error) {
            toast({ variant: "destructive", title: "Failed", description: "Could not send verification code." });
        } finally {
            setIsVerifying(false);
        }
    };

    const confirmVerification = async () => {
        if (!otp) return;
        setIsVerifying(true);
        try {
            await api.post('/api/auth/verify/confirm', {
                type: verificationModal.type,
                identifier: verificationModal.identifier,
                otp
            });
            toast({ title: "Verified!", description: `Your ${verificationModal.type} has been verified.` });
            setVerificationModal({ open: false, type: null, identifier: '' });
            setOtp("");
            queryClient.invalidateQueries({ queryKey: ["me"] });
        } catch (error) {
            toast({ variant: "destructive", title: "Failed", description: "Invalid code or expired." });
        } finally {
            setIsVerifying(false);
        }
    };

    if (meQuery.isLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <Card className="p-8 border-none shadow-none bg-stone-50 dark:bg-neutral-900">
                <div className="flex items-center gap-6 mb-8">
                    <div className="relative group">
                        <Avatar className="h-20 w-20 cursor-pointer" onClick={handleAvatarClick}>
                            <AvatarImage src={meQuery.data?.avatar_url || ''} alt={meQuery.data?.full_name || 'User'} />
                            <AvatarFallback className="text-xl bg-amber-100 text-amber-800">
                                {meQuery.data?.full_name?.charAt(0) || meQuery.data?.username?.charAt(0) || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div
                            className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                            onClick={handleAvatarClick}
                        >
                            {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
                        </div>
                        <Input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>
                    <div>
                        <h2 className="font-display text-2xl dark:text-white">Personal Information</h2>
                        <p className="text-stone-500 text-sm">Update your photo and personal details.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="firstName" className="uppercase text-xs tracking-wider text-stone-500 dark:text-neutral-500">First Name</Label>
                            <Input
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                className="bg-white dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 focus-visible:ring-amber-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName" className="uppercase text-xs tracking-wider text-stone-500 dark:text-neutral-500">Last Name</Label>
                            <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                className="bg-white dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 focus-visible:ring-amber-600"
                            />
                        </div>
                    </div>

                    {/* Email Field with Verification */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label htmlFor="email" className="uppercase text-xs tracking-wider text-stone-500 dark:text-neutral-500">Email</Label>
                            {meQuery.data?.email && (
                                <span className={`text-xs flex items-center gap-1 ${meQuery.data.email_verified ? 'text-green-600' : 'text-amber-600'}`}>
                                    {meQuery.data.email_verified ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                    {meQuery.data.email_verified ? 'Verified' : 'Unverified'}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                id="email"
                                type="email"
                                value={meQuery.data?.email || ''}
                                disabled
                                className="bg-gray-100 dark:bg-neutral-900 border-stone-200 dark:border-neutral-700 focus-visible:ring-amber-600 cursor-not-allowed opacity-70"
                            />
                            {!meQuery.data?.email_verified && meQuery.data?.email && (
                                <Button variant="outline" size="sm" onClick={() => initiateVerification('email')} disabled={isVerifying}>
                                    Verify
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Phone Field with Verification */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label htmlFor="phone" className="uppercase text-xs tracking-wider text-stone-500 dark:text-neutral-500">Phone</Label>
                            {meQuery.data?.phone && (
                                <span className={`text-xs flex items-center gap-1 ${meQuery.data.phone_verified ? 'text-green-600' : 'text-amber-600'}`}>
                                    {meQuery.data.phone_verified ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                                    {meQuery.data.phone_verified ? 'Verified' : 'Unverified'}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="bg-white dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 focus-visible:ring-amber-600"
                            />
                            {(!meQuery.data?.phone_verified || meQuery.data.phone !== formData.phone) && formData.phone && (
                                <Button variant="outline" size="sm" onClick={() => initiateVerification('phone')} disabled={isVerifying}>
                                    Verify
                                </Button>
                            )}
                        </div>
                    </div>

                    <Button
                        className="w-full md:w-auto transition-all duration-200 bg-stone-900 dark:bg-white text-white dark:text-black hover:bg-stone-800 dark:hover:bg-neutral-200"
                        disabled={updateMe.isPending}
                        onClick={handleSave}
                    >
                        {updateMe.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save Changes
                    </Button>
                </div>

                {/* Password Change Section */}
                <div className="mt-12 pt-8 border-t border-stone-200 dark:border-neutral-800">
                    <h3 className="text-lg font-medium text-stone-900 dark:text-white mb-4">Change Password</h3>
                    <div className="space-y-4 max-w-md">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword" className="uppercase text-xs tracking-wider text-stone-500 dark:text-neutral-500">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                placeholder="Min 8 chars, uppercase, lowercase, number, special"
                                className="bg-white dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 focus-visible:ring-amber-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="uppercase text-xs tracking-wider text-stone-500 dark:text-neutral-500">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                placeholder="Re-enter new password"
                                className="bg-white dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 focus-visible:ring-amber-600"
                            />
                        </div>
                        {passwordError && (
                            <p className="text-sm text-red-500">{passwordError}</p>
                        )}
                        <Button
                            variant="outline"
                            onClick={handlePasswordChange}
                            disabled={isChangingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                        >
                            {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                        </Button>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-stone-200 dark:border-neutral-800">
                    <h3 className="text-lg font-medium text-stone-900 dark:text-white mb-4">Account Settings</h3>
                    <div className="bg-stone-50 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-lg p-6 flex items-center justify-between">
                        <div>
                            <p className="font-medium text-stone-900 dark:text-white">Delete Account</p>
                            <p className="text-sm text-stone-500 dark:text-neutral-400 mt-1">
                                No longer need this account? You can permanently close it here.
                            </p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">Delete Account</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your account
                                        and remove your data from our servers.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                                        Delete Account
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </Card>

            {/* Verification Modal */}
            <Dialog open={verificationModal.open} onOpenChange={(open) => !open && setVerificationModal({ open: false, type: null, identifier: '' })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Verify {verificationModal.type === 'email' ? 'Email' : 'Phone Number'}</DialogTitle>
                        <DialogDescription>
                            Enter the OTP sent to {verificationModal.identifier}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter 6-digit code"
                            className="text-center text-2xl tracking-widest"
                            maxLength={6}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={confirmVerification}
                            disabled={isVerifying || otp.length < 4}
                        >
                            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Verify Code
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
