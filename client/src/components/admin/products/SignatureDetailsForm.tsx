import React from 'react';
import { ChevronDown, ChevronUp, Upload, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export interface SignatureDetails {
    tag?: string;
    certificate?: boolean;
    image?: string;
    video?: string;
    show_video?: boolean;
    colorHex?: string;
    details?: {
        fabric?: string;
        origin?: string;
        styling?: string;
    };
}

interface SignatureDetailsFormProps {
    value: SignatureDetails | null;
    onChange: (details: SignatureDetails) => void;
    productId?: string;
}

export function SignatureDetailsForm({ value, onChange, productId }: SignatureDetailsFormProps) {
    const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const details = value || {};

    const updateField = (field: keyof SignatureDetails, val: any) => {
        onChange({ ...details, [field]: val });
    };

    const updateDetailsField = (field: string, val: string) => {
        onChange({
            ...details,
            details: {
                ...details.details,
                [field]: val
            }
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);

            const token = localStorage.getItem('token');
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            updateField('image', data.url);
        } catch (error) {
            console.error('Image upload error:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const removeImage = () => {
        updateField('image', undefined);
    };

    return (
        <div className="space-y-6 rounded-lg border border-slate-800 bg-slate-900/50 p-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-6 bg-amber-500 text-white flex items-center justify-center font-serif font-bold text-xs rounded">
                    S
                </div>
                <h3 className="text-lg font-medium text-white">Signature Collection Details</h3>
            </div>

            {/* Tag and Certificate Row */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="signature-tag" className="text-slate-300">
                        Tag / Label
                    </Label>
                    <Input
                        id="signature-tag"
                        value={details.tag || ''}
                        onChange={(e) => updateField('tag', e.target.value)}
                        placeholder="e.g., Limited Edition, Exclusive"
                        className="bg-slate-950 border-slate-800 text-white"
                    />
                    <p className="text-xs text-slate-500">Displayed as badge on product card</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="signature-certificate" className="text-slate-300">
                        Authenticity Certificate
                    </Label>
                    <div className="flex items-center gap-2 pt-2">
                        <Switch
                            id="signature-certificate"
                            checked={details.certificate || false}
                            onCheckedChange={(checked) => updateField('certificate', checked)}
                        />
                        <span className="text-sm text-slate-400">
                            {details.certificate ? 'Guaranteed' : 'Not Certified'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Hero Image Upload */}
            <div className="space-y-2">
                <Label className="text-slate-300">
                    Hero Image <span className="text-red-400">*</span>
                </Label>
                <p className="text-xs text-slate-500 mb-2">
                    Main image displayed in signature collection card (recommended: 800x1200px)
                </p>

                {details.image ? (
                    <div className="relative">
                        <img
                            src={details.image}
                            alt="Signature hero"
                            className="w-full h-64 object-cover rounded-lg border border-slate-700"
                        />
                        <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-slate-600 bg-slate-950 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-10 h-10 mb-3 text-slate-500" />
                            <p className="mb-2 text-sm text-slate-400">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-slate-500">PNG, JPG, WEBP (MAX. 5MB)</p>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={isUploading}
                        />
                    </label>
                )}
                {isUploading && (
                    <p className="text-sm text-indigo-400">Uploading...</p>
                )}
            </div>

            {/* Color Hex */}
            <div className="space-y-2">
                <Label htmlFor="signature-color" className="text-slate-300">
                    Ambient Glow Color
                </Label>
                <div className="flex gap-2">
                    <Input
                        id="signature-color"
                        type="color"
                        value={details.colorHex || '#BF953F'}
                        onChange={(e) => updateField('colorHex', e.target.value)}
                        className="w-20 h-10 bg-slate-950 border-slate-800 cursor-pointer"
                    />
                    <Input
                        value={details.colorHex || '#BF953F'}
                        onChange={(e) => updateField('colorHex', e.target.value)}
                        placeholder="#BF953F"
                        className="flex-1 bg-slate-950 border-slate-800 text-white font-mono"
                    />
                </div>
                <p className="text-xs text-slate-500">Color used for card glow effect on hover</p>
            </div>

            {/* Video Section */}
            <div className="space-y-4 border-t border-slate-800 pt-4">
                <div className="space-y-2">
                    <Label htmlFor="signature-video" className="text-slate-300">
                        Product Video URL (Optional)
                    </Label>
                    <Input
                        id="signature-video"
                        type="url"
                        value={details.video || ''}
                        onChange={(e) => updateField('video', e.target.value)}
                        placeholder="https://example.com/video.mp4"
                        className="bg-slate-950 border-slate-800 text-white"
                    />
                </div>

                {details.video && (
                    <div className="flex items-center gap-2">
                        <Switch
                            id="signature-show-video"
                            checked={details.show_video || false}
                            onCheckedChange={(checked) => updateField('show_video', checked)}
                        />
                        <Label htmlFor="signature-show-video" className="text-sm text-slate-400 cursor-pointer">
                            Show video in product detail modal
                        </Label>
                    </div>
                )}
            </div>

            {/* Collapsible Details Section */}
            <div className="border-t border-slate-800 pt-4">
                <button
                    type="button"
                    onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                    className="flex items-center justify-between w-full text-left"
                >
                    <span className="text-sm font-medium text-slate-300">
                        Fabric & Origin Details
                    </span>
                    {isDetailsExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                </button>

                {isDetailsExpanded && (
                    <div className="mt-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="signature-fabric" className="text-slate-300">
                                Material / Fabric
                            </Label>
                            <Textarea
                                id="signature-fabric"
                                value={details.details?.fabric || ''}
                                onChange={(e) => updateDetailsField('fabric', e.target.value)}
                                placeholder="e.g., Premium Italian Wool, 100% Silk"
                                className="bg-slate-950 border-slate-800 text-white min-h-[80px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="signature-origin" className="text-slate-300">
                                Origin / Source
                            </Label>
                            <Input
                                id="signature-origin"
                                value={details.details?.origin || ''}
                                onChange={(e) => updateDetailsField('origin', e.target.value)}
                                placeholder="e.g., Milan, Italy"
                                className="bg-slate-950 border-slate-800 text-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="signature-styling" className="text-slate-300">
                                Styling Notes
                            </Label>
                            <Textarea
                                id="signature-styling"
                                value={details.details?.styling || ''}
                                onChange={(e) => updateDetailsField('styling', e.target.value)}
                                placeholder="e.g., Pairs perfectly with dark denim for a sophisticated evening look"
                                className="bg-slate-950 border-slate-800 text-white min-h-[80px]"
                            />
                        </div>
                    </div>
                )}
            </div>

            {!details.image && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <p className="text-sm text-amber-400">
                        ⚠️ Hero image is required for signature products to display properly
                    </p>
                </div>
            )}
        </div>
    );
}
