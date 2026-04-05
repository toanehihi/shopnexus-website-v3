"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { ProductCardSkeleton } from "@/components/product/product-card"

export function WishlistSkeleton() {
	return (
		<div className="space-y-6">
			<div>
				<Skeleton className="h-8 w-40" />
				<Skeleton className="h-4 w-24 mt-1" />
			</div>
			<div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
				{Array.from({ length: 8 }).map((_, i) => (
					<ProductCardSkeleton key={i} />
				))}
			</div>
		</div>
	)
}
