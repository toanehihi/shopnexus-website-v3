"use client"

import { use, useMemo } from "react"
import Link from "next/link"
import { useGetCategory, useListCategories } from "@/core/catalog/category"
import { useListProductCards } from "@/core/catalog/product.customer"
import { ProductGrid } from "@/components/product/product-grid"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronRight, SlidersHorizontal } from "lucide-react"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { useState } from "react"

export default function CategoryPage({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = use(params)
	const [sortBy, setSortBy] = useState<string>("default")

	const { data: category, isLoading: isLoadingCategory } = useGetCategory(id)
	const { data: subCategoriesData } = useListCategories({ limit: 20 })

	const {
		data: productsData,
		isLoading: isLoadingProducts,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useListProductCards({ limit: 24, category_id: [id] })

	const products = useMemo(() => {
		return productsData?.pages.flatMap((page) => page.data) ?? []
	}, [productsData])

	const subCategories = useMemo(() => {
		const all = subCategoriesData?.pages.flatMap((page) => page.data) ?? []
		return all.filter((cat) => cat.parent_id === id)
	}, [subCategoriesData, id])

	return (
		<div className="container mx-auto px-4 py-8">
			{/* Breadcrumb */}
			<nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
				<Link href="/" className="hover:text-primary transition-colors">
					Home
				</Link>
				<ChevronRight className="h-4 w-4" />
				<Link
					href="/categories"
					className="hover:text-primary transition-colors"
				>
					Categories
				</Link>
				<ChevronRight className="h-4 w-4" />
				{isLoadingCategory ? (
					<Skeleton className="h-4 w-24" />
				) : (
					<span className="text-foreground">{category?.name}</span>
				)}
			</nav>

			{/* Category Header */}
			<div className="mb-8">
				{isLoadingCategory ? (
					<div className="space-y-2">
						<Skeleton className="h-10 w-48" />
						<Skeleton className="h-5 w-96" />
					</div>
				) : (
					<>
						<h1 className="text-3xl font-bold">{category?.name}</h1>
						{category?.description && (
							<p className="text-muted-foreground mt-2">
								{category.description}
							</p>
						)}
					</>
				)}
			</div>

			{/* Subcategories */}
			{subCategories.length > 0 && (
				<div className="mb-8">
					<div className="flex gap-2 overflow-x-auto pb-2">
						{subCategories.map((subCat) => (
							<Button key={subCat.id} variant="outline" size="sm" asChild>
								<Link href={`/categories/${subCat.id}`}>{subCat.name}</Link>
							</Button>
						))}
					</div>
				</div>
			)}

			<div className="flex flex-col lg:flex-row gap-8">
				{/* Sidebar Filters */}
				<aside className="w-full lg:w-64 flex-shrink-0">
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-2 mb-4">
								<SlidersHorizontal className="h-4 w-4" />
								<span className="font-medium">Filters</span>
							</div>

							<div className="space-y-4">
								<div>
									<h4 className="font-medium text-sm mb-2">Price Range</h4>
									<div className="space-y-2">
										{[
											{ label: "Under $25", value: "0-25" },
											{ label: "$25 - $50", value: "25-50" },
											{ label: "$50 - $100", value: "50-100" },
											{ label: "$100 - $200", value: "100-200" },
											{ label: "Over $200", value: "200+" },
										].map((range) => (
											<label
												key={range.value}
												className="flex items-center gap-2 text-sm cursor-pointer"
											>
												<input type="checkbox" className="rounded" />
												<span className="text-muted-foreground">
													{range.label}
												</span>
											</label>
										))}
									</div>
								</div>

								<div>
									<h4 className="font-medium text-sm mb-2">Rating</h4>
									<div className="space-y-2">
										{[4, 3, 2, 1].map((rating) => (
											<label
												key={rating}
												className="flex items-center gap-2 text-sm cursor-pointer"
											>
												<input type="checkbox" className="rounded" />
												<span className="text-muted-foreground">
													{rating}+ Stars
												</span>
											</label>
										))}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</aside>

				{/* Product Grid */}
				<div className="flex-1">
					<div className="flex items-center justify-between mb-6">
						<p className="text-sm text-muted-foreground">
							{products.length} products
						</p>
						<Select value={sortBy} onValueChange={setSortBy}>
							<SelectTrigger className="w-48">
								<SelectValue placeholder="Sort by" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="default">Relevance</SelectItem>
								<SelectItem value="price-asc">Price: Low to High</SelectItem>
								<SelectItem value="price-desc">Price: High to Low</SelectItem>
								<SelectItem value="rating">Top Rated</SelectItem>
								<SelectItem value="newest">Newest</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<ProductGrid
						products={products}
						isLoading={isLoadingProducts}
						isFetchingNextPage={isFetchingNextPage}
						hasNextPage={hasNextPage}
						onLoadMore={() => fetchNextPage()}
					/>
				</div>
			</div>
		</div>
	)
}
