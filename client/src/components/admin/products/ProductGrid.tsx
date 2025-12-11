import { AdminProduct } from "@/types/admin";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, MoreHorizontal, AlertCircle } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, getStatusColor, getStatusLabel, cn } from "@/lib/admin/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductGridProps {
    data: AdminProduct[];
    loading?: boolean;
    onEdit?: (product: AdminProduct) => void;
    onDelete?: (product: AdminProduct) => void;
    onView?: (product: AdminProduct) => void;
}

export function ProductGrid({
    data,
    loading = false,
    onEdit,
    onDelete,
    onView,
}: ProductGridProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <Card key={i} className="bg-card border-border overflow-hidden">
                        <div className="aspect-square bg-muted animate-pulse" />
                        <CardContent className="p-4 space-y-3">
                            <Skeleton className="h-4 w-3/4 bg-muted" />
                            <Skeleton className="h-3 w-1/2 bg-muted" />
                            <div className="flex justify-between items-center pt-2">
                                <Skeleton className="h-4 w-20 bg-muted" />
                                <Skeleton className="h-4 w-16 bg-muted" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-lg bg-muted/30">
                <p className="text-muted-foreground">No products found.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.map((product) => {
                const stock = product.stockQuantity;
                const threshold = product.lowStockThreshold || 10;
                const isLow = stock <= threshold;
                const isOut = stock === 0;

                // Determine image to show
                const displayImage = product.main_image || product.imageUrl;

                return (
                    <Card key={product.id} className="bg-card border-border overflow-hidden hover:border-primary/50 transition-colors group">
                        {/* Image */}
                        <div className="aspect-square relative bg-muted">
                            {displayImage ? (
                                <img
                                    src={displayImage}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                                    No Image
                                </div>
                            )}

                            {/* Status Badge */}
                            <div className="absolute top-2 right-2">
                                <Badge className={cn("capitalize shadow-sm", getStatusColor(product.status))}>
                                    {getStatusLabel(product.status)}
                                </Badge>
                            </div>

                            {/* Stock Alert */}
                            {(isLow || isOut) && (
                                <div className="absolute top-2 left-2">
                                    <Badge variant="destructive" className="flex items-center gap-1 shadow-sm">
                                        <AlertCircle className="h-3 w-3" />
                                        {isOut ? 'Out of Stock' : 'Low Stock'}
                                    </Badge>
                                </div>
                            )}
                        </div>

                        <CardContent className="p-4">
                            <h3 className="font-medium text-foreground truncate" title={product.name}>
                                {product.name}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate mt-1">
                                {product.category?.name || 'Uncategorized'}
                            </p>

                            <div className="flex items-center justify-between mt-4">
                                <span className="font-bold text-foreground">
                                    {formatCurrency(product.price)}
                                </span>
                                <span className={cn(
                                    "text-sm",
                                    isOut ? "text-destructive" : isLow ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"
                                )}>
                                    {stock} units
                                </span>
                            </div>
                        </CardContent>

                        <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                onClick={() => onView?.(product)}
                                title="View Details"
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                onClick={() => onEdit?.(product)}
                                title="Edit"
                            >
                                <Edit className="h-4 w-4" />
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => onView?.(product)} className="hover:bg-muted cursor-pointer">
                                        <Eye className="mr-2 h-4 w-4" /> View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onEdit?.(product)} className="hover:bg-muted cursor-pointer">
                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-border" />
                                    <DropdownMenuItem onClick={() => onDelete?.(product)} className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer">
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}
