"use client"

import { useListProductCardsRecommended } from "@/core/catalog/product.customer"
import { useListCategories } from "@/core/catalog/category"
import {
	ProductCard,
	ProductCardSkeleton,
} from "@/components/product/product-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
	ArrowRight,
	Sparkles,
	Truck,
	Shield,
	RotateCcw,
	ChevronRight,
	Loader2,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useMemo, useState, useEffect } from "react"
import { useInView } from "react-intersection-observer"

const BATCH_SIZE = 12
const AUTO_SCROLL_LIMIT = 3

export default function HomePage() {
	const { data: allProducts, isLoading: isLoadingRecommended } =
		useListProductCardsRecommended({ limit: 100 })

	const { data: categoriesData, isLoading: isLoadingCategories } =
		useListCategories({ limit: 12 })

	const categories = useMemo(() => {
		return categoriesData?.pages.flatMap((page) => page.data) ?? []
	}, [categoriesData])

	// Client-side batching: reveal BATCH_SIZE items at a time
	const [visibleCount, setVisibleCount] = useState(BATCH_SIZE)
	const [autoScrollCount, setAutoScrollCount] = useState(0)

	const products = allProducts?.slice(0, visibleCount) ?? []
	const hasMore = allProducts ? visibleCount < allProducts.length : false
	const canAutoFetch = autoScrollCount < AUTO_SCROLL_LIMIT

	const { ref: sentinelRef, inView } = useInView()

	useEffect(() => {
		if (inView && canAutoFetch && hasMore) {
			setVisibleCount((prev) => prev + BATCH_SIZE)
			setAutoScrollCount((prev) => prev + 1)
		}
	}, [inView, canAutoFetch, hasMore])

	const handleShowMore = () => {
		setAutoScrollCount(0)
		setVisibleCount((prev) => prev + BATCH_SIZE)
	}

	return (
		<div className="space-y-8 pb-8">
			{/* Hero Section */}
			<section className="relative bg-gradient-to-br from-primary/5 via-primary/10 to-background overflow-hidden">
				<div className="container mx-auto px-4 py-12 md:py-16">
					<div className="max-w-xl space-y-4">
						<Badge variant="secondary" className="gap-1">
							<Sparkles className="h-3 w-3" />
							New Season Collection
						</Badge>
						<h1 className="text-3xl md:text-5xl font-bold tracking-tight">
							Discover Your
							<span className="text-primary"> Perfect Style</span>
						</h1>
						<p className="text-muted-foreground max-w-md">
							Explore our curated collection of premium products at unbeatable
							prices. Free shipping on orders over $50.
						</p>
						<div className="flex flex-wrap gap-3">
							<Button asChild>
								<Link href="/categories">
									Shop Now
									<ArrowRight className="ml-2 h-4 w-4" />
								</Link>
							</Button>
							<Button variant="outline" asChild>
								<Link href="/deals">View Deals</Link>
							</Button>
						</div>
					</div>
				</div>
				<div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
			</section>

			{/* Features */}
			<section className="container mx-auto px-4">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
					{[
						{ icon: Truck, title: "Free Shipping", desc: "Orders over $50" },
						{ icon: Shield, title: "Secure Payment", desc: "100% protected" },
						{ icon: RotateCcw, title: "Easy Returns", desc: "30-day policy" },
						{ icon: Sparkles, title: "Best Quality", desc: "Premium only" },
					].map(({ icon: Icon, title, desc }) => (
						<Card key={title} className="border bg-muted/30">
							<CardContent className="flex items-center gap-2.5 p-3">
								<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
									<Icon className="h-4 w-4 text-primary" />
								</div>
								<div>
									<p className="font-medium text-sm">{title}</p>
									<p className="text-xs text-muted-foreground">{desc}</p>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</section>

			{/* Categories */}
			<section className="container mx-auto px-4">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-bold">Shop by Category</h2>
					<Button variant="ghost" size="sm" asChild>
						<Link href="/categories">
							View All
							<ChevronRight className="ml-1 h-4 w-4" />
						</Link>
					</Button>
				</div>

				{isLoadingCategories ? (
					<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
						{Array.from({ length: 6 }).map((_, i) => (
							<Card key={i} className="border bg-muted/30">
								<CardContent className="p-3">
									<div className="aspect-square bg-muted animate-pulse rounded-lg mb-2" />
									<div className="h-3 bg-muted animate-pulse rounded w-2/3 mx-auto" />
								</CardContent>
							</Card>
						))}
					</div>
				) : (
					<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
						{categories.map((category) => {
							const thumbnail = category.resources?.[0]
							return (
								<Link key={category.id} href={`/categories/${category.id}`}>
									<Card className="border bg-muted/30 hover:bg-muted/50 transition-colors group cursor-pointer h-full overflow-hidden">
										<CardContent className="p-2 text-center">
											{thumbnail ? (
												<div className="aspect-square relative rounded-lg overflow-hidden mb-2">
													<Image
														src={thumbnail.url}
														alt={category.name}
														fill
														className="object-cover group-hover:scale-105 transition-transform duration-300"
														sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
													/>
												</div>
											) : (
												<div className="aspect-square rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors mb-2">
													<span className="text-2xl font-bold text-primary">
														{category.name.charAt(0)}
													</span>
												</div>
											)}
											<h3 className="text-xs font-medium group-hover:text-primary transition-colors line-clamp-1">
												{category.name}
											</h3>
										</CardContent>
									</Card>
								</Link>
							)
						})}
					</div>
				)}
			</section>

			{/* Recommended Products - Client-side infinite scroll */}
			<section className="container mx-auto px-4">
				<div className="flex items-center gap-2 mb-4">
					<Sparkles className="h-4 w-4 text-primary" />
					<h2 className="text-xl font-bold">Recommended for You</h2>
				</div>

				{isLoadingRecommended ? (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
						{Array.from({ length: 12 }).map((_, i) => (
							<ProductCardSkeleton key={i} />
						))}
					</div>
				) : (
					<>
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
							{products.map((product) => (
								<ProductCard key={product.id} product={product} />
							))}
						</div>

						{/* Sentinel for auto-reveal via intersection observer */}
						{canAutoFetch && hasMore && (
							<div ref={sentinelRef} className="h-px" />
						)}

						{/* Show More button after 3 auto-scrolls */}
						{!canAutoFetch && hasMore && (
							<div className="flex justify-center pt-6">
								<Button variant="outline" size="lg" onClick={handleShowMore}>
									Show More
								</Button>
							</div>
						)}
					</>
				)}
			</section>

			{/* CTA Banner */}
			<section className="container mx-auto px-4">
				<Card className="bg-primary text-primary-foreground overflow-hidden">
					<CardContent className="p-6 md:p-8 relative">
						<div className="max-w-md">
							<h2 className="text-xl md:text-2xl font-bold mb-2">
								Join Our Newsletter
							</h2>
							<p className="text-primary-foreground/80 text-sm mb-4">
								Get exclusive offers and 10% off your first order.
							</p>
							<div className="flex gap-2 flex-col sm:flex-row">
								<input
									type="email"
									placeholder="Enter your email"
									className="flex-1 px-3 py-2 rounded-lg bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary-foreground/30 text-sm"
								/>
								<Button variant="secondary" size="sm">
									Subscribe
								</Button>
							</div>
						</div>
						<div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-primary-foreground/5 to-transparent pointer-events-none" />
					</CardContent>
				</Card>
			</section>
		</div>
	)
}
