"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useListPromotion } from "@/core/promotion/promotion.customer"
import { useListProductCards } from "@/core/catalog/product.customer"
import {
	ProductCard,
	ProductCardSkeleton,
} from "@/components/product/product-card"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronRight, Clock, Percent, Tag, Zap } from "lucide-react"

export default function DealsPage() {
	const { data: promotionsData, isLoading: isLoadingPromotions } =
		useListPromotion({ limit: 20 })

	const { data: productsData, isLoading: isLoadingProducts } =
		useListProductCards({ limit: 24 })

	const promotions = useMemo(() => {
		return promotionsData?.pages.flatMap((page) => page.data) ?? []
	}, [promotionsData])

	const products = useMemo(() => {
		return productsData?.pages.flatMap((page) => page.data) ?? []
	}, [productsData])

	// Filter products with discounts
	const discountedProducts = useMemo(() => {
		return products.filter((p) => p.original_price > p.price)
	}, [products])

	return (
		<div className="container mx-auto px-4 py-8">
			{/* Breadcrumb */}
			<nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
				<Link href="/" className="hover:text-primary transition-colors">
					Home
				</Link>
				<ChevronRight className="h-4 w-4" />
				<span className="text-foreground">Deals & Offers</span>
			</nav>

			{/* Hero Banner */}
			<Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground mb-8 overflow-hidden">
				<CardContent className="p-8 md:p-12 relative">
					<div className="max-w-xl">
						<Badge variant="secondary" className="mb-4">
							<Zap className="h-3 w-3 mr-1" />
							Limited Time
						</Badge>
						<h1 className="text-3xl md:text-4xl font-bold mb-4">
							Hot Deals & Exclusive Offers
						</h1>
						<p className="text-primary-foreground/80 mb-6">
							Save big on top products. Don&apos;t miss out on these incredible
							discounts and promotions!
						</p>
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-2">
								<Clock className="h-5 w-5" />
								<span className="text-sm">Deals refresh daily</span>
							</div>
						</div>
					</div>
					<div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-primary-foreground/10 to-transparent pointer-events-none" />
				</CardContent>
			</Card>

			{/* Active Promotions */}
			<section className="mb-12">
				<div className="flex items-center gap-2 mb-6">
					<Percent className="h-5 w-5 text-primary" />
					<h2 className="text-2xl font-bold">Active Promotions</h2>
				</div>

				{isLoadingPromotions ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{Array.from({ length: 3 }).map((_, i) => (
							<Card key={i}>
								<CardContent className="p-6">
									<Skeleton className="h-6 w-32 mb-2" />
									<Skeleton className="h-4 w-full mb-4" />
									<Skeleton className="h-9 w-24" />
								</CardContent>
							</Card>
						))}
					</div>
				) : promotions.length === 0 ? (
					<Card className="bg-muted/50">
						<CardContent className="p-8 text-center">
							<Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
							<p className="text-muted-foreground">
								No active promotions at the moment.
							</p>
							<p className="text-sm text-muted-foreground">
								Check back soon for new deals!
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{promotions.map((promo) => (
							<Card
								key={promo.id}
								className="group hover:shadow-lg transition-shadow"
							>
								<CardContent className="p-6">
									<div className="flex items-start justify-between mb-3">
										<Badge variant="secondary" className="text-sm">
											{promo.type}
										</Badge>
										{promo.date_ended && (
											<span className="text-xs text-muted-foreground">
												Ends {new Date(promo.date_ended).toLocaleDateString()}
											</span>
										)}
									</div>
									<h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
										{promo.title}
									</h3>
									{promo.description && (
										<p className="text-sm text-muted-foreground mb-4 line-clamp-2">
											{promo.description}
										</p>
									)}
									{promo.code && (
										<div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
											<code className="text-sm font-mono flex-1">
												{promo.code}
											</code>
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													navigator.clipboard.writeText(promo.code)
												}
											>
												Copy
											</Button>
										</div>
									)}
									{!promo.code && (
										<Button variant="outline" size="sm" asChild>
											<Link href="/">Shop Now</Link>
										</Button>
									)}
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</section>

			{/* Discounted Products */}
			<section>
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-2">
						<Tag className="h-5 w-5 text-primary" />
						<h2 className="text-2xl font-bold">Price Drops</h2>
					</div>
					<Button variant="ghost" asChild>
						<Link href="/">
							View All
							<ChevronRight className="ml-1 h-4 w-4" />
						</Link>
					</Button>
				</div>

				{isLoadingProducts ? (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
						{Array.from({ length: 12 }).map((_, i) => (
							<ProductCardSkeleton key={i} />
						))}
					</div>
				) : discountedProducts.length === 0 ? (
					<Card className="bg-muted/50">
						<CardContent className="p-8 text-center">
							<Percent className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
							<p className="text-muted-foreground">
								No discounted products available right now.
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
						{discountedProducts.map((product) => (
							<ProductCard key={product.id} product={product} />
						))}
					</div>
				)}
			</section>

			{/* Newsletter CTA */}
			<section className="mt-12">
				<Card className="bg-muted/50">
					<CardContent className="p-8 text-center">
						<h3 className="text-xl font-bold mb-2">Never Miss a Deal</h3>
						<p className="text-muted-foreground mb-4 max-w-md mx-auto">
							Subscribe to our newsletter and be the first to know about
							exclusive offers and flash sales.
						</p>
						<div className="flex gap-2 max-w-sm mx-auto">
							<input
								type="email"
								placeholder="Enter your email"
								className="flex-1 px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
							/>
							<Button>Subscribe</Button>
						</div>
					</CardContent>
				</Card>
			</section>
		</div>
	)
}
