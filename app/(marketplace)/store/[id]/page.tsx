"use client"

import { use, useMemo } from "react"
import Link from "next/link"
import { useGetAccount } from "@/core/account/account"
import { useListProductCards } from "@/core/catalog/product.customer"
import { useChatContext } from "@/components/chat/chat-context"
import { ProductGrid } from "@/components/product/product-grid"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
	Store,
	MessageCircle,
	Package,
	Calendar,
	ChevronRight,
} from "lucide-react"

export default function StorePage({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = use(params)

	const { data: vendor, isLoading: isLoadingVendor } = useGetAccount(id)
	const { openChat } = useChatContext()

	const {
		data: productsData,
		isLoading: isLoadingProducts,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useListProductCards({ vendor_id: id, limit: 20 })

	const products = useMemo(() => {
		return productsData?.pages.flatMap((page) => page.data) ?? []
	}, [productsData])

	const handleChatWithSeller = () => {
		openChat(id)
	}

	if (isLoadingVendor) {
		return <StorePageSkeleton />
	}

	if (!vendor) {
		return (
			<div className="container mx-auto px-4 py-8 text-center">
				<div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
					<Store className="h-10 w-10 text-muted-foreground" />
				</div>
				<h1 className="text-xl sm:text-2xl font-bold mb-2">Store not found</h1>
				<p className="text-muted-foreground mb-6 text-sm sm:text-base">
					The store you&apos;re looking for doesn&apos;t exist or has been
					removed.
				</p>
				<Button asChild>
					<Link href="/">Back to Home</Link>
				</Button>
			</div>
		)
	}

	const memberSince = new Date(vendor.date_created).toLocaleDateString(
		"en-US",
		{
			month: "long",
			year: "numeric",
		},
	)

	return (
		<div className="container mx-auto px-4 py-4 sm:py-8">
			{/* Breadcrumb */}
			<nav className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground mb-6 lg:mb-8">
				<Link href="/" className="hover:text-primary transition-colors">
					Home
				</Link>
				<ChevronRight className="h-4 w-4" />
				<span className="text-foreground">
					{vendor.name || vendor.username || "Store"}
				</span>
			</nav>

			{/* Store Header */}
			<Card className="overflow-hidden mb-8">
				{/* Banner */}
				<div className="h-32 sm:h-48 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5" />

				<CardContent className="p-4 sm:p-6 -mt-12 sm:-mt-16 relative">
					<div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
						{/* Avatar */}
						<Avatar className="h-20 w-20 sm:h-28 sm:w-28 border-4 border-background shadow-lg">
							<AvatarImage src={vendor.avatar_url ?? undefined} />
							<AvatarFallback className="bg-primary/10 text-primary text-2xl sm:text-4xl font-bold">
								{vendor.name?.charAt(0) || vendor.username?.charAt(0) || "S"}
							</AvatarFallback>
						</Avatar>

						{/* Info */}
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2 flex-wrap">
								<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">
									{vendor.name || vendor.username || "Store"}
								</h1>
								{vendor.status === "Active" && (
									<Badge
										variant="secondary"
										className="bg-green-500/10 text-green-600 border-0 text-xs"
									>
										Verified Seller
									</Badge>
								)}
							</div>
							{vendor.description && (
								<p className="text-sm text-muted-foreground mt-1 sm:mt-2 line-clamp-2 max-w-2xl">
									{vendor.description}
								</p>
							)}
						</div>

						{/* Actions */}
						<div className="flex gap-2 sm:gap-3 flex-shrink-0">
							<Button onClick={handleChatWithSeller} className="gap-2">
								<MessageCircle className="h-4 w-4" />
								Chat with Seller
							</Button>
						</div>
					</div>

					<Separator className="my-4 sm:my-6" />

					{/* Stats */}
					<div className="flex items-center gap-6 sm:gap-8 text-sm">
						<div className="flex items-center gap-2 text-muted-foreground">
							<Package className="h-4 w-4" />
							<span>
								<span className="font-semibold text-foreground">
									{products.length}
								</span>{" "}
								Products
							</span>
						</div>
						<div className="flex items-center gap-2 text-muted-foreground">
							<Calendar className="h-4 w-4" />
							<span>
								Member since{" "}
								<span className="font-semibold text-foreground">
									{memberSince}
								</span>
							</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Products Section */}
			<div>
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
						<Store className="h-5 w-5 text-primary" />
						All Products
					</h2>
					<p className="text-sm text-muted-foreground">
						{products.length} products
					</p>
				</div>

				{!isLoadingProducts && products.length === 0 ? (
					<div className="text-center py-16">
						<div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
							<Package className="h-10 w-10 text-muted-foreground" />
						</div>
						<h3 className="text-lg font-semibold mb-2">
							This store has no products yet
						</h3>
						<p className="text-muted-foreground max-w-md mx-auto">
							Check back later for new products from this seller.
						</p>
					</div>
				) : (
					<ProductGrid
						products={products}
						isLoading={isLoadingProducts}
						isFetchingNextPage={isFetchingNextPage}
						hasNextPage={hasNextPage}
						onLoadMore={() => fetchNextPage()}
						skeletonCount={20}
					/>
				)}
			</div>
		</div>
	)
}

function StorePageSkeleton() {
	return (
		<div className="container mx-auto px-4 py-4 sm:py-8">
			{/* Breadcrumb skeleton */}
			<div className="hidden sm:flex items-center gap-2 mb-6 lg:mb-8">
				<Skeleton className="h-4 w-12" />
				<Skeleton className="h-4 w-4" />
				<Skeleton className="h-4 w-24" />
			</div>

			{/* Header skeleton */}
			<Card className="overflow-hidden mb-8">
				<Skeleton className="h-32 sm:h-48 rounded-none" />
				<CardContent className="p-4 sm:p-6 -mt-12 sm:-mt-16 relative">
					<div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
						<Skeleton className="h-20 w-20 sm:h-28 sm:w-28 rounded-full border-4 border-background" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-7 sm:h-9 w-48 sm:w-64" />
							<Skeleton className="h-4 w-full max-w-md" />
						</div>
						<Skeleton className="h-10 w-40" />
					</div>
					<Skeleton className="h-px w-full my-4 sm:my-6" />
					<div className="flex items-center gap-6 sm:gap-8">
						<Skeleton className="h-4 w-28" />
						<Skeleton className="h-4 w-40" />
					</div>
				</CardContent>
			</Card>

			{/* Products skeleton */}
			<div>
				<div className="flex items-center justify-between mb-6">
					<Skeleton className="h-6 w-32" />
					<Skeleton className="h-4 w-20" />
				</div>
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
					{Array.from({ length: 20 }).map((_, i) => (
						<div key={i} className="space-y-2">
							<Skeleton className="aspect-square rounded-lg" />
							<Skeleton className="h-4 w-3/4" />
							<Skeleton className="h-4 w-1/2" />
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
