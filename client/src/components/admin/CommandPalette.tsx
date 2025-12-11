/**
 * Admin Command Palette
 * 
 * Global search and command interface accessible via Cmd+K.
 * Features:
 * - Quick navigation to pages
 * - Search products, orders, customers
 * - Quick actions (Create Product, etc.)
 * 
 * @example
 * <CommandPalette />
 */

import * as React from 'react';
import { useLocation, useRoute } from 'wouter';
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
    Search,
    Package,
    ShoppingBag,
    BarChart,
    Bell,
    Plus,
    LogOut,
    Home
} from 'lucide-react';

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from '@/components/ui/command';

export function CommandPalette() {
    const [open, setOpen] = React.useState(false);
    const [location, setLocation] = useLocation();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false);
        command();
    }, []);

    return (
        <>
            <p className="fixed bottom-4 right-4 z-50 text-xs text-slate-500 hidden md:block">
                Press <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-slate-700 bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-400 opacity-100"><span className="text-xs">⌘</span>K</kbd> to search
            </p>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Type a command or search..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>

                    <CommandGroup heading="Navigation">
                        <CommandItem onSelect={() => runCommand(() => setLocation('/admin'))}>
                            <Home className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => setLocation('/admin/products'))}>
                            <Package className="mr-2 h-4 w-4" />
                            <span>Products</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => setLocation('/admin/orders'))}>
                            <ShoppingBag className="mr-2 h-4 w-4" />
                            <span>Orders</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => setLocation('/admin/inventory'))}>
                            <Calculator className="mr-2 h-4 w-4" />
                            <span>Inventory</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => setLocation('/admin/customers'))}>
                            <User className="mr-2 h-4 w-4" />
                            <span>Customers</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => setLocation('/admin/analytics'))}>
                            <BarChart className="mr-2 h-4 w-4" />
                            <span>Analytics</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => setLocation('/admin/notifications'))}>
                            <Bell className="mr-2 h-4 w-4" />
                            <span>Notifications</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => setLocation('/admin/settings'))}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </CommandItem>
                    </CommandGroup>

                    <CommandSeparator />

                    <CommandGroup heading="Quick Actions">
                        <CommandItem onSelect={() => runCommand(() => setLocation('/admin/products/new'))}>
                            <Plus className="mr-2 h-4 w-4" />
                            <span>Create New Product</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => setLocation('/admin/settings'))}>
                            <User className="mr-2 h-4 w-4" />
                            <span>Invite Team Member</span>
                        </CommandItem>
                    </CommandGroup>

                    <CommandSeparator />

                    <CommandGroup heading="Account">
                        <CommandItem onSelect={() => runCommand(() => {
                            // Logout logic here
                            localStorage.removeItem('auth_token');
                            window.location.href = '/';
                        })}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
}
