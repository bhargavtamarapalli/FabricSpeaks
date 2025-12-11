import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, getStatusColor, getStatusLabel } from "@/lib/admin/utils";
import type { AdminProduct } from "@/types/admin";
import { cn } from "@/lib/utils";

interface ProductDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: AdminProduct | null;
}

export function ProductDetailsDialog({
    open,
    onOpenChange,
    product,
}: ProductDetailsDialogProps) {
    if (!product) return null;

    const colorImages = product.color_images || {};
    const mainImage = product.main_image || product.imageUrl;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 text-white border-slate-800">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Product Details</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {/* Left Column: Images */}
                    <div className="space-y-6">
                        {/* Main Image */}
                        <div className="aspect-square rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
                            {mainImage ? (
                                <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500">No Image</div>
                            )}
                        </div>

                        {/* Color Variants Images */}
                        {Object.entries(colorImages).map(([color, images]) => (
                            <div key={color} className="space-y-2">
                                <h4 className="text-sm font-medium text-slate-300">{color} Variants</h4>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {Array.isArray(images) && images.map((img, idx) => (
                                        <div key={idx} className="w-16 h-16 flex-shrink-0 rounded border border-slate-700 overflow-hidden">
                                            <img src={img} alt={`${color} ${idx}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right Column: Info */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold">{product.name}</h2>
                            <p className="text-slate-400 text-sm">{product.sku}</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <Badge className={cn("capitalize", getStatusColor(product.status))}>
                                {getStatusLabel(product.status)}
                            </Badge>
                            <span className="text-xl font-bold">{formatCurrency(product.price)}</span>
                            {product.salePrice && (
                                <span className="text-sm text-slate-400 line-through">{formatCurrency(product.salePrice)}</span>
                            )}
                        </div>

                        <Separator className="bg-slate-800" />

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-slate-400">Category</p>
                                <p>{product.category?.name || 'Uncategorized'}</p>
                            </div>
                            <div>
                                <p className="text-slate-400">Stock</p>
                                <p>{product.stockQuantity} units</p>
                            </div>
                            <div>
                                <p className="text-slate-400">Fabric Quality</p>
                                <p>{product.fabricQuality || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-slate-400">Wash Care</p>
                                <p>{product.washCare || 'N/A'}</p>
                            </div>
                        </div>

                        <Separator className="bg-slate-800" />

                        <div>
                            <h3 className="font-medium mb-2">Description</h3>
                            <p className="text-sm text-slate-300 whitespace-pre-wrap">{product.description}</p>
                        </div>

                        {/* Variants Table */}
                        {product.variants && product.variants.length > 0 && (
                            <div>
                                <h3 className="font-medium mb-2">Variants</h3>
                                <div className="rounded border border-slate-800 overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-800/50 text-slate-400">
                                            <tr>
                                                <th className="p-2">Size</th>
                                                <th className="p-2">Color</th>
                                                <th className="p-2">Stock</th>
                                                <th className="p-2">SKU</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {product.variants.map((v) => (
                                                <tr key={v.id}>
                                                    <td className="p-2">{v.size}</td>
                                                    <td className="p-2">{v.colour}</td>
                                                    <td className="p-2">{v.stock_quantity}</td>
                                                    <td className="p-2">{v.sku}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
