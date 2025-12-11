/**
 * Filter Sidebar Component
 * 
 * Provides UI controls for filtering and sorting products.
 * Supports price range, search, and sort options.
 * 
 * @module client/src/components/FilterSidebar
 */

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, X } from "lucide-react";
import { UseProductsParams } from "@/hooks/useProducts";

interface FilterSidebarProps {
    filters: UseProductsParams;
    onFilterChange: (newFilters: UseProductsParams) => void;
    className?: string;
}

export default function FilterSidebar({ filters, onFilterChange, className }: FilterSidebarProps) {
    const [search, setSearch] = useState(filters.search || "");
    const [priceRange, setPriceRange] = useState([filters.minPrice || 0, filters.maxPrice || 10000]);
    const [sortBy, setSortBy] = useState(filters.sortBy || "newest");
    const [selectedCategory, setSelectedCategory] = useState(filters.categorySlug || "");
    const [selectedFabric, setSelectedFabric] = useState(filters.fabric || "");
    const [selectedSize, setSelectedSize] = useState(filters.size || "");
    const [selectedColour, setSelectedColour] = useState(filters.colour || "");

    // Debounce search updates
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== filters.search) {
                onFilterChange({ ...filters, search });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Handle price change (committed only on release to avoid too many requests)
    const handlePriceChange = (value: number[]) => {
        setPriceRange(value);
    };

    const handlePriceCommit = (value: number[]) => {
        onFilterChange({ ...filters, minPrice: value[0], maxPrice: value[1] });
    };

    const handleSortChange = (value: string) => {
        setSortBy(value as any);
        onFilterChange({ ...filters, sortBy: value as any });
    };

    const handleCategoryChange = (category: string) => {
        const newCategory = selectedCategory === category ? "clothing" : category;
        setSelectedCategory(newCategory);
        onFilterChange({ ...filters, categorySlug: newCategory });
    };

    const handleFabricChange = (fabric: string) => {
        const newFabric = selectedFabric === fabric ? "" : fabric;
        setSelectedFabric(newFabric);
        onFilterChange({ ...filters, fabric: newFabric });
    };

    const handleSizeChange = (size: string) => {
        const newSize = selectedSize === size ? "" : size;
        setSelectedSize(newSize);
        onFilterChange({ ...filters, size: newSize });
    };

    const handleColourChange = (colour: string) => {
        const newColour = selectedColour === colour ? "" : colour;
        setSelectedColour(newColour);
        onFilterChange({ ...filters, colour: newColour });
    };

    const clearFilters = () => {
        setSearch("");
        setPriceRange([0, 10000]);
        setSortBy("newest");
        setSelectedCategory("clothing");
        setSelectedFabric("");
        onFilterChange({
            limit: filters.limit,
            offset: 0,
            categoryId: filters.categoryId,
            categorySlug: "clothing",
            fabric: undefined,
            size: undefined,
            colour: undefined
        });
    };

    const categories = {
        "Topwear": ["Shirts", "T-Shirts", "Jackets", "Sweaters", "Blazers", "Coats", "Hoodies", "Kurtas"],
        "Bottomwear": ["Pants", "Jeans", "Trousers", "Shorts", "Joggers", "Chinos"],
        "Accessories": ["Belts", "Wallets", "Ties", "Socks", "Scarves", "Hats", "Bags"]
    };

    const fabrics = ["Cotton", "Linen", "Wool", "Silk", "Polyester", "Denim", "Leather"];
    const sizes = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
    const colours = ["Black", "White", "Red", "Blue", "Green", "Yellow", "Pink", "Purple", "Grey", "Brown", "Beige", "Navy"];

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Search */}
            <div className="space-y-2">
                <h3 className="font-display text-lg mb-2">Search</h3>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
                <h3 className="font-display text-lg mb-2">Sort By</h3>
                <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Newest Arrivals</SelectItem>
                        <SelectItem value="price_asc">Price: Low to High</SelectItem>
                        <SelectItem value="price_desc">Price: High to Low</SelectItem>
                        <SelectItem value="name_asc">Name: A to Z</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Accordion type="single" collapsible className="w-full">
                {/* Price Range */}
                <AccordionItem value="price">
                    <AccordionTrigger className="text-sm font-medium">Price Range</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                    ₹{priceRange[0]}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    ₹{priceRange[1]}
                                </span>
                            </div>
                            <Slider
                                defaultValue={[0, 10000]}
                                value={priceRange}
                                min={0}
                                max={10000}
                                step={100}
                                onValueChange={handlePriceChange}
                                onValueCommit={handlePriceCommit}
                                className="py-4"
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Categories */}
                <AccordionItem value="categories">
                    <AccordionTrigger className="text-sm font-medium">Categories</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-4 pt-2">
                            {Object.entries(categories).map(([group, items]) => (
                                <div key={group} className="space-y-2">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group}</h4>
                                    <div className="space-y-2 pl-2">
                                        {items.map((item) => (
                                            <div key={item} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`cat-${item}`}
                                                    checked={selectedCategory === item.toLowerCase()}
                                                    onCheckedChange={() => handleCategoryChange(item.toLowerCase())}
                                                />
                                                <Label htmlFor={`cat-${item}`} className="text-sm font-normal cursor-pointer">
                                                    {item}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Fabric */}
                <AccordionItem value="fabric">
                    <AccordionTrigger className="text-sm font-medium">Fabric</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2 pt-2">
                            {fabrics.map((fabric) => (
                                <div key={fabric} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`fab-${fabric}`}
                                        checked={selectedFabric === fabric.toLowerCase()}
                                        onCheckedChange={() => handleFabricChange(fabric.toLowerCase())}
                                    />
                                    <Label htmlFor={`fab-${fabric}`} className="text-sm font-normal cursor-pointer">
                                        {fabric}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Size */}
                <AccordionItem value="size">
                    <AccordionTrigger className="text-sm font-medium">Size</AccordionTrigger>
                    <AccordionContent>
                        <div className="grid grid-cols-4 gap-2 pt-2">
                            {sizes.map((size) => (
                                <div
                                    key={size}
                                    className={`
                                        flex items-center justify-center h-8 text-xs font-medium border rounded-md cursor-pointer transition-colors
                                        ${selectedSize === size
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-background hover:bg-muted border-input"}
                                    `}
                                    onClick={() => handleSizeChange(size)}
                                >
                                    {size}
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Colour */}
                <AccordionItem value="colour">
                    <AccordionTrigger className="text-sm font-medium">Colour</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2 pt-2">
                            {colours.map((colour) => (
                                <div key={colour} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`col-${colour}`}
                                        checked={selectedColour === colour}
                                        onCheckedChange={() => handleColourChange(colour)}
                                    />
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full border border-muted-foreground/20"
                                            style={{ backgroundColor: colour.toLowerCase() }}
                                        />
                                        <Label htmlFor={`col-${colour}`} className="text-sm font-normal cursor-pointer">
                                            {colour}
                                        </Label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {/* Active Filters Summary / Clear */}
            {(filters.search || filters.minPrice !== undefined || filters.sortBy !== "newest" || (filters.categorySlug && filters.categorySlug !== "clothing") || filters.fabric || filters.size || filters.colour) && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full text-muted-foreground hover:text-foreground"
                >
                    <X className="mr-2 h-3 w-3" /> Clear Filters
                </Button>
            )}
        </div>
    );
}
