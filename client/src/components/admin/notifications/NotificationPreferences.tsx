/**
 * Notification Preferences Component
 * 
 * Settings for configuring notification delivery channels.
 * Features:
 * - Toggle channels (Email, Push, SMS) per category
 * - Global settings
 * 
 * @example
 * <NotificationPreferences settings={settings} onUpdate={handleUpdate} />
 */

import { useState } from 'react';
import {
    Bell,
    Mail,
    MessageSquare,
    Package,
    AlertTriangle,
    Users,
    Archive
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/admin/utils';

export interface NotificationSetting {
    id: string;
    category: 'orders' | 'inventory' | 'customers' | 'system';
    label: string;
    description: string;
    channels: {
        email: boolean;
        push: boolean;
        whatsapp: boolean;
    };
}

export interface NotificationPreferencesProps {
    /** Current settings */
    settings: NotificationSetting[];

    /** Update handler */
    onUpdate: (settings: NotificationSetting[]) => Promise<void>;

    /** Loading state */
    loading?: boolean;

    /** Additional CSS classes */
    className?: string;
}

export function NotificationPreferences({
    settings: initialSettings,
    onUpdate,
    loading = false,
    className,
}: NotificationPreferencesProps) {
    const [settings, setSettings] = useState<NotificationSetting[]>(initialSettings);
    const [hasChanges, setHasChanges] = useState(false);

    const handleToggle = (id: string, channel: keyof NotificationSetting['channels']) => {
        setSettings(prev => prev.map(setting => {
            if (setting.id === id) {
                return {
                    ...setting,
                    channels: {
                        ...setting.channels,
                        [channel]: !setting.channels[channel]
                    }
                };
            }
            return setting;
        }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        await onUpdate(settings);
        setHasChanges(false);
    };

    const getIcon = (category: string) => {
        switch (category) {
            case 'orders': return Package;
            case 'inventory': return Archive;
            case 'customers': return Users;
            case 'system': return AlertTriangle;
            default: return Bell;
        }
    };

    return (
        <div className={cn('space-y-6', className)}>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-foreground">Notification Settings</h3>
                    <p className="text-sm text-muted-foreground">Manage how you receive alerts and updates.</p>
                </div>
                {hasChanges && (
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                )}
            </div>

            <div className="space-y-6">
                {/* Headers */}
                <div className="grid grid-cols-12 gap-4 border-b border-border pb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <div className="col-span-6 md:col-span-5">Category</div>
                    <div className="col-span-2 text-center flex flex-col items-center gap-1">
                        <Mail className="h-4 w-4" />
                        <span>Email</span>
                    </div>
                    <div className="col-span-2 text-center flex flex-col items-center gap-1">
                        <Bell className="h-4 w-4" />
                        <span>Push</span>
                    </div>
                    <div className="col-span-2 text-center flex flex-col items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>WhatsApp</span>
                    </div>
                </div>

                {/* Settings List */}
                <div className="space-y-6">
                    {settings.map((setting) => {
                        const Icon = getIcon(setting.category);

                        return (
                            <div key={setting.id} className="grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-6 md:col-span-5 flex gap-3">
                                    <div className="mt-1 h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground hidden md:flex">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground">{setting.label}</p>
                                        <p className="text-xs text-muted-foreground line-clamp-1">{setting.description}</p>
                                    </div>
                                </div>

                                <div className="col-span-2 flex justify-center">
                                    <Switch
                                        checked={setting.channels.email}
                                        onCheckedChange={() => handleToggle(setting.id, 'email')}
                                        className="data-[state=checked]:bg-primary"
                                    />
                                </div>
                                <div className="col-span-2 flex justify-center">
                                    <Switch
                                        checked={setting.channels.push}
                                        onCheckedChange={() => handleToggle(setting.id, 'push')}
                                        className="data-[state=checked]:bg-primary"
                                    />
                                </div>
                                <div className="col-span-2 flex justify-center">
                                    <Switch
                                        checked={setting.channels.whatsapp}
                                        onCheckedChange={() => handleToggle(setting.id, 'whatsapp')}
                                        className="data-[state=checked]:bg-primary"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
