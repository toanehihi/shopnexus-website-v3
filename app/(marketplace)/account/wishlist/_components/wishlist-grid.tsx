"use client"

import Link from "next/link"
import { UseQueryResult } from "@tanstack/react-query"
import { TProductCard } from "@/core/catalog/product.customer"
import {
	ProductCard,
	ProductCardSkeleton,
} from "@/components/product/product-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Trash2, Loader2 } from "lucide-react"

interface Favorite {
	id: number
	spu_id: string
}

interface WishlistGridProps {
	favorites: Favorite[]
	productQueries: UseQueryResult<TProductCard>[]
	onRemove: (spuId: string) => void
	isRemoving: boolean
}

export function WishlistGrid({
	favorites,
	productQueries,
	onRemove,
	isRemoving,
}: WishlistGridProps) {
	return (
		<div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
			{favorites.map((fav, index) => {
				const productQuery = productQueries[index]
				const product = productQuery?.data

				if (productQuery?.isLoading) {
					return (
						<div key={fav.id} className="relative">
							<ProductCardSkeleton />
						</div>
					)
				}

				if (!product) {
					// Fallback card when product data is unavailable
					return (
						<Card key={fav.id} className="overflow-hidden">
							<div className="relative aspect-square bg-muted flex items-center justify-center">
								<Heart className="h-8 w-8 text-muted-foreground/30" />
								<Button
									variant="ghost"
									size="icon"
									className="absolute top-1.5 right-1.5 h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow-sm text-destructive hover:text-destructive"
									onClick={() => onRemove(fav.spu_id)}
									disabled={isRemoving}
								>
									{isRemoving ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Trash2 className="h-4 w-4" />
									)}
								</Button>
							</div>
							<CardContent className="p-3">
								<p className="text-xs text-muted-foreground truncate">
									Product unavailable
								</p>
								<Link
									href={`/product/${fav.spu_id}`}
									className="text-sm font-medium text-primary hover:underline"
								>
									View Product
								</Link>
							</CardContent>
						</Card>
					)
				}

				return (
					<div key={fav.id} className="relative group/wishlist">
						<ProductCard product={product} />
						{/* Remove button overlay */}
						<Button
							variant="ghost"
							size="icon"
							className="absolute top-1.5 left-1.5 z-10 h-8 w-8 rounded-full bg-white/80 hover:bg-red-50 shadow-sm text-destructive hover:text-destructive opacity-0 group-hover/wishlist:opacity-100 transition-opacity duration-200"
							onClick={(e) => {
								e.preventDefault()
								e.stopPropagation()
								onRemove(fav.spu_id)
							}}
							disabled={isRemoving}
						>
							{isRemoving ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Trash2 className="h-4 w-4" />
							)}
						</Button>
					</div>
				)
			})}
		</div>
	)
}
