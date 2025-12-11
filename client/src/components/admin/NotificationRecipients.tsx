import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Send, Power } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Recipient {
    id: string;
    name: string;
    whatsapp_number: string;
    email?: string;
    role?: string;
    is_active: boolean;
    notification_types: {
        order: boolean;
        inventory: boolean;
        business: boolean;
        security: boolean;
    };
    priority_threshold: string;
    quiet_hours_enabled: boolean;
    quiet_hours_start?: string;
    quiet_hours_end?: string;
    batch_enabled: boolean;
    batch_interval_minutes: number;
}

export default function NotificationRecipients() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(null);
    const [formData, setFormData] = useState<Partial<Recipient>>({
        name: "",
        whatsapp_number: "",
        email: "",
        role: "partner",
        is_active: true,
        notification_types: {
            order: true,
            inventory: true,
            business: true,
            security: true
        },
        priority_threshold: "info",
        quiet_hours_enabled: false,
        batch_enabled: true,
        batch_interval_minutes: 15
    });

    // Fetch recipients
    const { data: recipients = [], isLoading } = useQuery({
        queryKey: ["notification-recipients"],
        queryFn: async () => {
            const response = await api.get("/api/admin/notifications/recipients");
            return response as Recipient[];
        }
    });

    // Create recipient mutation
    const createMutation = useMutation({
        mutationFn: async (data: Partial<Recipient>) => {
            return await api.post("/api/admin/notifications/recipients", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notification-recipients"] });
            toast({ title: "Recipient added successfully" });
            setIsAddDialogOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast({
                title: "Error adding recipient",
                description: error.message,
                variant: "destructive"
            });
        }
    });

    // Update recipient mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Recipient> }) => {
            return await api.put(`/api/admin/notifications/recipients/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notification-recipients"] });
            toast({ title: "Recipient updated successfully" });
            setEditingRecipient(null);
            resetForm();
        },
        onError: (error: any) => {
            toast({
                title: "Error updating recipient",
                description: error.message,
                variant: "destructive"
            });
        }
    });

    // Delete recipient mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return await api.delete(`/api/admin/notifications/recipients/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notification-recipients"] });
            toast({ title: "Recipient deleted successfully" });
        },
        onError: (error: any) => {
            toast({
                title: "Error deleting recipient",
                description: error.message,
                variant: "destructive"
            });
        }
    });

    // Toggle active status mutation
    const toggleMutation = useMutation({
        mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
            return await api.patch(`/api/admin/notifications/recipients/${id}/toggle`, { is_active });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notification-recipients"] });
            toast({ title: "Recipient status updated" });
        }
    });

    // Send test notification mutation
    const testMutation = useMutation({
        mutationFn: async (whatsapp_number: string) => {
            return await api.post("/api/admin/notifications/test", { whatsapp_number });
        },
        onSuccess: () => {
            toast({ title: "Test notification sent successfully" });
        },
        onError: (error: any) => {
            toast({
                title: "Error sending test notification",
                description: error.message,
                variant: "destructive"
            });
        }
    });

    const resetForm = () => {
        setFormData({
            name: "",
            whatsapp_number: "",
            email: "",
            role: "partner",
            is_active: true,
            notification_types: {
                order: true,
                inventory: true,
                business: true,
                security: true
            },
            priority_threshold: "info",
            quiet_hours_enabled: false,
            batch_enabled: true,
            batch_interval_minutes: 15
        });
    };

    const handleSubmit = () => {
        if (editingRecipient) {
            updateMutation.mutate({ id: editingRecipient.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (recipient: Recipient) => {
        setEditingRecipient(recipient);
        setFormData(recipient);
        setIsAddDialogOpen(true);
    };

    if (isLoading) {
        return <div>Loading recipients...</div>;
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Notification Recipients</CardTitle>
                            <CardDescription>
                                Manage who receives WhatsApp notifications
                            </CardDescription>
                        </div>
                        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                            setIsAddDialogOpen(open);
                            if (!open) {
                                setEditingRecipient(null);
                                resetForm();
                            }
                        }}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Recipient
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>
                                        {editingRecipient ? "Edit Recipient" : "Add New Recipient"}
                                    </DialogTitle>
                                    <DialogDescription>
                                        Configure notification settings for this recipient
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4">
                                    {/* Basic Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Name *</Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="whatsapp_number">WhatsApp Number *</Label>
                                            <Input
                                                id="whatsapp_number"
                                                value={formData.whatsapp_number}
                                                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                                                placeholder="+919876543210"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email (Optional)</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="role">Role</Label>
                                            <Select
                                                value={formData.role}
                                                onValueChange={(value) => setFormData({ ...formData, role: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                    <SelectItem value="partner">Partner</SelectItem>
                                                    <SelectItem value="analyst">Business Analyst</SelectItem>
                                                    <SelectItem value="manager">Manager</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Notification Types */}
                                    <div className="space-y-2">
                                        <Label>Notification Types</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {Object.entries(formData.notification_types || {}).map(([type, enabled]) => (
                                                <div key={type} className="flex items-center justify-between">
                                                    <Label htmlFor={`type-${type}`} className="capitalize">{type}</Label>
                                                    <Switch
                                                        id={`type-${type}`}
                                                        checked={enabled}
                                                        onCheckedChange={(checked) => setFormData({
                                                            ...formData,
                                                            notification_types: {
                                                                ...formData.notification_types!,
                                                                [type]: checked
                                                            }
                                                        })}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Priority Threshold */}
                                    <div className="space-y-2">
                                        <Label htmlFor="priority">Minimum Priority Level</Label>
                                        <Select
                                            value={formData.priority_threshold}
                                            onValueChange={(value) => setFormData({ ...formData, priority_threshold: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="info">Info (All notifications)</SelectItem>
                                                <SelectItem value="important">Important & Critical</SelectItem>
                                                <SelectItem value="critical">Critical Only</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Quiet Hours */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Quiet Hours</Label>
                                            <Switch
                                                checked={formData.quiet_hours_enabled}
                                                onCheckedChange={(checked) => setFormData({ ...formData, quiet_hours_enabled: checked })}
                                            />
                                        </div>
                                        {formData.quiet_hours_enabled && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="quiet_start">Start Time</Label>
                                                    <Input
                                                        id="quiet_start"
                                                        type="time"
                                                        value={formData.quiet_hours_start}
                                                        onChange={(e) => setFormData({ ...formData, quiet_hours_start: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="quiet_end">End Time</Label>
                                                    <Input
                                                        id="quiet_end"
                                                        type="time"
                                                        value={formData.quiet_hours_end}
                                                        onChange={(e) => setFormData({ ...formData, quiet_hours_end: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Batching */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Enable Batching</Label>
                                            <Switch
                                                checked={formData.batch_enabled}
                                                onCheckedChange={(checked) => setFormData({ ...formData, batch_enabled: checked })}
                                            />
                                        </div>
                                        {formData.batch_enabled && (
                                            <div className="space-y-2">
                                                <Label htmlFor="batch_interval">Batch Interval (minutes)</Label>
                                                <Input
                                                    id="batch_interval"
                                                    type="number"
                                                    value={formData.batch_interval_minutes}
                                                    onChange={(e) => setFormData({ ...formData, batch_interval_minutes: parseInt(e.target.value) })}
                                                    min="5"
                                                    max="120"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSubmit}>
                                        {editingRecipient ? "Update" : "Add"} Recipient
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recipients.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No recipients configured. Add your first recipient to start receiving notifications.
                            </div>
                        ) : (
                            recipients.map((recipient) => (
                                <Card key={recipient.id}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-2 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold">{recipient.name}</h3>
                                                    <Badge variant={recipient.is_active ? "default" : "secondary"}>
                                                        {recipient.is_active ? "Active" : "Inactive"}
                                                    </Badge>
                                                    {recipient.role && (
                                                        <Badge variant="outline" className="capitalize">
                                                            {recipient.role}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground space-y-1">
                                                    <div>📱 {recipient.whatsapp_number}</div>
                                                    {recipient.email && <div>✉️ {recipient.email}</div>}
                                                    <div className="flex gap-2 mt-2">
                                                        {Object.entries(recipient.notification_types).map(([type, enabled]) =>
                                                            enabled && (
                                                                <Badge key={type} variant="secondary" className="capitalize">
                                                                    {type}
                                                                </Badge>
                                                            )
                                                        )}
                                                    </div>
                                                    <div className="text-xs mt-2">
                                                        Priority: <span className="capitalize">{recipient.priority_threshold}</span>
                                                        {recipient.quiet_hours_enabled && (
                                                            <> • Quiet Hours: {recipient.quiet_hours_start} - {recipient.quiet_hours_end}</>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => testMutation.mutate(recipient.whatsapp_number)}
                                                >
                                                    <Send className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => toggleMutation.mutate({
                                                        id: recipient.id,
                                                        is_active: !recipient.is_active
                                                    })}
                                                >
                                                    <Power className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEdit(recipient)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => {
                                                        if (confirm(`Delete recipient ${recipient.name}?`)) {
                                                            deleteMutation.mutate(recipient.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
