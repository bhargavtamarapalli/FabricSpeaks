import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useAddresses, Address } from "@/hooks/useProfile";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";

export function AddressBook() {
    const { list, create, update, remove } = useAddresses();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Address>>({
        label: "",
        name: "",
        phone: "",
        line1: "",
        line2: "",
        city: "",
        region: "",
        postalCode: "",
        country: "India"
    });

    const handleOpenAdd = () => {
        setEditingAddress(null);
        setFormData({
            label: "Home",
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

    const handleOpenEdit = (address: Address) => {
        setEditingAddress(address);
        setFormData({ ...address });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingAddress) {
                await update.mutateAsync({ ...formData, id: editingAddress.id } as any);
            } else {
                await create.mutateAsync(formData as any);
            }
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Failed to save address:", error);
            alert("Failed to save address. Please check your inputs.");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this address?")) {
            await remove.mutateAsync(id);
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
                {(list.data || []).map((addr) => (
                    <Card key={addr.id} className="p-6 border-none shadow-none bg-stone-50 dark:bg-neutral-900 section-fade hover:bg-stone-100 dark:hover:bg-neutral-800 transition-colors duration-300">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-display text-lg dark:text-white capitalize">{addr.label || 'Address'}</h3>
                                    {addr.name && <span className="text-xs bg-stone-200 dark:bg-neutral-700 px-2 py-0.5 rounded text-stone-600 dark:text-neutral-300">{addr.name}</span>}
                                </div>
                                <div className="text-sm text-stone-600 dark:text-neutral-400 font-light space-y-0.5">
                                    <p>{addr.line1}</p>
                                    {addr.line2 && <p>{addr.line2}</p>}
                                    <p>{addr.city}, {addr.region} {addr.postalCode}</p>
                                    <p>{addr.country}</p>
                                    {addr.phone && <p className="mt-2 text-xs">Phone: {addr.phone}</p>}
                                </div>
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
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-700 border-stone-200 dark:border-neutral-700 hover:bg-red-50 dark:hover:bg-red-900/10"
                                    onClick={() => handleDelete(addr.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
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
                                <Label htmlFor="label">Label (e.g. Home, Office)</Label>
                                <Input id="label" value={formData.label} onChange={e => setFormData({ ...formData, label: e.target.value })} placeholder="Home" />
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
