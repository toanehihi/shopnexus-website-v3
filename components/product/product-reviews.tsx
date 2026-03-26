"use client"

import { useState } from "react"
import Image from "next/image"
import {
	useListComments,
	useCreateComment,
	TComment,
} from "@/core/catalog/comment.customer"
import { useUploadFile } from "@/core/common/file"
import { useGetMe } from "@/core/account/account"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
	Upload,
	X,
} from "lucide-react"
import { cn } from "@/lib/utils"

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
	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useListComments({
			limit: 10,
			ref_type: "ProductSpu",
			ref_id: productId,
		})
	const createComment = useCreateComment()

	const [isWriteDialogOpen, setIsWriteDialogOpen] = useState(false)
	const [reviewScore, setReviewScore] = useState(5)
	const [reviewBody, setReviewBody] = useState("")
	const [reviewFiles, setReviewFiles] = useState<File[]>([])
	const [uploadedIds, setUploadedIds] = useState<string[]>([])
	const [previewUrls, setPreviewUrls] = useState<string[]>([])
	const uploadFile = useUploadFile()
	const [hoverScore, setHoverScore] = useState<number | null>(null)

	const comments = data?.pages.flatMap((page) => page.data) ?? []

	// Filter comments based on active filter
	const filteredComments = comments.filter((comment) => {
		switch (activeFilter) {
			case "5":
			case "4":
			case "3":
			case "2":
			case "1":
				return Math.round(comment.score * 5) === parseInt(activeFilter)
			case "with_comment":
				return comment.body && comment.body.trim().length > 0
			case "with_media":
				return comment.resources && comment.resources.length > 0
			default:
				return true
		}
	})

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || [])
		const newFiles = files.slice(0, 5 - reviewFiles.length) // max 5 files
		setReviewFiles(prev => [...prev, ...newFiles])
		setPreviewUrls(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))])
		e.target.value = "" // reset input
	}

	const removeFile = (index: number) => {
		URL.revokeObjectURL(previewUrls[index])
		setReviewFiles(prev => prev.filter((_, i) => i !== index))
		setPreviewUrls(prev => prev.filter((_, i) => i !== index))
	}

	const handleSubmitReview = async () => {
		try {
			// Upload files first
			const ids: string[] = []
			for (const file of reviewFiles) {
				const result = await uploadFile.mutateAsync(file)
				ids.push(result.id)
			}

			await createComment.mutateAsync({
				ref_type: "ProductSpu",
				ref_id: productId,
				body: reviewBody,
				score: reviewScore / 5,
				resource_ids: ids,
			})
			setIsWriteDialogOpen(false)
			setReviewBody("")
			setReviewScore(5)
			setReviewFiles([])
			previewUrls.forEach(url => URL.revokeObjectURL(url))
			setPreviewUrls([])
		} catch (err) {
			console.error("Failed to submit review:", err)
		}
	}

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
		<div className="space-y-6">
			{/* Section Header */}
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-semibold">Product Reviews</h2>
				<Button onClick={() => setIsWriteDialogOpen(true)} size="sm">
					<Pencil className="h-4 w-4 mr-2" />
					Write a Review
				</Button>
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

			{/* Write Review Dialog */}
			<Dialog open={isWriteDialogOpen} onOpenChange={setIsWriteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Write a Review</DialogTitle>
						<DialogDescription>
							Share your experience with this product
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						{/* Star Rating */}
						<div className="space-y-2">
							<label className="text-sm font-medium">Your Rating</label>
							<div className="flex items-center gap-1">
								{[1, 2, 3, 4, 5].map((star) => (
									<button
										key={star}
										type="button"
										onMouseEnter={() => setHoverScore(star)}
										onMouseLeave={() => setHoverScore(null)}
										onClick={() => setReviewScore(star)}
										className="p-1"
									>
										<Star
											className={cn(
												"h-8 w-8 transition-colors",
												star <= (hoverScore ?? reviewScore)
													? "fill-yellow-400 text-yellow-400"
													: "text-muted-foreground/30"
											)}
										/>
									</button>
								))}
								<span className="ml-2 text-sm text-muted-foreground">
									{reviewScore} out of 5
								</span>
							</div>
						</div>

						{/* Review Text */}
						<div className="space-y-2">
							<label className="text-sm font-medium">Your Review</label>
							<Textarea
								placeholder="What did you like or dislike about this product?"
								className="min-h-[120px]"
								value={reviewBody}
								onChange={(e) => setReviewBody(e.target.value)}
							/>
						</div>

						{/* File Upload */}
						<div className="space-y-2">
							<label className="text-sm font-medium">Photos / Videos</label>
							<div className="flex flex-wrap gap-2">
								{previewUrls.map((url, i) => (
									<div key={i} className="relative h-20 w-20 rounded-md overflow-hidden border">
										<img src={url} alt="" className="h-full w-full object-cover" />
										<button
											type="button"
											onClick={() => removeFile(i)}
											className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
										>
											<X className="h-3 w-3" />
										</button>
									</div>
								))}
								{reviewFiles.length < 5 && (
									<label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 transition-colors">
										<Upload className="h-5 w-5 text-muted-foreground" />
										<input
											type="file"
											accept="image/*,video/*"
											multiple
											onChange={handleFileSelect}
											className="hidden"
										/>
									</label>
								)}
							</div>
							<p className="text-xs text-muted-foreground">Up to 5 files. Images or videos.</p>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsWriteDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleSubmitReview}
							disabled={createComment.isPending || uploadFile.isPending || !reviewBody.trim()}
						>
							{uploadFile.isPending ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Uploading...
								</>
							) : createComment.isPending ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Submitting...
								</>
							) : (
								"Submit Review"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}

function ReviewCard({
	comment,
	formatDate,
}: {
	comment: TComment
	formatDate: (date: string) => string
}) {
	return (
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
					<div className="flex items-center justify-between gap-2">
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
					</div>

					<p className="text-sm text-muted-foreground mt-3">{comment.body}</p>

					{/* Review Images */}
					{comment.resources && comment.resources.length > 0 && (
						<div className="flex gap-2 mt-3 flex-wrap">
							{comment.resources.map((resource, idx) => (
								<div
									key={idx}
									className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity"
								>
									<Image
										src={resource.url}
										alt="Review"
										fill
										className="object-cover"
									/>
								</div>
							))}
						</div>
					)}

					{/* Helpful Buttons */}
					<div className="flex items-center gap-4 mt-4">
						<button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
							<ThumbsUp className="h-3.5 w-3.5" />
							Helpful ({comment.upvote})
						</button>
						<button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
							<ThumbsDown className="h-3.5 w-3.5" />
							({comment.downvote})
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
