"use client"

import { useState } from "react"
import Link from "next/link"
import { useQueries } from "@tanstack/react-query"
import { useListFavorites, useRemoveFavorite } from "@/core/account/favorite"
import { customFetchStandard } from "@/lib/queryclient/custom-fetch"
import { TProductCard } from "@/core/catalog/product.customer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "@/components/ui/sonner"
import { WishlistSkeleton } from "./_components/wishlist-skeleton"
import { WishlistGrid } from "./_components/wishlist-grid"

const PAGE_SIZE = 12

export default function WishlistPage() {
	const [page, setPage] = useState(1)

	const {
		data: favoritesRes,
		isLoading: isFavoritesLoading,
		isError: isFavoritesError,
	} = useListFavorites({ page, limit: PAGE_SIZE })

	const favorites = favoritesRes?.data ?? []
	const total = favoritesRes?.pagination?.total ?? 0
	const totalPages = Math.ceil(total / PAGE_SIZE)

	// Fetch product cards for each favorite's spu_id
	const productQueries = useQueries({
		queries: favorites.map((fav) => ({
			queryKey: ["product", "card", fav.spu_id],
			queryFn: () =>
				customFetchStandard<TProductCard>(`catalog/product-card/${fav.spu_id}`),
			enabled: !!fav.spu_id,
			staleTime: 5 * 60 * 1000,
		})),
	})

	const removeFavorite = useRemoveFavorite()

	const handleRemove = async (spuId: string) => {
		try {
			await removeFavorite.mutateAsync(spuId)
			toast.success("Removed from wishlist")
		} catch {
			toast.error("Failed to remove item from wishlist")
		}
	}

	const isLoading = isFavoritesLoading
	const isEmpty = !isLoading && favorites.length === 0

	if (isLoading) {
		return <WishlistSkeleton />
	}

	if (isFavoritesError) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="text-2xl font-bold">My Wishlist</h1>
					<p className="text-muted-foreground">
						Something went wrong loading your wishlist.
					</p>
				</div>
				<Card>
					<CardContent className="p-8 text-center">
						<p className="text-muted-foreground">Please try again later.</p>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">My Wishlist</h1>
					<p className="text-muted-foreground">
						{total} {total === 1 ? "item" : "items"} saved
					</p>
				</div>
			</div>

			{isEmpty ? (
				/* Empty State */
				<Card>
					<CardContent className="p-8 text-center">
						<Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
						<h3 className="text-lg font-semibold mb-2">
							Your wishlist is empty
						</h3>
						<p className="text-muted-foreground mb-4">
							Save items you love by clicking the heart icon on products.
						</p>
						<Button asChild>
							<Link href="/">Start Shopping</Link>
						</Button>
					</CardContent>
				</Card>
			) : (
				/* Product Grid */
				<WishlistGrid
					favorites={favorites}
					productQueries={productQueries}
					onRemove={handleRemove}
					isRemoving={removeFavorite.isPending}
				/>
			)}

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex items-center justify-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={page === 1}
					>
						<ChevronLeft className="h-4 w-4" />
						Previous
					</Button>
					<span className="text-sm text-muted-foreground px-2">
						Page {page} of {totalPages}
					</span>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
						disabled={page >= totalPages}
					>
						Next
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			)}

			{/* Info Banner */}
			{!isEmpty && (
				<Card className="bg-muted/50">
					<CardContent className="p-4 flex items-center gap-4">
						<Heart className="h-8 w-8 text-primary flex-shrink-0" />
						<div>
							<p className="font-medium">Save for later</p>
							<p className="text-sm text-muted-foreground">
								Items in your wishlist will be saved here. We&apos;ll notify you
								when prices drop!
							</p>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
