/**
 * Admin Notifications Page
 * 
 * Central hub for system notifications and alerts.
 * Features:
 * - Notification list with filtering
 * - Preference management
 * - Mark all as read
 * 
 * @route /admin/notifications
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCheck, Settings } from 'lucide-react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { NotificationList } from '@/components/admin/notifications/NotificationList';
import { NotificationPreferences, type NotificationSetting } from '@/components/admin/notifications/NotificationPreferences';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/admin/api';
import { SEO } from '@/components/SEO';

export default function AdminNotifications() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('list');

    // Fetch notifications - backend now returns array directly
    const {
        data: notificationsData,
        isLoading,
    } = useQuery({
        queryKey: ['admin', 'notifications'],
        queryFn: async () => {
            const response = await adminApi.notifications.getHistory();
            return Array.isArray(response) ? response : [];
        },
    });

    // Mark as read mutation
    const markReadMutation = useMutation({
        mutationFn: adminApi.notifications.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
        },
    });

    // Mark ALL as read mutation
    const markAllReadMutation = useMutation({
        mutationFn: adminApi.notifications.markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
            toast({
                title: "All caught up!",
                description: "All notifications marked as read.",
            });
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: adminApi.notifications.deleteNotification,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
            toast({
                title: "Deleted",
                description: "Notification removed.",
            });
        },
    });

    // Fetch preferences
    const { data: preferences } = useQuery({
        queryKey: ['admin', 'notification-preferences'],
        queryFn: () => adminApi.notifications.getPreferences(),
    });

    // Map backend preferences to frontend settings
    const settings: NotificationSetting[] = preferences ? [
        {
            id: '1',
            category: 'orders',
            label: 'Order Notifications',
            description: 'New orders and status updates',
            channels: preferences.channels?.orders || { email: true, push: true, whatsapp: true }
        },
        {
            id: '2',
            category: 'inventory',
            label: 'Inventory Alerts',
            description: 'Low stock and out of stock alerts',
            channels: preferences.channels?.inventory || { email: true, push: true, whatsapp: true }
        },
        {
            id: '3',
            category: 'customers',
            label: 'Business Reports',
            description: 'Daily business summary and metrics',
            channels: preferences.channels?.customers || { email: true, push: true, whatsapp: true }
        },
        {
            id: '4',
            category: 'system',
            label: 'Security Alerts',
            description: 'Login attempts and security warnings',
            channels: preferences.channels?.system || { email: true, push: true, whatsapp: true }
        }
    ] : [];

    // Update preferences mutation
    const updatePreferencesMutation = useMutation({
        mutationFn: async (newSettings: NotificationSetting[]) => {
            const channels: any = {};
            newSettings.forEach(s => {
                channels[s.category] = s.channels;
            });
            return adminApi.notifications.updatePreferences({ channels });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'notification-preferences'] });
            toast({
                title: "Settings saved",
                description: "Notification preferences updated successfully.",
            });
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to update preferences.",
            });
        },
    });

    return (
        <AdminLayout>
            <SEO
                title="Notifications - Admin Panel"
                description="Manage system alerts"
                noIndex
            />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="admin-page-title">Notifications</h1>
                        <p className="admin-page-subtitle">
                            Stay updated with important alerts and system messages.
                        </p>
                    </div>
                    {activeTab === 'list' && (
                        <Button
                            variant="outline"
                            onClick={() => markAllReadMutation.mutate()}
                            disabled={markAllReadMutation.isPending || (notificationsData?.length === 0)}
                            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground font-bold shadow-sm"
                        >
                            <CheckCheck className="mr-2 h-4 w-4" />
                            Mark all as read
                        </Button>
                    )}
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-muted border border-border p-1">
                        <TabsTrigger
                            value="list"
                            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm font-bold"
                        >
                            All Notifications
                        </TabsTrigger>
                        <TabsTrigger
                            value="preferences"
                            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm font-bold"
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            Preferences
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="list" className="admin-card !p-0 overflow-hidden">
                        <NotificationList
                            notifications={notificationsData || []}
                            loading={isLoading}
                            onMarkAsRead={(id) => markReadMutation.mutate(id)}
                            onArchive={(id) => { }} // Implement archive if needed
                            onDelete={(id) => deleteMutation.mutate(id)}
                        />
                    </TabsContent>

                    <TabsContent value="preferences" className="admin-card">
                        <NotificationPreferences
                            settings={settings}
                            onUpdate={updatePreferencesMutation.mutateAsync}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    );
}
