import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Save, Settings } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Preferences {
    id: string;
    admin_user_id: string;

    order_enabled: boolean;
    order_priority_threshold: string;
    order_batch_interval: number;

    inventory_enabled: boolean;
    inventory_priority_threshold: string;
    inventory_batch_interval: number;

    business_enabled: boolean;
    business_priority_threshold: string;
    business_schedule: string;

    security_enabled: boolean;
    security_priority_threshold: string;
    security_batch_interval: number;

    global_quiet_hours_enabled: boolean;
    global_quiet_hours_start?: string;
    global_quiet_hours_end?: string;
}

export default function NotificationPreferences() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<Partial<Preferences>>({});

    // Fetch preferences
    const { data: preferences, isLoading } = useQuery({
        queryKey: ["notification-preferences"],
        queryFn: async () => {
            const response = await api.get("/api/admin/notifications/preferences");
            return response as Preferences;
        }
    });

    // Update form data when preferences load
    useEffect(() => {
        if (preferences) {
            setFormData(preferences);
        }
    }, [preferences]);

    // Update preferences mutation
    const updateMutation = useMutation({
        mutationFn: async (data: Partial<Preferences>) => {
            return await api.put("/api/admin/notifications/preferences", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
            toast({ title: "Preferences saved successfully" });
        },
        onError: (error: any) => {
            toast({
                title: "Error saving preferences",
                description: error.message,
                variant: "destructive"
            });
        }
    });

    const handleSave = () => {
        updateMutation.mutate(formData);
    };

    if (isLoading) {
        return <div>Loading preferences...</div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Notification Preferences
                            </CardTitle>
                            <CardDescription>
                                Configure global notification settings for your account
                            </CardDescription>
                        </div>
                        <Button onClick={handleSave} disabled={updateMutation.isPending}>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Order Notifications */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">🛍️ Order Notifications</h3>
                                <p className="text-sm text-muted-foreground">
                                    New orders, payments, cancellations
                                </p>
                            </div>
                            <Switch
                                checked={formData.order_enabled}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, order_enabled: checked })
                                }
                            />
                        </div>

                        {formData.order_enabled && (
                            <div className="ml-4 space-y-4 border-l-2 border-muted pl-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Minimum Priority</Label>
                                        <Select
                                            value={formData.order_priority_threshold}
                                            onValueChange={(value) =>
                                                setFormData({ ...formData, order_priority_threshold: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="info">🟢 Info (All)</SelectItem>
                                                <SelectItem value="important">🟡 Important & Critical</SelectItem>
                                                <SelectItem value="critical">🔴 Critical Only</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Batch Interval (minutes)</Label>
                                        <Input
                                            type="number"
                                            value={formData.order_batch_interval}
                                            onChange={(e) =>
                                                setFormData({ ...formData, order_batch_interval: parseInt(e.target.value) })
                                            }
                                            min="0"
                                            max="120"
                                        />
                                        <p className="text-xs text-muted-foreground">0 = Send immediately</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Inventory Notifications */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">📦 Inventory Notifications</h3>
                                <p className="text-sm text-muted-foreground">
                                    Low stock, out of stock, restocking alerts
                                </p>
                            </div>
                            <Switch
                                checked={formData.inventory_enabled}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, inventory_enabled: checked })
                                }
                            />
                        </div>

                        {formData.inventory_enabled && (
                            <div className="ml-4 space-y-4 border-l-2 border-muted pl-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Minimum Priority</Label>
                                        <Select
                                            value={formData.inventory_priority_threshold}
                                            onValueChange={(value) =>
                                                setFormData({ ...formData, inventory_priority_threshold: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="info">🟢 Info (All)</SelectItem>
                                                <SelectItem value="important">🟡 Important & Critical</SelectItem>
                                                <SelectItem value="critical">🔴 Critical Only</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Batch Interval (minutes)</Label>
                                        <Input
                                            type="number"
                                            value={formData.inventory_batch_interval}
                                            onChange={(e) =>
                                                setFormData({ ...formData, inventory_batch_interval: parseInt(e.target.value) })
                                            }
                                            min="0"
                                            max="120"
                                        />
                                        <p className="text-xs text-muted-foreground">Recommended: 30 minutes</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Business Intelligence */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">📊 Business Intelligence</h3>
                                <p className="text-sm text-muted-foreground">
                                    Daily reports, weekly summaries, milestones
                                </p>
                            </div>
                            <Switch
                                checked={formData.business_enabled}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, business_enabled: checked })
                                }
                            />
                        </div>

                        {formData.business_enabled && (
                            <div className="ml-4 space-y-4 border-l-2 border-muted pl-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Minimum Priority</Label>
                                        <Select
                                            value={formData.business_priority_threshold}
                                            onValueChange={(value) =>
                                                setFormData({ ...formData, business_priority_threshold: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="info">🟢 Info (All)</SelectItem>
                                                <SelectItem value="important">🟡 Important & Critical</SelectItem>
                                                <SelectItem value="critical">🔴 Critical Only</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Report Schedule</Label>
                                        <Select
                                            value={formData.business_schedule}
                                            onValueChange={(value) =>
                                                setFormData({ ...formData, business_schedule: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="realtime">Real-time</SelectItem>
                                                <SelectItem value="hourly">Hourly</SelectItem>
                                                <SelectItem value="daily_8am">Daily at 8 AM</SelectItem>
                                                <SelectItem value="weekly_monday">Weekly (Monday)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Security Alerts */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">🔒 Security Alerts</h3>
                                <p className="text-sm text-muted-foreground">
                                    Failed logins, suspicious activity, admin actions
                                </p>
                            </div>
                            <Switch
                                checked={formData.security_enabled}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, security_enabled: checked })
                                }
                            />
                        </div>

                        {formData.security_enabled && (
                            <div className="ml-4 space-y-4 border-l-2 border-muted pl-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Minimum Priority</Label>
                                        <Select
                                            value={formData.security_priority_threshold}
                                            onValueChange={(value) =>
                                                setFormData({ ...formData, security_priority_threshold: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="info">🟢 Info (All)</SelectItem>
                                                <SelectItem value="important">🟡 Important & Critical</SelectItem>
                                                <SelectItem value="critical">🔴 Critical Only</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Batch Interval (minutes)</Label>
                                        <Input
                                            type="number"
                                            value={formData.security_batch_interval}
                                            onChange={(e) =>
                                                setFormData({ ...formData, security_batch_interval: parseInt(e.target.value) })
                                            }
                                            min="0"
                                            max="120"
                                        />
                                        <p className="text-xs text-muted-foreground">Recommended: 0 (immediate)</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Global Quiet Hours */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">🌙 Global Quiet Hours</h3>
                                <p className="text-sm text-muted-foreground">
                                    Pause all notifications during specific hours (except critical)
                                </p>
                            </div>
                            <Switch
                                checked={formData.global_quiet_hours_enabled}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, global_quiet_hours_enabled: checked })
                                }
                            />
                        </div>

                        {formData.global_quiet_hours_enabled && (
                            <div className="ml-4 space-y-4 border-l-2 border-muted pl-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Start Time</Label>
                                        <Input
                                            type="time"
                                            value={formData.global_quiet_hours_start}
                                            onChange={(e) =>
                                                setFormData({ ...formData, global_quiet_hours_start: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End Time</Label>
                                        <Input
                                            type="time"
                                            value={formData.global_quiet_hours_end}
                                            onChange={(e) =>
                                                setFormData({ ...formData, global_quiet_hours_end: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    ⚠️ Critical notifications will still be sent during quiet hours
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
