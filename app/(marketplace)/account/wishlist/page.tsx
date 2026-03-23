"use client"

import { useState } from "react"
import Link from "next/link"
import { useQueries } from "@tanstack/react-query"
import { useListFavorites, useRemoveFavorite } from "@/core/account/favorite"
import { customFetchStandard } from "@/lib/queryclient/custom-fetch"
import { TProductCard } from "@/core/catalog/product.customer"
import { ProductCard, ProductCardSkeleton } from "@/components/product/product-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Heart, Trash2, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "@/components/ui/sonner"

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
          <p className="text-muted-foreground">Something went wrong loading your wishlist.</p>
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
            <h3 className="text-lg font-semibold mb-2">Your wishlist is empty</h3>
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
                      onClick={() => handleRemove(fav.spu_id)}
                      disabled={removeFavorite.isPending}
                    >
                      {removeFavorite.isPending ? (
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
                    handleRemove(fav.spu_id)
                  }}
                  disabled={removeFavorite.isPending}
                >
                  {removeFavorite.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )
          })}
        </div>
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
                Items in your wishlist will be saved here. We&apos;ll notify you when prices drop!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function WishlistSkeleton() {
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
