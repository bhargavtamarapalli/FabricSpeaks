/**
 * Order Timeline Component
 * 
 * Visualizes the history and progress of an order.
 * Features:
 * - Vertical timeline layout
 * - Status icons
 * - Timestamps
 * - User attribution
 * - Responsive design
 * 
 * @example
 * <OrderTimeline events={order.timeline} />
 */

import {
    CheckCircle2,
    Circle,
    Clock,
    Package,
    Truck,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { formatDate, cn } from '@/lib/admin/utils';
import type { OrderTimelineEvent } from '@/types/admin';

export interface OrderTimelineProps {
    /** List of timeline events */
    events: OrderTimelineEvent[];

    /** Additional CSS classes */
    className?: string;
}

export function OrderTimeline({ events, className }: OrderTimelineProps) {
    // Sort events by date (newest first)
    const sortedEvents = [...events].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const getEventIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return Clock;
            case 'processing':
                return Package;
            case 'shipped':
                return Truck;
            case 'delivered':
                return CheckCircle2;
            case 'cancelled':
                return XCircle;
            case 'refunded':
                return AlertCircle;
            default:
                return Circle;
        }
    };

    const getEventColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'processing':
                return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'shipped':
                return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
            case 'delivered':
                return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'cancelled':
                return 'text-red-400 bg-red-400/10 border-red-400/20';
            case 'refunded':
                return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
            default:
                return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
        }
    };

    return (
        <div className={cn('space-y-8', className)}>
            <div className="relative pl-6 border-l border-slate-800">
                {sortedEvents.map((event, index) => {
                    const Icon = getEventIcon(event.status);
                    const colorClass = getEventColor(event.status);

                    return (
                        <div key={event.id} className="mb-8 last:mb-0 relative">
                            {/* Dot/Icon on the line */}
                            <div className={cn(
                                'absolute -left-[33px] flex h-8 w-8 items-center justify-center rounded-full border',
                                colorClass
                            )}>
                                <Icon className="h-4 w-4" />
                            </div>

                            {/* Content */}
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between gap-4">
                                    <p className="text-sm font-medium text-white">
                                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                    </p>
                                    <span className="text-xs text-slate-500 whitespace-nowrap">
                                        {formatDate(event.timestamp, 'medium')}
                                    </span>
                                </div>

                                {event.note && (
                                    <p className="text-sm text-slate-400">
                                        {event.note}
                                    </p>
                                )}

                                {event.performedBy && (
                                    <p className="text-xs text-slate-500">
                                        by {event.performedBy}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
