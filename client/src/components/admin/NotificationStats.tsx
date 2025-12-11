import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BarChart3, TrendingUp, Bell, CheckCircle2, XCircle, Clock } from "lucide-react";
import { api } from "@/lib/api";

interface Stats {
    total: number;
    by_type: {
        order: number;
        inventory: number;
        business: number;
        security: number;
    };
    by_priority: {
        critical: number;
        important: number;
        info: number;
    };
    by_status: {
        sent: number;
        delivered: number;
        failed: number;
        pending: number;
    };
    unread: number;
}

export default function NotificationStats() {
    const [timeRange, setTimeRange] = useState("7");

    // Fetch stats
    const { data: stats, isLoading } = useQuery({
        queryKey: ["notification-stats", timeRange],
        queryFn: async () => {
            const response = await api.get(`/api/admin/notifications/stats?days=${timeRange}`);
            return response as Stats;
        }
    });

    if (isLoading) {
        return <div>Loading statistics...</div>;
    }

    const deliveryRate = stats
        ? ((stats.by_status.sent + stats.by_status.delivered) / stats.total * 100).toFixed(1)
        : "0";

    const failureRate = stats
        ? (stats.by_status.failed / stats.total * 100).toFixed(1)
        : "0";

    return (
        <div className="space-y-6">
            {/* Time Range Selector */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Notification Statistics
                            </CardTitle>
                            <CardDescription>
                                Overview of notification performance
                            </CardDescription>
                        </div>
                        <div className="w-48">
                            <Select value={timeRange} onValueChange={setTimeRange}>
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
                </CardHeader>
            </Card>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Notifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Bell className="h-8 w-8 text-primary" />
                            <div className="text-3xl font-bold">{stats?.total || 0}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Delivery Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                            <div className="text-3xl font-bold">{deliveryRate}%</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Failed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <XCircle className="h-8 w-8 text-red-500" />
                            <div className="text-3xl font-bold">{stats?.by_status.failed || 0}</div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {failureRate}% failure rate
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Unread
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Clock className="h-8 w-8 text-yellow-500" />
                            <div className="text-3xl font-bold">{stats?.unread || 0}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* By Type */}
            <Card>
                <CardHeader>
                    <CardTitle>Notifications by Type</CardTitle>
                    <CardDescription>
                        Breakdown of notifications by category
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {stats && Object.entries(stats.by_type).map(([type, count]) => {
                            const percentage = stats.total > 0 ? (count / stats.total * 100).toFixed(1) : "0";
                            const emoji = {
                                order: "🛍️",
                                inventory: "📦",
                                business: "📊",
                                security: "🔒"
                            }[type] || "📱";

                            return (
                                <div key={type} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <span className="text-xl">{emoji}</span>
                                            <span className="capitalize font-medium">{type}</span>
                                        </span>
                                        <span className="text-muted-foreground">
                                            {count} ({percentage}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className="bg-primary rounded-full h-2 transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* By Priority */}
            <Card>
                <CardHeader>
                    <CardTitle>Notifications by Priority</CardTitle>
                    <CardDescription>
                        Distribution of notification urgency levels
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {stats && Object.entries(stats.by_priority).map(([priority, count]) => {
                            const percentage = stats.total > 0 ? (count / stats.total * 100).toFixed(1) : "0";
                            const emoji = {
                                critical: "🔴",
                                important: "🟡",
                                info: "🟢"
                            }[priority] || "⚪";

                            const color = {
                                critical: "bg-red-500",
                                important: "bg-yellow-500",
                                info: "bg-green-500"
                            }[priority] || "bg-gray-500";

                            return (
                                <div key={priority} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <span className="text-xl">{emoji}</span>
                                            <span className="capitalize font-medium">{priority}</span>
                                        </span>
                                        <span className="text-muted-foreground">
                                            {count} ({percentage}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className={`${color} rounded-full h-2 transition-all`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* By Status */}
            <Card>
                <CardHeader>
                    <CardTitle>Delivery Status</CardTitle>
                    <CardDescription>
                        Current status of sent notifications
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        {stats && Object.entries(stats.by_status).map(([status, count]) => {
                            const percentage = stats.total > 0 ? (count / stats.total * 100).toFixed(1) : "0";
                            const config = {
                                sent: { icon: CheckCircle2, color: "text-green-500", label: "Sent" },
                                delivered: { icon: CheckCircle2, color: "text-green-600", label: "Delivered" },
                                failed: { icon: XCircle, color: "text-red-500", label: "Failed" },
                                pending: { icon: Clock, color: "text-yellow-500", label: "Pending" }
                            }[status] || { icon: Bell, color: "text-gray-500", label: status };

                            const Icon = config.icon;

                            return (
                                <Card key={status}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium capitalize">{config.label}</p>
                                                <p className="text-2xl font-bold">{count}</p>
                                                <p className="text-xs text-muted-foreground">{percentage}%</p>
                                            </div>
                                            <Icon className={`h-8 w-8 ${config.color}`} />
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Insights */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Insights
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 text-sm">
                        {stats && (
                            <>
                                {stats.by_status.failed > 0 && (
                                    <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                                        <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-red-700 dark:text-red-300">
                                                {stats.by_status.failed} failed notifications
                                            </p>
                                            <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                                                Check recipient WhatsApp numbers and API credentials
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {stats.by_priority.critical > stats.total * 0.5 && (
                                    <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                                        <TrendingUp className="h-5 w-5 text-yellow-500 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-yellow-700 dark:text-yellow-300">
                                                High volume of critical notifications
                                            </p>
                                            <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1">
                                                Consider reviewing your priority thresholds
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {stats.unread > 10 && (
                                    <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                        <Bell className="h-5 w-5 text-blue-500 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-blue-700 dark:text-blue-300">
                                                {stats.unread} unread notifications
                                            </p>
                                            <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                                                Review recent notifications in the History tab
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {parseFloat(deliveryRate) > 95 && (
                                    <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-green-700 dark:text-green-300">
                                                Excellent delivery rate ({deliveryRate}%)
                                            </p>
                                            <p className="text-green-600 dark:text-green-400 text-xs mt-1">
                                                Your notification system is performing well
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
