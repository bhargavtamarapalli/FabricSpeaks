import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useAddresses, Address } from "@/hooks/useProfile";
import { Loader2, Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

export function AddressBook() {
    const { list, create, update, remove } = useAddresses();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Frontend Form State (Friendly names)
    const [formData, setFormData] = useState({
        label: "shipping",
        name: "", // Will split into first_name/last_name
        phone: "",
        line1: "",
        line2: "",
        city: "",
        region: "", // -> state
        postalCode: "",
        country: "India"
    });

    const handleOpenAdd = () => {
        setEditingAddress(null);
        setFormData({
            label: "shipping",
            name: "",
            phone: "",
            line1: "",
            line2: "",
            city: "",
            region: "",
            postalCode: "",
            country: "India"
        });
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (address: any) => {
        // Map backend fields to frontend form
        setEditingAddress(address);
        setFormData({
            label: address.type || "shipping",
            name: `${address.first_name || ''} ${address.last_name || ''}`.trim(),
            phone: address.phone || "",
            line1: address.address_line_1 || "",
            line2: address.address_line_2 || "",
            city: address.city || "",
            region: address.state || "",
            postalCode: address.postal_code || "",
            country: address.country || "India"
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Split name
            const nameParts = formData.name.trim().split(' ');
            const firstName = nameParts[0] || 'User';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ' ';

            // Map to backend schema
            const payload = {
                type: formData.label || 'shipping',
                first_name: firstName,
                last_name: lastName,
                phone: formData.phone,
                address_line_1: formData.line1,
                address_line_2: formData.line2,
                city: formData.city,
                state: formData.region,
                postal_code: formData.postalCode,
                country: formData.country,
                is_default: editingAddress?.is_default || false
            };

            if (editingAddress) {
                await update.mutateAsync({ ...payload, id: editingAddress.id } as any);
                toast({ title: "Address updated", description: "Your address has been updated successfully." });
            } else {
                await create.mutateAsync(payload as any);
                toast({ title: "Address added", description: "New address added to your book." });
            }
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Failed to save address:", error);
            toast({
                variant: "destructive",
                title: "Save failed",
                description: "Failed to save address. Please check your inputs."
            });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await remove.mutateAsync(id);
            toast({ title: "Address deleted", description: "Address has been removed." });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Delete failed",
                description: "Failed to delete address. Please try again."
            });
        }
    };

    const handleSetDefault = async (address: any) => {
        try {
            await api.put(`/api/me/addresses/${address.id}/default`, {});
            await queryClient.invalidateQueries({ queryKey: ["addresses"] });
            toast({ title: "Default updated", description: "Default address has been changed." });
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Update failed",
                description: "Failed to set default address."
            });
        }
    };

    if (list.isLoading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
            <div className="grid gap-4">
                {(list.data || []).map((addr: any) => (
                    <Card key={addr.id} className="p-6 border-none shadow-none bg-stone-50 dark:bg-neutral-900 section-fade hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors duration-300">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-display text-lg dark:text-white capitalize">{addr.type || 'Address'}</h3>
                                    <span className="text-xs bg-stone-200 dark:bg-neutral-700 px-2 py-0.5 rounded text-stone-600 dark:text-neutral-300">
                                        {addr.first_name} {addr.last_name}
                                    </span>
                                    {addr.is_default && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded border border-green-200">Default</span>}
                                </div>
                                <div className="text-sm text-stone-600 dark:text-neutral-400 font-light space-y-0.5">
                                    <p>{addr.address_line_1}</p>
                                    {addr.address_line_2 && <p>{addr.address_line_2}</p>}
                                    <p>{addr.city}, {addr.state} {addr.postal_code}</p>
                                    <p>{addr.country}</p>
                                    {addr.phone && <p className="mt-2 text-xs">Phone: {addr.phone}</p>}
                                </div>
                                {!addr.is_default && (
                                    <Button
                                        variant="link"
                                        className="p-0 h-auto mt-2 text-xs text-amber-600 hover:text-amber-700"
                                        onClick={() => handleSetDefault(addr)}
                                    >
                                        Set as Default
                                    </Button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 transition-all duration-200 border-stone-200 dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-700"
                                    onClick={() => handleOpenEdit(addr)}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:text-red-700 border-stone-200 dark:border-neutral-700 hover:bg-red-50 dark:hover:bg-red-900/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Address?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete this address? This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(addr.id)} className="bg-red-600 hover:bg-red-700">
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full py-8 border-dashed border-stone-300 dark:border-neutral-700 text-stone-500 dark:text-neutral-500 hover:bg-stone-50 dark:hover:bg-neutral-900 transition-all duration-200"
                        onClick={handleOpenAdd}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add New Address
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg overflow-y-auto max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="label">Type</Label>
                                <select
                                    id="label"
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                                    value={formData.label}
                                    onChange={e => setFormData({ ...formData, label: e.target.value })}
                                >
                                    <option value="shipping">Shipping</option>
                                    <option value="billing">Billing</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Contact Name</Label>
                                <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="John Doe" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="line1">Address Line 1</Label>
                            <Input id="line1" value={formData.line1} onChange={e => setFormData({ ...formData, line1: e.target.value })} required placeholder="Street address" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="line2">Address Line 2 (Optional)</Label>
                            <Input id="line2" value={formData.line2} onChange={e => setFormData({ ...formData, line2: e.target.value })} placeholder="Apartment, suite, etc." />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input id="city" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="region">State / Region</Label>
                                <Input id="region" value={formData.region} onChange={e => setFormData({ ...formData, region: e.target.value })} required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="postalCode">Postal Code</Label>
                                <Input id="postalCode" value={formData.postalCode} onChange={e => setFormData({ ...formData, postalCode: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Input id="country" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} required />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required placeholder="+91..." />
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={create.isPending || update.isPending}>
                                {create.isPending || update.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Save Address
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
