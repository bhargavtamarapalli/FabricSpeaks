/**
 * Image Uploader Component
 * 
 * Production-ready image upload component with comprehensive security.
 * 
 * Security Features:
 * - File type validation (MIME + extension)
 * - Magic number verification
 * - File size limits
 * - Filename sanitization
 * - Malicious content detection
 * 
 * Features:
 * - Drag and drop interface
 * - Multiple file support with graceful errors
 * - Image previews with lazy loading
 * - Progress indication
 * - Comprehensive error handling
 * - Logging and monitoring
 * - Memory leak prevention
 * 
 * @example
 * <ImageUploader
 *   value={currentImages}
 *   onChange={handleImagesChange}
 *   maxFiles={5}
 * />
 */

import { useCallback, useState, useEffect } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { X, Upload, Loader2, AlertCircle, CheckCircle, Star } from 'lucide-react';
import { cn } from '@/lib/admin/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
    validateFile,
    validateFiles,
    extractFileMetadata,
    formatFileSize,
    createFilePreview,
    revokeFilePreview,
    ALLOWED_IMAGE_TYPES,
    ALLOWED_IMAGE_EXTENSIONS,
    MAX_IMAGE_SIZE,
    MAX_IMAGES_PER_PRODUCT,
    type FileValidationResult,
} from '@/lib/validation/file-validation';
import { logger } from '@/lib/utils/logger';

export interface ImageUploaderProps {
    /** Current images (URLs or File objects) */
    value?: (string | File)[];

    /** Change handler */
    onChange?: (images: (string | File)[]) => void;

    /** Maximum number of files */
    maxFiles?: number;

    /** Maximum file size in bytes */
    maxSize?: number;

    /** Disabled state */
    disabled?: boolean;

    /** Additional CSS classes */
    className?: string;

    /** Main image identifier (URL or File) */
    mainImage?: string | File;

    /** Handler to set main image */
    onSetMainImage?: (image: string | File) => void;
}

