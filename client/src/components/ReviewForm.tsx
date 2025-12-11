/**
 * Review Form Component
 * 
 * Form for submitting or editing a product review.
 * 
 * @module client/src/components/ReviewForm
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import StarRating from "./StarRating";
import { useCreateReview, useUpdateReview } from "@/hooks/useReviews";
import { Loader2 } from "lucide-react";

const reviewSchema = z.object({
    rating: z.number().min(1, "Please select a rating"),
    title: z.string().max(200, "Title is too long").optional(),
    comment: z.string().min(10, "Review must be at least 10 characters").max(2000, "Review is too long"),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
    productId: string;
    variantId?: string;
    initialData?: ReviewFormValues & { id: string };
    onSuccess?: () => void;
    onCancel?: () => void;
}

export default function ReviewForm({
    productId,
    variantId,
    initialData,
    onSuccess,
    onCancel,
}: ReviewFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const createReview = useCreateReview();
    const updateReview = useUpdateReview();

    const form = useForm<ReviewFormValues>({
        resolver: zodResolver(reviewSchema),
        defaultValues: {
            rating: initialData?.rating || 0,
            title: initialData?.title || "",
            comment: initialData?.comment || "",
        },
    });

    const onSubmit = async (values: ReviewFormValues) => {
        setIsSubmitting(true);
        try {
            if (initialData) {
                await updateReview.mutateAsync({
                    id: initialData.id,
                    data: values,
                });
            } else {
                await createReview.mutateAsync({
                    product_id: productId,
                    variant_id: variantId,
                    ...values,
                });
            }
            form.reset();
            onSuccess?.();
        } catch (error) {
            // Error handling is done in the hook
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-muted/30 p-6 rounded-lg border">
                <h3 className="text-lg font-medium">
                    {initialData ? "Edit Review" : "Write a Review"}
                </h3>

                {/* Rating Field */}
                <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Rating</FormLabel>
                            <FormControl>
                                <div className="flex items-center gap-2">
                                    <StarRating
                                        rating={field.value}
                                        interactive
                                        size="lg"
                                        onRatingChange={field.onChange}
                                    />
                                    <span className="text-sm text-muted-foreground ml-2">
                                        {field.value ? `${field.value} out of 5` : "Select a rating"}
                                    </span>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Title Field */}
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title (Optional)</FormLabel>
                            <FormControl>
                                <Input placeholder="Summarize your experience" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Comment Field */}
                <FormField
                    control={form.control}
                    name="comment"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Review</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="What did you like or dislike? How was the fit?"
                                    className="min-h-[120px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-3">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialData ? "Update Review" : "Submit Review"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
