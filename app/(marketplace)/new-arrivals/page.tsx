"use client"

import { useListProductCards } from "@/core/catalog/product.customer"
import { ProductGrid } from "@/components/product/product-grid"
import { ProductCard } from "@/components/product/product-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Sparkles, Loader2 } from "lucide-react"

export default function NewArrivalsPage() {
	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useListProductCards({
			limit: 24,
		})

	const products = data?.pages.flatMap((page) => page.data) ?? []

	return (
		<div className="container mx-auto px-4 py-8">
			{/* Header */}
			<div className="text-center mb-8">
				<div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary mb-4">
					<Sparkles className="h-4 w-4" />
					<span className="text-sm font-medium">Fresh Drops</span>
				</div>
				<h1 className="text-4xl font-bold mb-3">New Arrivals</h1>
				<p className="text-muted-foreground max-w-2xl mx-auto">
					Discover our latest products, fresh from our catalog. Be the first to
					explore new styles and trending items.
				</p>
			</div>

			{/* Products Grid */}
			{isLoading ? (
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
					{[...Array(24)].map((_, i) => (
						<div key={i} className="space-y-2">
							<Skeleton className="aspect-[4/3] rounded-lg" />
							<Skeleton className="h-4 w-3/4" />
							<Skeleton className="h-4 w-1/2" />
						</div>
					))}
				</div>
			) : products.length === 0 ? (
				<div className="text-center py-16">
					<Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
					<h2 className="text-xl font-semibold mb-2">No new arrivals yet</h2>
					<p className="text-muted-foreground">
						Check back soon for fresh products!
					</p>
				</div>
			) : (
				<>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
						{products.map((product) => (
							<ProductCard key={product.id} product={product} />
						))}
					</div>

					{/* Load More */}
					{hasNextPage && (
						<div className="text-center mt-8">
							<Button
								variant="outline"
								size="lg"
								onClick={() => fetchNextPage()}
								disabled={isFetchingNextPage}
							>
								{isFetchingNextPage ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Loading...
									</>
								) : (
									"Load More Products"
								)}
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	)
}