export function ImageUploader({
    value = [],
    onChange,
    maxFiles = MAX_IMAGES_PER_PRODUCT,
    maxSize = MAX_IMAGE_SIZE,
    disabled = false,
    className,
    mainImage,
    onSetMainImage,
}: ImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();

    // Track preview URLs for cleanup
    const [previewUrls, setPreviewUrls] = useState<Map<string, string>>(new Map());

    // Cleanup preview URLs on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            previewUrls.forEach(url => revokeFilePreview(url));
        };
    }, []);

    // Handle file drop with comprehensive validation
    const onDrop = useCallback(
        async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
            logger.info('Files dropped', {
                acceptedCount: acceptedFiles.length,
                rejectedCount: rejectedFiles.length,
            });

            // Handle dropzone rejections (basic checks)
            if (rejectedFiles.length > 0) {
                rejectedFiles.forEach(({ file, errors }) => {
                    const errorMsg = errors.map(e => e.message).join(', ');
                    logger.warn('File rejected by dropzone', {
                        fileName: file.name,
                        errors: errorMsg,
                    });

                    toast({
                        variant: "destructive",
                        title: "File rejected",
                        description: `${file.name}: ${errorMsg}`,
                    });
                });
            }

            if (acceptedFiles.length === 0) {
                logger.debug('No acceptable files to process');
                return;
            }

            // Check total file count limit
            const totalFiles = value.length + acceptedFiles.length;
            if (totalFiles > maxFiles) {
                logger.warn('Too many files', {
                    current: value.length,
                    adding: acceptedFiles.length,
                    total: totalFiles,
                    maxFiles,
                });

                toast({
                    variant: "destructive",
                    title: "Too many files",
                    description: `You can only upload up to ${maxFiles} images. Currently have ${value.length}, trying to add ${acceptedFiles.length}.`,
                });
                return;
            }

            // Start validation
            setUploading(true);

            try {
                // Validate files with detailed security checks
                const validationResults = await logger.time(
                    'File validation',
                    () => validateFiles(acceptedFiles, maxFiles - value.length),
                    { fileCount: acceptedFiles.length }
                );

                // Separate valid and invalid files
                const validFiles: File[] = [];
                const invalidFiles: Array<{ file: File; errors: string[] }> = [];

                validationResults.forEach((result, index) => {
                    const file = acceptedFiles[index];

                    if (result.valid) {
                        validFiles.push(file);
                    } else {
                        invalidFiles.push({
                            file,
                            errors: result.errors.map(e => e.message),
                        });
                    }
                });

                // Show errors for invalid files
                if (invalidFiles.length > 0) {
                    invalidFiles.forEach(({ file, errors }) => {
                        logger.warn('File validation failed', {
                            fileName: file.name,
                            errors,
                        });

                        toast({
                            variant: "destructive",
                            title: `Invalid file: ${file.name}`,
                            description: errors.join('. '),
                            duration: 5000,
                        });
                    });
                }

                // Process valid files
                if (validFiles.length > 0) {
                    // Create preview URLs
                    const newPreviews = new Map(previewUrls);
                    validFiles.forEach(file => {
                        const previewUrl = createFilePreview(file);
                        newPreviews.set(file.name, previewUrl);
                    });
                    setPreviewUrls(newPreviews);

                    // Add files to current value
                    onChange?.([...value, ...validFiles]);

                    logger.info('Files added successfully', {
                        count: validFiles.length,
                        totalFiles: value.length + validFiles.length,
                    });

                    toast({
                        title: "Images added",
                        description: validFiles.length === 1
                            ? `Successfully added ${validFiles[0].name}`
                            : `Successfully added ${validFiles.length} images.`,
                    });
                }

                // Summary message if mixed results
                if (validFiles.length > 0 && invalidFiles.length > 0) {
                    toast({
                        title: "Partial success",
                        description: `Added ${validFiles.length} file(s). ${invalidFiles.length} file(s) were rejected.`,
                        duration: 5000,
                    });
                }

            } catch (error) {
                // Unexpected error during validation
                logger.error('File upload error', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    fileCount: acceptedFiles.length,
                });

                toast({
                    variant: "destructive",
                    title: "Upload failed",
                    description: "An unexpected error occurred. Please try again.",
                });
            } finally {
                setUploading(false);
            }
        },
        [value, maxFiles, onChange, toast, previewUrls]
    );

    // Remove image with cleanup
    const removeImage = (index: number) => {
        const imageToRemove = value[index];

        // Revoke preview URL if it's a File object
        if (imageToRemove instanceof File) {
            const previewUrl = previewUrls.get(imageToRemove.name);
            if (previewUrl) {
                revokeFilePreview(previewUrl);
                const newPreviews = new Map(previewUrls);
                newPreviews.delete(imageToRemove.name);
                setPreviewUrls(newPreviews);
            }
        }

        const newImages = [...value];
        newImages.splice(index, 1);
        onChange?.(newImages);

        logger.debug('Image removed', {
            index,
            fileName: imageToRemove instanceof File ? imageToRemove.name : imageToRemove,
            remaining: newImages.length,
        });
    };

    // Dropzone configuration
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': [],
            'image/png': [],
            'image/webp': [],
            'image/jpg': [],
        },
        maxSize,
        maxFiles: maxFiles - value.length,
        disabled: disabled || uploading || value.length >= maxFiles,
    });

    return (
        <div className={cn('space-y-4', className)}>
            {/* Dropzone Area */}
            <div
                {...getRootProps()}
                className={cn(
                    'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-700 bg-slate-900/50 p-8 transition-all',
                    isDragActive && 'border-indigo-500 bg-indigo-500/10',
                    disabled && 'cursor-not-allowed opacity-50',
                    !disabled && 'cursor-pointer hover:border-slate-600 hover:bg-slate-800/50'
                )}
            >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
                        {uploading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                        ) : (
                            <Upload className="h-6 w-6 text-slate-400" />
                        )}
                    </div>
                    <p className="mb-2 text-sm font-medium text-white">
                        {isDragActive ? (
                            "Drop images here"
                        ) : (
                            "Drag & drop images here, or click to select"
                        )}
                    </p>
                    <p className="text-xs text-slate-400">
                        Supported: JPG, PNG, WEBP (Max {formatFileSize(maxSize)})
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        {value.length} / {maxFiles} images used
                    </p>
                </div>
            </div>

            {/* Image Previews */}
            {value.length > 0 && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {value.map((image, index) => {
                        const isMain = mainImage === image;
                        return (
                            <div
                                key={index}
                                className={cn(
                                    "group relative aspect-square overflow-hidden rounded-lg border-2 bg-slate-800 transition-all",
                                    isMain
                                        ? "border-indigo-500 ring-4 ring-indigo-500/50 shadow-lg shadow-indigo-500/50"
                                        : "border-slate-700 hover:border-slate-600"
                                )}
                            >
                                {/* Image */}
                                <img
                                    src={typeof image === 'string' ? image : (image instanceof File ? URL.createObjectURL(image) : '')}
                                    alt={`Preview ${index + 1}`}
                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                    onLoad={(e) => {
                                        if (image instanceof File) {
                                            URL.revokeObjectURL((e.target as HTMLImageElement).src);
                                        }
                                    }}
                                />

                                {/* Main Image Indicator - Always Visible */}
                                {isMain && (
                                    <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-indigo-500 px-2 py-1 shadow-lg">
                                        <Star className="h-4 w-4 text-white fill-white" />
                                        <span className="text-xs font-semibold text-white">Main</span>
                                    </div>
                                )}

                                {/* Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                    {onSetMainImage && !isMain && (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="icon"
                                            className="h-8 w-8 rounded-full bg-white/90 hover:bg-white"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSetMainImage(image);
                                            }}
                                            title="Set as Main Image"
                                        >
                                            <Star className="h-4 w-4 text-slate-900" />
                                        </Button>
                                    )}

                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="h-8 w-8 rounded-full"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeImage(index);
                                        }}
                                        disabled={disabled}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* File Info - only show for File objects */}
                                {image instanceof File && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-center">
                                        <p className="truncate text-[10px] text-white">
                                            {image.name}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
