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
                    <h2 className="admin-page-title">Team Management</h2>
                    <p className="admin-page-subtitle">Manage administrators and team members.</p>
                </div>
                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Invite Admin
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-background border-border shadow-lg">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-foreground">Invite New Admin</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-foreground">Email Address</label>
                                <Input
                                    type="email"
                                    placeholder="colleague@example.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    required
                                    className="bg-muted border-border focus:ring-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-foreground">Role</label>
                                <Select value={inviteRole} onValueChange={setInviteRole}>
                                    <SelectTrigger className="bg-muted border-border">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border-border">
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="super_admin">Super Admin</SelectItem>
                                        <SelectItem value="moderator">Moderator</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={inviteMutation.isPending} className="w-full sm:w-auto font-bold">
                                    {inviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Send Invitation
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Pending Invitations */}
            <Card className="admin-card">
                <CardHeader className="border-b border-border/50 pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                        <Mail className="h-5 w-5 text-primary" />
                        Pending Invitations
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    {isLoadingInvitations ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                    ) : invitations && invitations.length > 0 ? (
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="border-border">
                                    <TableHead className="text-muted-foreground font-bold uppercase text-xs">Email</TableHead>
                                    <TableHead className="text-muted-foreground font-bold uppercase text-xs">Role</TableHead>
                                    <TableHead className="text-muted-foreground font-bold uppercase text-xs">Sent At</TableHead>
                                    <TableHead className="text-muted-foreground font-bold uppercase text-xs">Expires At</TableHead>
                                    <TableHead className="text-right text-muted-foreground font-bold uppercase text-xs">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invitations.map((invite: any) => (
                                    <TableRow key={invite.id} className="border-border hover:bg-muted/30">
                                        <TableCell className="font-medium text-foreground">{invite.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary font-bold uppercase text-[10px]">
                                                {invite.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{format(new Date(invite.created_at), 'MMM d, yyyy')}</TableCell>
                                        <TableCell className="text-muted-foreground">{format(new Date(invite.expires_at), 'MMM d, yyyy')}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 font-bold"
                                                onClick={() => revokeMutation.mutate(invite.id)}
                                                disabled={revokeMutation.isPending}
                                            >
                                                <XCircle className="h-3.5 w-3.5 mr-1" /> Revoke
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8 bg-muted/20 rounded-lg border border-dashed border-border">No pending invitations.</p>
                    )}
                </CardContent>
            </Card>

            {/* Team Members */}
            <Card className="admin-card">
                <CardHeader className="border-b border-border/50 pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                        <Shield className="h-5 w-5 text-primary" />
                        Team Members
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    {isLoadingUsers ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="border-border">
                                    <TableHead className="text-muted-foreground font-bold uppercase text-xs">User</TableHead>
                                    <TableHead className="text-muted-foreground font-bold uppercase text-xs">Role</TableHead>
                                    <TableHead className="text-muted-foreground font-bold uppercase text-xs">Joined</TableHead>
                                    <TableHead className="text-right text-muted-foreground font-bold uppercase text-xs">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users?.filter((u: any) => u.role !== 'user').map((user: any) => (
                                    <TableRow key={user.id} className="border-border hover:bg-muted/30">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-foreground">{user.full_name || user.username}</span>
                                                <span className="text-xs text-muted-foreground font-medium">{user.email || user.phone}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                defaultValue={user.role}
                                                onValueChange={(val) => updateRoleMutation.mutate({ id: user.id, role: val })}
                                            >
                                                <SelectTrigger className="w-[140px] h-8 bg-muted border-border font-medium text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-background border-border">
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                    <SelectItem value="super_admin">Super Admin</SelectItem>
                                                    <SelectItem value="moderator">Moderator</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{format(new Date(user.created_at), 'MMM d, yyyy')}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
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
