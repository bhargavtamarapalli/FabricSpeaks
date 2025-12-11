import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { History, Filter, Eye, CheckCircle2, XCircle, Clock, Send } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Notification {
    id: string;
    notification_type: string;
    priority: string;
    title: string;
    message: string;
    data: any;
    tags: string[];
    whatsapp_message_id?: string;
    sent_at?: string;
    delivered_at?: string;
    read_at?: string;
    delivery_status: string;
    failure_reason?: string;
    recipient_number?: string;
    created_at: string;
}

export default function NotificationHistory() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [filters, setFilters] = useState({
        type: "all",
        priority: "all",
        status: "all",
        days: "7"
    });

    // Fetch notifications
    const { data, isLoading } = useQuery({
        queryKey: ["notification-history", filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.type !== "all") params.append("type", filters.type);
            if (filters.priority !== "all") params.append("priority", filters.priority);
            if (filters.status !== "all") params.append("status", filters.status);
            params.append("days", filters.days);
            params.append("limit", "50");

            const response = await api.get(`/api/admin/notifications/history?${params.toString()}`);
            return response as { notifications: Notification[]; total: number };
        }
    });

    // Mark as read mutation
    const markReadMutation = useMutation({
        mutationFn: async (id: string) => {
            return await api.patch(`/api/admin/notifications/history/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notification-history"] });
            queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
            toast({ title: "Notification marked as read" });
        }
    });

    const getTypeEmoji = (type: string) => {
        const emojis: Record<string, string> = {
            order: "🛍️",
            inventory: "📦",
            business: "📊",
            security: "🔒"
        };
        return emojis[type] || "📱";
    };

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            critical: "destructive",
            important: "default",
            info: "secondary"
        };
        return colors[priority] || "secondary";
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "sent":
            case "delivered":
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case "failed":
                return <XCircle className="h-4 w-4 text-red-500" />;
            case "pending":
                return <Clock className="h-4 w-4 text-yellow-500" />;
            default:
                return <Send className="h-4 w-4 text-gray-500" />;
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "MMM dd, yyyy HH:mm");
        } catch {
            return dateString;
        }
    };

    if (isLoading) {
        return <div>Loading notification history...</div>;
    }

    const notifications = data?.notifications || [];
    const total = data?.total || 0;

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Notification History
                            </CardTitle>
                            <CardDescription>
                                View all sent notifications ({total} total)
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Filters */}
                    <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                                value={filters.type}
                                onValueChange={(value) => setFilters({ ...filters, type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="order">🛍️ Orders</SelectItem>
                                    <SelectItem value="inventory">📦 Inventory</SelectItem>
                                    <SelectItem value="business">📊 Business</SelectItem>
                                    <SelectItem value="security">🔒 Security</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select
                                value={filters.priority}
                                onValueChange={(value) => setFilters({ ...filters, priority: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Priorities</SelectItem>
                                    <SelectItem value="critical">🔴 Critical</SelectItem>
                                    <SelectItem value="important">🟡 Important</SelectItem>
                                    <SelectItem value="info">🟢 Info</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={filters.status}
                                onValueChange={(value) => setFilters({ ...filters, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="sent">✅ Sent</SelectItem>
                                    <SelectItem value="delivered">✅ Delivered</SelectItem>
                                    <SelectItem value="failed">❌ Failed</SelectItem>
                                    <SelectItem value="pending">⏳ Pending</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Time Range</Label>
                            <Select
                                value={filters.days}
                                onValueChange={(value) => setFilters({ ...filters, days: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Last 24 hours</SelectItem>
                                    <SelectItem value="7">Last 7 days</SelectItem>
                                    <SelectItem value="30">Last 30 days</SelectItem>
                                    <SelectItem value="90">Last 90 days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="space-y-2">
                        {notifications.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No notifications found matching your filters
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <Card
                                    key={notification.id}
                                    className={`cursor-pointer hover:bg-muted/50 transition-colors ${!notification.read_at ? 'border-l-4 border-l-primary' : ''
                                        }`}
                                    onClick={() => setSelectedNotification(notification)}
                                >
                                    <CardContent className="pt-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">{getTypeEmoji(notification.notification_type)}</span>
                                                    <h4 className="font-semibold">{notification.title}</h4>
                                                    <Badge variant={getPriorityColor(notification.priority) as any}>
                                                        {notification.priority}
                                                    </Badge>
                                                    <Badge variant="outline" className="capitalize">
                                                        {notification.notification_type}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <span>📱 {notification.recipient_number}</span>
                                                    <span>⏰ {formatDate(notification.created_at)}</span>
                                                    {notification.tags && notification.tags.length > 0 && (
                                                        <span>🏷️ {notification.tags.join(", ")}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(notification.delivery_status)}
                                                    <span className="text-sm capitalize">{notification.delivery_status}</span>
                                                </div>
                                                {!notification.read_at && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            markReadMutation.mutate(notification.id);
                                                        }}
                                                    >
                                                        Mark Read
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Notification Detail Dialog */}
            <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="text-2xl">{selectedNotification && getTypeEmoji(selectedNotification.notification_type)}</span>
                            {selectedNotification?.title}
                        </DialogTitle>
                        <DialogDescription>
                            Notification Details
                        </DialogDescription>
                    </DialogHeader>

                    {selectedNotification && (
                        <div className="space-y-4">
                            {/* Badges */}
                            <div className="flex gap-2">
                                <Badge variant={getPriorityColor(selectedNotification.priority) as any}>
                                    {selectedNotification.priority}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                    {selectedNotification.notification_type}
                                </Badge>
                                <Badge variant="secondary">
                                    {selectedNotification.delivery_status}
                                </Badge>
                            </div>

                            {/* Message */}
                            <div className="space-y-2">
                                <Label>Message</Label>
                                <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap font-mono text-sm">
                                    {selectedNotification.message}
                                </div>
                            </div>

                            {/* Metadata */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Recipient</Label>
                                    <div className="text-sm">{selectedNotification.recipient_number}</div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Created At</Label>
                                    <div className="text-sm">{formatDate(selectedNotification.created_at)}</div>
                                </div>
                                {selectedNotification.sent_at && (
                                    <div className="space-y-2">
                                        <Label>Sent At</Label>
                                        <div className="text-sm">{formatDate(selectedNotification.sent_at)}</div>
                                    </div>
                                )}
                                {selectedNotification.delivered_at && (
                                    <div className="space-y-2">
                                        <Label>Delivered At</Label>
                                        <div className="text-sm">{formatDate(selectedNotification.delivered_at)}</div>
                                    </div>
                                )}
                                {selectedNotification.read_at && (
                                    <div className="space-y-2">
                                        <Label>Read At</Label>
                                        <div className="text-sm">{formatDate(selectedNotification.read_at)}</div>
                                    </div>
                                )}
                                {selectedNotification.whatsapp_message_id && (
                                    <div className="space-y-2">
                                        <Label>WhatsApp Message ID</Label>
                                        <div className="text-sm font-mono">{selectedNotification.whatsapp_message_id}</div>
                                    </div>
                                )}
                            </div>

                            {/* Failure Reason */}
                            {selectedNotification.failure_reason && (
                                <div className="space-y-2">
                                    <Label className="text-destructive">Failure Reason</Label>
                                    <div className="p-4 bg-destructive/10 rounded-lg text-sm">
                                        {selectedNotification.failure_reason}
                                    </div>
                                </div>
                            )}

                            {/* Tags */}
                            {selectedNotification.tags && selectedNotification.tags.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Tags</Label>
                                    <div className="flex gap-2">
                                        {selectedNotification.tags.map((tag) => (
                                            <Badge key={tag} variant="outline">{tag}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Additional Data */}
                            {selectedNotification.data && Object.keys(selectedNotification.data).length > 0 && (
                                <div className="space-y-2">
                                    <Label>Additional Data</Label>
                                    <div className="p-4 bg-muted rounded-lg">
                                        <pre className="text-xs overflow-x-auto">
                                            {JSON.stringify(selectedNotification.data, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
