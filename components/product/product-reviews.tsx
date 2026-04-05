"use client"

import { useState, useMemo } from "react"
import {
	useListComments,
	useUpdateComment,
	useVoteComment,
	useDeleteComment,
	useListReviewableOrders,
	TComment,
} from "@/core/catalog/comment.customer"
import { WriteReviewDialog } from "@/components/product/write-review-dialog"
import { useGetMe } from "@/core/account/account"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import {
	Star,
	ThumbsUp,
	ThumbsDown,
	MessageSquare,
	Loader2,
	Pencil,
	ImageIcon,
	MessageCircle,
	ShoppingBag,
	Trash2,
	MessageCircleReply,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MediaGrid } from "@/components/ui/media-viewer"
import { toast } from "@/components/ui/sonner"

interface ProductReviewsProps {
	productId: string
	rating?: {
		score: number
		total: number
		breakdown: Record<string, number>
	}
}

type FilterType = "all" | "5" | "4" | "3" | "2" | "1" | "with_comment" | "with_media"

export function ProductReviews({ productId, rating }: ProductReviewsProps) {
	const { data: user } = useGetMe()
	const isLoggedIn = !!user
	const [activeFilter, setActiveFilter] = useState<FilterType>("all")

	const scoreFilter = useMemo(() => {
		const starMap: Record<string, { score_from: number; score_to: number }> = {
			"5": { score_from: 0.81, score_to: 1.0 },
			"4": { score_from: 0.61, score_to: 0.8 },
			"3": { score_from: 0.41, score_to: 0.6 },
			"2": { score_from: 0.21, score_to: 0.4 },
			"1": { score_from: 0.0, score_to: 0.2 },
		}
		return starMap[activeFilter]
	}, [activeFilter])

	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useListComments({
			limit: 10,
			ref_type: "ProductSpu",
			ref_id: productId,
			...(scoreFilter && { score_from: scoreFilter.score_from, score_to: scoreFilter.score_to }),
		})
	const { data: reviewableOrders } = useListReviewableOrders(productId)
	const [isWriteDialogOpen, setIsWriteDialogOpen] = useState(false)

	const comments = data?.pages.flatMap((page) => page.data) ?? []

	// Filter comments based on active filter
	// Star filters are handled server-side via score_from/score_to params
	const filteredComments = comments.filter((comment) => {
		switch (activeFilter) {
			case "with_comment":
				return comment.body && comment.body.trim().length > 0
			case "with_media":
				return comment.resources && comment.resources.length > 0
			default:
				return true
		}
	})

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		})
	}

	// Calculate filter counts
	const getFilterCount = (filter: FilterType): number => {
		if (!rating) return 0
		switch (filter) {
			case "5":
			case "4":
			case "3":
			case "2":
			case "1":
				return rating.breakdown?.[filter] || 0
			case "with_comment":
				return comments.filter(c => c.body && c.body.trim().length > 0).length
			case "with_media":
				return comments.filter(c => c.resources && c.resources.length > 0).length
			default:
				return rating.total
		}
	}

	return (
		<div id="reviews" className="space-y-6">
			{/* Section Header */}
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold">Product Reviews</h2>
				{reviewableOrders && reviewableOrders.length > 0 && (
					<Button onClick={() => setIsWriteDialogOpen(true)} size="sm">
						<Pencil className="h-4 w-4 mr-2" />
						Write a Review
					</Button>
				)}
			</div>

			{/* Rating Summary - Shopee Style */}
			{rating && rating.total > 0 && (
				<div className="bg-primary/5 rounded-lg p-6">
					<div className="flex flex-col md:flex-row gap-8">
						{/* Overall Rating */}
						<div className="text-center md:text-left flex-shrink-0">
							<div className="flex items-baseline justify-center md:justify-start gap-1">
								<span className="text-4xl font-bold text-primary">
									{(rating.score * 5).toFixed(1)}
								</span>
								<span className="text-lg text-muted-foreground">/ 5</span>
							</div>
							<div className="flex items-center gap-1 mt-2 justify-center md:justify-start">
								{Array.from({ length: 5 }).map((_, i) => (
									<Star
										key={i}
										className={cn(
											"h-5 w-5",
											i < Math.round(rating.score * 5)
												? "fill-yellow-400 text-yellow-400"
												: "text-muted-foreground/30"
										)}
									/>
								))}
							</div>
							<p className="text-sm text-muted-foreground mt-1">
								{rating.total.toLocaleString()} reviews
							</p>
						</div>

						{/* Rating Breakdown Bars */}
						<div className="flex-1 space-y-2">
							{[5, 4, 3, 2, 1].map((stars) => {
								const count = rating.breakdown?.[String(stars)] || 0
								const percentage = rating.total > 0 ? (count / rating.total) * 100 : 0
								return (
									<div key={stars} className="flex items-center gap-3">
										<button
											onClick={() => setActiveFilter(String(stars) as FilterType)}
											className={cn(
												"text-sm w-12 flex items-center gap-1 hover:text-primary transition-colors",
												activeFilter === String(stars) && "text-primary font-medium"
											)}
										>
											{stars} <Star className="h-3 w-3 fill-current" />
										</button>
										<div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
											<div
												className="h-full bg-yellow-400 transition-all"
												style={{ width: `${percentage}%` }}
											/>
										</div>
										<span className="text-sm text-muted-foreground w-12 text-right">
											{count.toLocaleString()}
										</span>
									</div>
								)
							})}
						</div>
					</div>
				</div>
			)}

			{/* Filter Chips - Shopee Style */}
			<div className="flex flex-wrap gap-2">
				<Badge
					variant={activeFilter === "all" ? "default" : "outline"}
					className="cursor-pointer hover:bg-primary/10 transition-colors px-4 py-2"
					onClick={() => setActiveFilter("all")}
				>
					All ({rating?.total.toLocaleString() || 0})
				</Badge>
				{[5, 4, 3, 2, 1].map((stars) => (
					<Badge
						key={stars}
						variant={activeFilter === String(stars) ? "default" : "outline"}
						className="cursor-pointer hover:bg-primary/10 transition-colors px-4 py-2"
						onClick={() => setActiveFilter(String(stars) as FilterType)}
					>
						{stars} Star ({getFilterCount(String(stars) as FilterType).toLocaleString()})
					</Badge>
				))}
				<Badge
					variant={activeFilter === "with_comment" ? "default" : "outline"}
					className="cursor-pointer hover:bg-primary/10 transition-colors px-4 py-2"
					onClick={() => setActiveFilter("with_comment")}
				>
					<MessageCircle className="h-3 w-3 mr-1" />
					With Comments
				</Badge>
				<Badge
					variant={activeFilter === "with_media" ? "default" : "outline"}
					className="cursor-pointer hover:bg-primary/10 transition-colors px-4 py-2"
					onClick={() => setActiveFilter("with_media")}
				>
					<ImageIcon className="h-3 w-3 mr-1" />
					With Photos/Videos
				</Badge>
			</div>

			{/* Reviews List */}
			{isLoading ? (
				<div className="space-y-4">
					{[...Array(3)].map((_, i) => (
						<div key={i} className="border rounded-lg p-4">
							<div className="flex gap-4">
								<Skeleton className="h-10 w-10 rounded-full" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-16 w-full" />
								</div>
							</div>
						</div>
					))}
				</div>
			) : filteredComments.length === 0 ? (
				<div className="border rounded-lg p-8 text-center">
					<MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
					{activeFilter !== "all" ? (
						<>
							<h3 className="font-medium mb-2">No reviews match this filter</h3>
							<p className="text-muted-foreground text-sm mb-4">
								Try selecting a different filter
							</p>
							<Button variant="outline" onClick={() => setActiveFilter("all")}>
								Show All Reviews
							</Button>
						</>
					) : isLoggedIn ? (
						<>
							<h3 className="font-medium mb-2">No reviews yet</h3>
							<p className="text-muted-foreground text-sm mb-4">
								Be the first to review this product
							</p>
							<Button onClick={() => setIsWriteDialogOpen(true)}>
								Write a Review
							</Button>
						</>
					) : (
						<>
							<h3 className="font-medium mb-2">Reviews are hidden</h3>
							<p className="text-muted-foreground text-sm mb-4">
								Please{" "}
								<a href="/login" className="text-primary underline">
									log in
								</a>{" "}
								to see reviews.
							</p>
						</>
					)}
				</div>
			) : (
				<div className="space-y-4">
					{filteredComments.map((comment) => (
						<ReviewCard
							key={comment.id}
							comment={comment}
							formatDate={formatDate}
							currentUserId={user?.id}
						/>
					))}

					{hasNextPage && (
						<div className="text-center pt-4">
							<Button
								variant="outline"
								onClick={() => fetchNextPage()}
								disabled={isFetchingNextPage}
							>
								{isFetchingNextPage ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Loading...
									</>
								) : (
									"Load More Reviews"
								)}
							</Button>
						</div>
					)}
				</div>
			)}

			<WriteReviewDialog
				productId={productId}
				open={isWriteDialogOpen}
				onOpenChange={setIsWriteDialogOpen}
			/>
		</div>
	)
}

