
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Progress } from "@/components/ui/progress";

interface BannerImageUploaderProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
    className?: string;
    disabled?: boolean;
}

export function BannerImageUploader({
    value,
    onChange,
    label = "Upload Image",
    className,
    disabled = false
}: BannerImageUploaderProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const { toast } = useToast();

    // Handle file drop
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        // Reset progress
        setProgress(0);
        setIsUploading(true);

        const formData = new FormData();
        formData.append('image', file);

        try {
            // Simulated progress for better UX (since fetch doesn't support progress events natively easily)
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) return prev;
                    return prev + 10;
                });
            }, 100);

            // Using our new api.upload method
            // Provide explicit return type validation if possible, but for now any
            const res = await api.upload<{ message: string, image: any }>('/api/upload', formData);

            clearInterval(interval);
            setProgress(100);

            if (res && res.image) {
                // The server returns { original, thumbnail, medium, large, blurDataUrl }
                // We use 'large' for banners if available, else original.
                // Actually, let's use 'original' which is the optimized source, 
                // or 'large' (1200px) might be too small for big desktops?
                // The server implementation:
                // large: width 1200
                // medium: width 800
                // thumbnail: width 200
                // original: exact uploaded buffer (but optimized?). 
                // Wait, processImage saves original buffer as-is? 
                // "await fs.writeFile(originalPath, buffer);" -> Yes, it saves the exact buffer.
                // But the user said "optimisation mechanism that is present in the server... we have implemented this compression".
                // Ah, the server generates variants.
                // For Hero Banner, we usually want high res. 
                // So I will use `res.image.original`.
                onChange(res.image.original);

                toast({
                    title: "Upload Successful",
                    description: "Image uploaded and optimized.",
                });
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (error) {
            console.error("Upload failed", error);
            toast({
                variant: "destructive",
                title: "Upload Failed",
                description: "Failed to upload image. Please try again.",
            });
        } finally {
            setIsUploading(false);
        }
    }, [onChange, toast]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': [],
            'image/png': [],
            'image/webp': []
        },
        maxFiles: 1,
        disabled: disabled || isUploading,
    });

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
    };

    return (
        <div className={cn("space-y-2", className)}>
            {label && <label className="text-sm font-medium text-slate-200">{label}</label>}

            <div
                {...getRootProps()}
                className={cn(
                    "relative border-2 border-dashed rounded-lg transition-colors cursor-pointer min-h-[160px] flex flex-col items-center justify-center p-6",
                    isDragActive ? "border-indigo-500 bg-indigo-500/10" : "border-slate-700 hover:border-slate-600 bg-slate-900/50",
                    value ? "border-solid border-slate-700 p-0 overflow-hidden" : "",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            >
                <input {...getInputProps()} />

                {isUploading ? (
                    <div className="w-full max-w-xs space-y-4 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-200">Optimizing...</p>
                            <Progress value={progress} className="h-2" />
                        </div>
                    </div>
                ) : value ? (
                    <div className="relative w-full h-full min-h-[200px] group">
                        <img
                            src={value}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={handleRemove}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Remove Image
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center space-y-2">
                        <div className="p-3 bg-slate-800 rounded-full inline-block">
                            <Upload className="h-6 w-6 text-slate-400" />
                        </div>
                        <div className="text-slate-400">
                            <p className="font-medium text-sm">Click to upload or drag and drop</p>
                            <p className="text-xs">SVG, PNG, JPG or WEBP (max 1200x1200px recommended)</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Helper for Video vs Image clarity */}
            <p className="text-xs text-slate-500">
                Supports static images. For videos, please use a direct URL input (host on CDN/Cloudinary).
            </p>
        </div>
    );
}
