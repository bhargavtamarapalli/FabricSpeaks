/**
 * Admin Settings Page
 * 
 * Main configuration page for the admin panel.
 * Features:
 * - General settings (Store profile, localization)
 * - Security settings (Password, 2FA)
 * - Team settings (Member management)
 * 
 * @route /admin/settings
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Shield, Users, Bell } from 'lucide-react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { GeneralSettings, type GeneralSettingsData } from '@/components/admin/settings/GeneralSettings';
import { SecuritySettings } from '@/components/admin/settings/SecuritySettings';
import { TeamSettings, type TeamMember } from '@/components/admin/settings/TeamSettings';
import NotificationPreferences from '@/components/admin/NotificationPreferences';
import NotificationRecipients from '@/components/admin/NotificationRecipients';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '@/lib/admin/api';
import { SEO } from '@/components/SEO';

// Mock team members removed


export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');

  // General Settings Mutation
  const updateGeneralSettings = async (data: GeneralSettingsData) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Settings saved",
      description: "Store settings have been updated.",
    });
  };

  // Password Update Mutation
  const updatePassword = async (data: any) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Password updated",
      description: "Your password has been changed successfully.",
    });
  };

  // 2FA Toggle Mutation
  const toggle2FA = async (enabled: boolean) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    toast({
      title: enabled ? "2FA Enabled" : "2FA Disabled",
      description: enabled
        ? "Two-factor authentication is now active."
        : "Two-factor authentication has been disabled.",
    });
  };

  // Fetch users
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminApi.users.listUsers(),
  });

  // Fetch invitations
  const { data: invitationsData, isLoading: isLoadingInvitations } = useQuery({
    queryKey: ['admin', 'invitations'],
    queryFn: () => adminApi.invitations.getInvitations(),
  });

  // Combine users and invitations
  const members: TeamMember[] = [
    ...(usersData || []).map((u: any) => ({
      id: u.id,
      name: u.full_name || 'Unknown',
      email: u.email,
      role: u.role,
      status: 'active' as const,
      avatar: u.avatar_url,
    })),
    ...(invitationsData || []).map((i: any) => ({
      id: i.id,
      name: 'Invited User',
      email: i.email,
      role: i.role,
      status: 'pending' as const,
    })),
  ];

  // Invite Member Mutation
  const inviteMutation = useMutation({
    mutationFn: (data: any) => adminApi.invitations.inviteUser(data.email, data.role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'invitations'] });
      toast({
        title: "Invitation sent",
        description: "Invitation sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send invitation.",
      });
    },
  });

  // Remove Member Mutation
  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      // Check if it's an invitation or a user
      const isInvitation = invitationsData?.some((i: any) => i.id === id);
      if (isInvitation) {
        await adminApi.invitations.revokeInvitation(id);
      } else {
        await adminApi.users.deleteUser(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'invitations'] });
      toast({
        title: "Member removed",
        description: "Team member has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to remove member.",
      });
    },
  });

  return (
    <AdminLayout>
      <SEO
        title="Settings - Admin Panel"
        description="Configure store settings"
        noIndex
      />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="admin-page-title">Settings</h1>
          <p className="admin-page-subtitle">
            Manage your store profile, security, and team access.
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted border border-border p-1">
            <TabsTrigger
              value="general"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Settings className="mr-2 h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Shield className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger
              value="team"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Users className="mr-2 h-4 w-4" />
              Team
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="admin-card">
            <GeneralSettings
              onSave={updateGeneralSettings}
            />
          </TabsContent>

          <TabsContent value="security" className="admin-card">
            <SecuritySettings
              onUpdatePassword={updatePassword}
              onToggle2FA={toggle2FA}
            />
          </TabsContent>

          <TabsContent value="team" className="admin-card">
            <TeamSettings
              members={members}
              onInvite={inviteMutation.mutateAsync}
              onRemove={removeMutation.mutateAsync}
              loading={isLoadingUsers || isLoadingInvitations}
            />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="admin-card">
              <NotificationPreferences />
            </div>
            <div className="admin-card">
              <NotificationRecipients />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
