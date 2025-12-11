/**
 * Review List Component
 * 
 * Displays a list of reviews for a product, including statistics and filtering.
 * 
 * @module client/src/components/ReviewList
 */

import { useState } from "react";
import { useProductReviews, useProductReviewStats, useDeleteReview, useVoteReview, useRemoveVote } from "@/hooks/useReviews";
import { useAuth } from "@/hooks/useAuth";
import StarRating from "./StarRating";
import ReviewForm from "./ReviewForm";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ThumbsUp, MoreVertical, Trash2, Edit2, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ReviewListProps {
    productId: string;
}

export default function ReviewList({ productId }: ReviewListProps) {
    const { user } = useAuth();
    const [page, setPage] = useState(0);
    const [isWritingReview, setIsWritingReview] = useState(false);
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
    const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);

    const { data: reviews, isLoading: reviewsLoading } = useProductReviews(productId, 10, page * 10);
    const { data: stats, isLoading: statsLoading } = useProductReviewStats(productId);

    const deleteReview = useDeleteReview();
    const voteReview = useVoteReview();
    const removeVote = useRemoveVote();

    const handleDelete = async () => {
        if (deleteReviewId) {
            await deleteReview.mutateAsync({ id: deleteReviewId, productId });
            setDeleteReviewId(null);
        }
    };

    const handleVote = (reviewId: string, hasVoted: boolean) => {
        if (!user) return; // Should trigger auth modal ideally

        if (hasVoted) {
            removeVote.mutate({ reviewId, productId });
        } else {
            voteReview.mutate({ reviewId, productId });
        }
    };

    if (reviewsLoading || statsLoading) {
        return <div className="animate-pulse space-y-4">
            <div className="h-40 bg-muted rounded-lg" />
            <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-lg" />)}
            </div>
        </div>;
    }

    const hasUserReviewed = reviews?.some(r => r.user_id === user?.id);

    return (
        <div className="space-y-10">
            {/* Header & Stats */}
            <div className="grid md:grid-cols-3 gap-8">
                {/* Overall Rating */}
                <div className="md:col-span-1 text-center md:text-left space-y-2">
                    <h3 className="text-2xl font-semibold">Customer Reviews</h3>
                    <div className="flex items-center justify-center md:justify-start gap-3">
                        <span className="text-5xl font-bold">{stats?.average_rating || 0}</span>
                        <div className="space-y-1">
                            <StarRating rating={stats?.average_rating || 0} size="md" />
                            <p className="text-sm text-muted-foreground">
                                Based on {stats?.total_reviews || 0} reviews
                            </p>
                        </div>
                    </div>

                    {!isWritingReview && !hasUserReviewed && user && (
                        <Button onClick={() => setIsWritingReview(true)} className="w-full mt-4">
                            Write a Review
                        </Button>
                    )}
                    {!user && (
                        <p className="text-sm text-muted-foreground mt-4">
                            Please sign in to write a review.
                        </p>
                    )}
                </div>

                {/* Rating Distribution */}
                <div className="md:col-span-2 space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => {
                        const count = stats?.rating_distribution[rating as keyof typeof stats.rating_distribution] || 0;
                        const percentage = stats?.total_reviews ? (count / stats.total_reviews) * 100 : 0;

                        return (
                            <div key={rating} className="flex items-center gap-3">
                                <span className="text-sm w-3">{rating}</span>
                                <StarRating rating={1} maxRating={1} size="sm" className="text-yellow-400" />
                                <Progress value={percentage} className="h-2" />
                                <span className="text-sm text-muted-foreground w-10 text-right">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <Separator />

            {/* Review Form */}
            {isWritingReview && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <ReviewForm
                        productId={productId}
                        onSuccess={() => setIsWritingReview(false)}
                        onCancel={() => setIsWritingReview(false)}
                    />
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-6">
                {reviews?.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No reviews yet. Be the first to share your thoughts!</p>
                    </div>
                ) : (
                    reviews?.map((review) => (
                        <div key={review.id} className="border-b pb-6 last:border-0">
                            {editingReviewId === review.id ? (
                                <ReviewForm
                                    productId={productId}
                                    initialData={{
                                        id: review.id,
                                        rating: review.rating,
                                        title: review.title || undefined,
                                        comment: review.comment,
                                    }}
                                    onSuccess={() => setEditingReviewId(null)}
                                    onCancel={() => setEditingReviewId(null)}
                                />
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium">
                                                {(review.user?.full_name?.[0] || review.user?.username?.[0] || "U").toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">
                                                        {review.user?.full_name || review.user?.username || "User"}
                                                    </span>
                                                    {review.verified_purchase && (
                                                        <span className="text-xs text-green-600 flex items-center gap-0.5 bg-green-50 px-1.5 py-0.5 rounded-full">
                                                            <CheckCircle2 className="h-3 w-3" /> Verified Purchase
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <StarRating rating={review.rating} size="sm" />
                                                    <span>•</span>
                                                    <span>{formatDistanceToNow(new Date(review.created_at || ""), { addSuffix: true })}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {user?.id === review.user_id && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setEditingReviewId(review.id)}>
                                                        <Edit2 className="h-4 w-4 mr-2" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => setDeleteReviewId(review.id)}
                                                        className="text-red-600 focus:text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>

                                    {review.title && (
                                        <h4 className="font-medium text-lg">{review.title}</h4>
                                    )}

                                    <p className="text-muted-foreground leading-relaxed">
                                        {review.comment}
                                    </p>

                                    <div className="flex items-center gap-4 pt-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`gap-2 ${review.user_has_voted ? "text-primary font-medium" : "text-muted-foreground"}`}
                                            onClick={() => handleVote(review.id, review.user_has_voted)}
                                            disabled={!user}
                                        >
                                            <ThumbsUp className={`h-4 w-4 ${review.user_has_voted ? "fill-current" : ""}`} />
                                            Helpful ({review.helpful_count || 0})
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteReviewId} onOpenChange={(open) => !open && setDeleteReviewId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Review</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete your review? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
