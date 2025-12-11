/**
 * Team Settings Component
 * 
 * Management interface for admin users and roles.
 * Features:
 * - List of team members
 * - Invite new member
 * - Role management
 * - Remove member
 * 
 * @example
 * <TeamSettings members={members} onInvite={handleInvite} />
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Users, UserPlus, Mail, Shield, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/admin/utils';

// Validation Schema
const inviteSchema = z.object({
    email: z.string().email('Invalid email address'),
    role: z.enum(['admin', 'editor', 'viewer']),
});

type InviteData = z.infer<typeof inviteSchema>;

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'editor' | 'viewer';
    avatar?: string;
    status: 'active' | 'pending';
}

export interface TeamSettingsProps {
    /** List of team members */
    members: TeamMember[];

    /** Invite handler */
    onInvite: (data: InviteData) => Promise<void>;

    /** Remove handler */
    onRemove: (id: string) => Promise<void>;

    /** Loading state */
    loading?: boolean;

    /** Additional CSS classes */
    className?: string;
}

export function TeamSettings({
    members,
    onInvite,
    onRemove,
    loading = false,
    className,
}: TeamSettingsProps) {
    const [isInviteOpen, setIsInviteOpen] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = useForm<InviteData>({
        resolver: zodResolver(inviteSchema),
        defaultValues: {
            role: 'editor',
        },
    });

    const handleInviteSubmit = async (data: InviteData) => {
        await onInvite(data);
        reset();
        setIsInviteOpen(false);
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            case 'editor': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'viewer': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
            default: return 'bg-slate-500/10 text-slate-400';
        }
    };

    return (
        <div className={cn('space-y-6', className)}>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-white">Team Members</h3>
                    <p className="text-sm text-slate-400">Manage access to your store.</p>
                </div>

                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Invite Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="border-slate-800 bg-slate-900 text-white sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Invite Team Member</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Send an invitation to join your team.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(handleInviteSubmit)} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Email Address</Label>
                                <Input
                                    {...register('email')}
                                    placeholder="colleague@example.com"
                                    className="border-slate-700 bg-slate-800 text-white"
                                />
                                {errors.email && (
                                    <p className="text-xs text-red-400">{errors.email.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Select onValueChange={(val: any) => setValue('role', val)} defaultValue="editor">
                                    <SelectTrigger className="border-slate-700 bg-slate-800 text-white">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent className="border-slate-700 bg-slate-800 text-white">
                                        <SelectItem value="admin">Admin (Full Access)</SelectItem>
                                        <SelectItem value="editor">Editor (Manage Content)</SelectItem>
                                        <SelectItem value="viewer">Viewer (Read Only)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsInviteOpen(false)}
                                    className="text-slate-400 hover:text-white"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {loading ? 'Sending...' : 'Send Invitation'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/50">
                {members.map((member, index) => (
                    <div
                        key={member.id}
                        className={cn(
                            "flex items-center justify-between p-4",
                            index !== members.length - 1 && "border-b border-slate-800"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 border border-slate-700">
                                <AvatarImage src={member.avatar} />
                                <AvatarFallback className="bg-slate-800 text-slate-400">
                                    {member.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium text-white">
                                    {member.name}
                                    {member.status === 'pending' && (
                                        <span className="ml-2 text-xs text-yellow-500">(Pending)</span>
                                    )}
                                </p>
                                <p className="text-sm text-slate-400">{member.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className={cn(
                                "rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                                getRoleBadgeColor(member.role)
                            )}>
                                {member.role}
                            </span>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="border-slate-700 bg-slate-800 text-white">
                                    <DropdownMenuItem className="text-red-400 hover:bg-red-400/10 hover:text-red-300 cursor-pointer" onClick={() => onRemove(member.id)}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Remove Member
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