function ReviewCard({
	comment,
	formatDate,
	currentUserId,
}: {
	comment: TComment
	formatDate: (date: string) => string
	currentUserId?: string
}) {
	const voteMutation = useVoteComment()
	const deleteMutation = useDeleteComment()
	const updateMutation = useUpdateComment()
	const isOwn = currentUserId === comment.profile?.id

	const [showDeleteDialog, setShowDeleteDialog] = useState(false)
	const [showEditDialog, setShowEditDialog] = useState(false)
	const [editBody, setEditBody] = useState(comment.body)
	const [editScore, setEditScore] = useState(Math.round(comment.score * 5))
	const [editHoverScore, setEditHoverScore] = useState<number | null>(null)

	const handleDelete = async () => {
		try {
			await deleteMutation.mutateAsync({ ids: [comment.id] })
			setShowDeleteDialog(false)
			toast.success("Review deleted.")
		} catch {
			toast.error("Failed to delete review.")
		}
	}

	const handleEdit = async () => {
		try {
			await updateMutation.mutateAsync({
				id: comment.id,
				body: editBody,
				score: editScore / 5,
				resource_ids: comment.resources?.map((r) => r.id) ?? [],
			})
			setShowEditDialog(false)
			toast.success("Review updated.")
		} catch {
			toast.error("Failed to update review.")
		}
	}

	return (
		<>
			<div className="border rounded-lg p-4">
				<div className="flex gap-4">
					<Avatar className="h-10 w-10">
						<AvatarImage src={comment.profile?.avatar_url ?? undefined} />
						<AvatarFallback>
							{comment.profile?.name?.charAt(0) ||
								comment.profile?.username?.charAt(0) ||
								"U"}
						</AvatarFallback>
					</Avatar>

					<div className="flex-1 min-w-0">
						<div className="flex items-start justify-between gap-2">
							<div>
								<p className="font-medium">
									{comment.profile?.name ||
										comment.profile?.username ||
										"Anonymous"}
								</p>
								<div className="flex items-center gap-2 mt-1">
									<div className="flex items-center gap-0.5">
										{Array.from({ length: 5 }).map((_, i) => (
											<Star
												key={i}
												className={cn(
													"h-3 w-3",
													i < Math.round(comment.score * 5)
														? "fill-yellow-400 text-yellow-400"
														: "text-muted-foreground/30"
												)}
											/>
										))}
									</div>
									<span className="text-xs text-muted-foreground">
										{formatDate(comment.date_created)}
									</span>
								</div>
							</div>

							{/* Edit/Delete for own reviews */}
							{isOwn && (
								<div className="flex items-center gap-1">
									<button
										className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
										onClick={() => {
											setEditBody(comment.body)
											setEditScore(Math.round(comment.score * 5))
											setShowEditDialog(true)
										}}
										title="Edit review"
									>
										<Pencil className="h-3.5 w-3.5" />
									</button>
									<button
										className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
										onClick={() => setShowDeleteDialog(true)}
										title="Delete review"
									>
										<Trash2 className="h-3.5 w-3.5" />
									</button>
								</div>
							)}
						</div>

						{/* SKU variant + purchase date */}
						{(comment.order_item_name || comment.order_date) && (
							<div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
								{comment.order_item_name && (
									<span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
										<ShoppingBag className="h-3 w-3" />
										{comment.order_item_name}
									</span>
								)}
								{comment.order_date && (
									<span>Purchased {formatDate(comment.order_date)}</span>
								)}
							</div>
						)}

						<p className="text-sm text-muted-foreground mt-3">{comment.body}</p>

						{/* Review Media */}
						<MediaGrid resources={comment.resources} size="sm" className="mt-3" />

						{/* Helpful Buttons + Reply Count */}
						<div className="flex items-center gap-4 mt-4">
							<button
								className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
								disabled={voteMutation.isPending}
								onClick={() => voteMutation.mutate({ comment_id: comment.id, vote: 'upvote' })}
							>
								<ThumbsUp className="h-3.5 w-3.5" />
								Helpful ({comment.upvote})
							</button>
							<button
								className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
								disabled={voteMutation.isPending}
								onClick={() => voteMutation.mutate({ comment_id: comment.id, vote: 'downvote' })}
							>
								<ThumbsDown className="h-3.5 w-3.5" />
								({comment.downvote})
							</button>
							{comment.reply_count > 0 && (
								<span className="flex items-center gap-1.5 text-xs text-muted-foreground">
									<MessageCircleReply className="h-3.5 w-3.5" />
									{comment.reply_count} {comment.reply_count === 1 ? "reply" : "replies"}
								</span>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Edit Review Dialog */}
			<Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Review</DialogTitle>
						<DialogDescription>Update your rating and review text.</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<label className="text-sm font-medium">Your Rating</label>
							<div className="flex items-center gap-1">
								{[1, 2, 3, 4, 5].map((star) => (
									<button
										key={star}
										type="button"
										onMouseEnter={() => setEditHoverScore(star)}
										onMouseLeave={() => setEditHoverScore(null)}
										onClick={() => setEditScore(star)}
										className="p-1"
									>
										<Star
											className={cn(
												"h-8 w-8 transition-colors",
												star <= (editHoverScore ?? editScore)
													? "fill-yellow-400 text-yellow-400"
													: "text-muted-foreground/30"
											)}
										/>
									</button>
								))}
								<span className="ml-2 text-sm text-muted-foreground">
									{editScore} out of 5
								</span>
							</div>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium">Your Review</label>
							<Textarea
								className="min-h-[120px]"
								value={editBody}
								onChange={(e) => setEditBody(e.target.value)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
						<Button onClick={handleEdit} disabled={updateMutation.isPending || !editBody.trim()}>
							{updateMutation.isPending ? (
								<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
							) : (
								"Save Changes"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Review</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this review? This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
						<Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
							{deleteMutation.isPending ? (
								<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deleting...</>
							) : (
								"Delete Review"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
