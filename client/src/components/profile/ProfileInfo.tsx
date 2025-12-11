import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMe, useUpdateMe } from "@/hooks/useProfile";
import { Loader2 } from "lucide-react";

export function ProfileInfo() {
    const meQuery = useMe();
    const updateMe = useUpdateMe();

    // Local state for form fields to avoid uncontrolled/controlled warnings
    // and remove document.getElementById usage
    const [formData, setFormData] = useState({
        firstName: meQuery.data?.full_name?.split(' ')[0] || meQuery.data?.username?.split(' ')[0] || '',
        lastName: meQuery.data?.full_name?.split(' ')[1] || meQuery.data?.username?.split(' ')[1] || '',
        email: meQuery.data?.email || '',
        phone: meQuery.data?.phone || ''
    });

    const handleSave = () => {
        updateMe.mutate({
            full_name: `${formData.firstName} ${formData.lastName}`.trim(),
            phone: formData.phone
            // Email usually not editable directly without verification, keeping it read-only logic effectively
        });
    };

    const handleDeleteAccount = async () => {
        if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            try {
                const response = await fetch('/api/auth/me', { method: 'DELETE' });
                if (response.ok) {
                    window.location.href = '/';
                } else {
                    alert("Failed to delete account");
                }
            } catch (e) {
                console.error(e);
                alert("An error occurred");
            }
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
                <h2 className="font-display text-2xl mb-8 dark:text-white">Personal Information</h2>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="firstName" className="uppercase text-xs tracking-wider text-stone-500 dark:text-neutral-500">First Name</Label>
                            <Input
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                data-testid="input-first-name"
                                className="bg-white dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 focus-visible:ring-amber-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName" className="uppercase text-xs tracking-wider text-stone-500 dark:text-neutral-500">Last Name</Label>
                            <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                data-testid="input-last-name"
                                className="bg-white dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 focus-visible:ring-amber-600"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className="uppercase text-xs tracking-wider text-stone-500 dark:text-neutral-500">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            disabled
                            title="Email cannot be changed"
                            data-testid="input-email"
                            className="bg-gray-100 dark:bg-neutral-900 border-stone-200 dark:border-neutral-700 focus-visible:ring-amber-600 cursor-not-allowed opacity-70"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone" className="uppercase text-xs tracking-wider text-stone-500 dark:text-neutral-500">Phone</Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            data-testid="input-phone"
                            className="bg-white dark:bg-neutral-800 border-stone-200 dark:border-neutral-700 focus-visible:ring-amber-600"
                        />
                    </div>
                    <Button
                        className="w-full md:w-auto transition-all duration-200 bg-stone-900 dark:bg-white text-white dark:text-black hover:bg-stone-800 dark:hover:bg-neutral-200"
                        data-testid="button-save-profile"
                        disabled={updateMe.isPending}
                        onClick={handleSave}
                    >
                        {updateMe.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save Changes
                    </Button>
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
                        <Button
                            variant="destructive"
                            onClick={handleDeleteAccount}
                        >
                            Delete Account
                        </Button>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
