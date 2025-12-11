import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { invitationApi, userApi } from '@/lib/admin/api';
import { Loader2, Trash2, UserPlus, Mail, Shield, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function Team() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('admin');

    // Queries
    const { data: users, isLoading: isLoadingUsers } = useQuery({
        queryKey: ['admin-users'],
        queryFn: userApi.listUsers
    });

    const { data: invitations, isLoading: isLoadingInvitations } = useQuery({
        queryKey: ['admin-invitations'],
        queryFn: invitationApi.listInvitations
    });

    // Mutations
    const inviteMutation = useMutation({
        mutationFn: (data: { email: string, role: string }) =>
            invitationApi.inviteAdmin(data.email, data.role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-invitations'] });
            toast({ title: "Invitation sent", description: `Invitation sent to ${inviteEmail}` });
            setIsInviteOpen(false);
            setInviteEmail('');
        },
        onError: (error: any) => {
            toast({
                title: "Failed to invite",
                description: error.message || "Could not send invitation",
                variant: "destructive"
            });
        }
    });

    const revokeMutation = useMutation({
        mutationFn: invitationApi.revokeInvitation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-invitations'] });
            toast({ title: "Invitation revoked" });
        },
        onError: (error: any) => {
            toast({
                title: "Failed to revoke",
                description: error.message,
                variant: "destructive"
            });
        }
    });

    const deleteUserMutation = useMutation({
        mutationFn: userApi.deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast({ title: "User removed" });
        },
        onError: (error: any) => {
            toast({
                title: "Failed to remove user",
                description: error.message,
                variant: "destructive"
            });
        }
    });

    const updateRoleMutation = useMutation({
        mutationFn: (data: { id: string, role: string }) =>
            userApi.updateUserRole(data.id, data.role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            toast({ title: "Role updated" });
        },
        onError: (error: any) => {
            toast({
                title: "Failed to update role",
                description: error.message,
                variant: "destructive"
            });
        }
    });

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;
        inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
    };

    return (
        <div className="space-y-8 p-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Team Management</h2>
                    <p className="text-muted-foreground">Manage administrators and team members.</p>
                </div>
                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Invite Admin
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Invite New Admin</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email Address</label>
                                <Input
                                    type="email"
                                    placeholder="colleague@example.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role</label>
                                <Select value={inviteRole} onValueChange={setInviteRole}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="super_admin">Super Admin</SelectItem>
                                        <SelectItem value="moderator">Moderator</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={inviteMutation.isPending}>
                                    {inviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Send Invitation
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Pending Invitations */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Pending Invitations
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoadingInvitations ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                    ) : invitations && invitations.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Sent At</TableHead>
                                    <TableHead>Expires At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invitations.map((invite: any) => (
                                    <TableRow key={invite.id}>
                                        <TableCell>{invite.email}</TableCell>
                                        <TableCell><Badge variant="outline">{invite.role}</Badge></TableCell>
                                        <TableCell>{format(new Date(invite.created_at), 'MMM d, yyyy')}</TableCell>
                                        <TableCell>{format(new Date(invite.expires_at), 'MMM d, yyyy')}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-500 hover:text-red-700"
                                                onClick={() => revokeMutation.mutate(invite.id)}
                                                disabled={revokeMutation.isPending}
                                            >
                                                <XCircle className="h-4 w-4 mr-1" /> Revoke
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No pending invitations.</p>
                    )}
                </CardContent>
            </Card>

            {/* Team Members */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Team Members
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoadingUsers ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users?.filter((u: any) => u.role !== 'user').map((user: any) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{user.full_name || user.username}</span>
                                                <span className="text-xs text-muted-foreground">{user.email || user.phone}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                defaultValue={user.role}
                                                onValueChange={(val) => updateRoleMutation.mutate({ id: user.id, role: val })}
                                            >
                                                <SelectTrigger className="w-[140px] h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                    <SelectItem value="super_admin">Super Admin</SelectItem>
                                                    <SelectItem value="moderator">Moderator</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>{format(new Date(user.created_at), 'MMM d, yyyy')}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => {
                                                    if (confirm('Are you sure you want to remove this admin?')) {
                                                        deleteUserMutation.mutate(user.id);
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
