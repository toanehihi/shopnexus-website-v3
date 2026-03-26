"use client"

import { Suspense, useMemo, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useListProductCards, TProductCard } from "@/core/catalog/product.customer"
import { useListCategories } from "@/core/catalog/category"
import { ProductCard } from "@/components/product/product-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet"
import {
	ChevronRight,
	Search,
	SlidersHorizontal,
	X,
	Star,
	Loader2,
} from "lucide-react"

type PriceRange = {
	min: number | null
	max: number | null
}

const PRICE_RANGES = [
	{ label: "Under $25", min: 0, max: 25 },
	{ label: "$25 - $50", min: 25, max: 50 },
	{ label: "$50 - $100", min: 50, max: 100 },
	{ label: "$100 - $200", min: 100, max: 200 },
	{ label: "Over $200", min: 200, max: null },
]

function SearchContent() {
	const searchParams = useSearchParams()
	const router = useRouter()
	const query = searchParams.get("q") || ""
	const categoryParam = searchParams.get("category") || ""

	// Filter states
	const [sortBy, setSortBy] = useState<string>("relevance")
	const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([])
	const [customPriceMin, setCustomPriceMin] = useState("")
	const [customPriceMax, setCustomPriceMax] = useState("")
	const [minRating, setMinRating] = useState<number | null>(null)
	const [selectedCategories, setSelectedCategories] = useState<string[]>(
		categoryParam ? [categoryParam] : []
	)
	const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

	// Fetch data
	const {
		data: productsData,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useListProductCards({ limit: 48, search: query || undefined })

	const { data: categoriesData } = useListCategories({ limit: 50 })

	const categories = categoriesData?.pages.flatMap((page) => page.data) ?? []
	const allProducts = productsData?.pages.flatMap((page) => page.data) ?? []

	// Apply filters and sorting
	const filteredProducts = useMemo(() => {
		let result = [...allProducts]

		// Price filter
		if (selectedPriceRanges.length > 0 || customPriceMin || customPriceMax) {
			result = result.filter((product) => {
				const price = product.price

				// Check custom price range first
				if (customPriceMin || customPriceMax) {
					const min = customPriceMin ? parseFloat(customPriceMin) : 0
					const max = customPriceMax ? parseFloat(customPriceMax) : Infinity
					return price >= min && price <= max
				}

				// Check predefined ranges
				return selectedPriceRanges.some((rangeLabel) => {
					const range = PRICE_RANGES.find((r) => r.label === rangeLabel)
					if (!range) return false
					const meetsMin = price >= range.min
					const meetsMax = range.max === null || price <= range.max
					return meetsMin && meetsMax
				})
			})
		}

		// Rating filter
		if (minRating !== null) {
			result = result.filter((product) => product.rating.score * 5 >= minRating)
		}

		// Category filter
		if (selectedCategories.length > 0) {
			result = result.filter((product) =>
				selectedCategories.includes(product.category_id)
			)
		}

		// Sorting
		switch (sortBy) {
			case "price-asc":
				result.sort((a, b) => a.price - b.price)
				break
			case "price-desc":
				result.sort((a, b) => b.price - a.price)
				break
			case "rating":
				result.sort((a, b) => b.rating.score - a.rating.score)
				break
			case "newest":
				result.sort(
					(a, b) =>
						new Date(b.date_created).getTime() - new Date(a.date_created).getTime()
				)
				break
			default:
				// relevance - keep original order
				break
		}

		return result
	}, [allProducts, selectedPriceRanges, customPriceMin, customPriceMax, minRating, selectedCategories, sortBy])

	const activeFiltersCount = useMemo(() => {
		let count = 0
		if (selectedPriceRanges.length > 0) count++
		if (customPriceMin || customPriceMax) count++
		if (minRating !== null) count++
		if (selectedCategories.length > 0) count++
		return count
	}, [selectedPriceRanges, customPriceMin, customPriceMax, minRating, selectedCategories])

	const clearAllFilters = useCallback(() => {
		setSelectedPriceRanges([])
		setCustomPriceMin("")
		setCustomPriceMax("")
		setMinRating(null)
		setSelectedCategories([])
	}, [])

	const togglePriceRange = (label: string) => {
		setSelectedPriceRanges((prev) =>
			prev.includes(label) ? prev.filter((r) => r !== label) : [...prev, label]
		)
		// Clear custom price when using presets
		setCustomPriceMin("")
		setCustomPriceMax("")
	}

	const toggleCategory = (categoryId: string) => {
		setSelectedCategories((prev) =>
			prev.includes(categoryId)
				? prev.filter((c) => c !== categoryId)
				: [...prev, categoryId]
		)
	}

	// Filter sidebar content (shared between desktop and mobile)
	const FilterContent = () => (
		<div className="space-y-6">
			{/* Categories */}
			{categories.length > 0 && (
				<div>
					<h4 className="font-medium text-sm mb-3">Categories</h4>
					<div className="space-y-2 max-h-48 overflow-y-auto">
						{categories.map((category) => (
							<label
								key={category.id}
								className="flex items-center gap-2 text-sm cursor-pointer"
							>
								<Checkbox
									checked={selectedCategories.includes(category.id)}
									onCheckedChange={() => toggleCategory(category.id)}
								/>
								<span className="text-muted-foreground truncate">
									{category.name}
								</span>
							</label>
						))}
					</div>
				</div>
			)}

			<Separator />

			{/* Price Range */}
			<div>
				<h4 className="font-medium text-sm mb-3">Price Range</h4>
				<div className="space-y-2">
					{PRICE_RANGES.map((range) => (
						<label
							key={range.label}
							className="flex items-center gap-2 text-sm cursor-pointer"
						>
							<Checkbox
								checked={selectedPriceRanges.includes(range.label)}
								onCheckedChange={() => togglePriceRange(range.label)}
							/>
							<span className="text-muted-foreground">{range.label}</span>
						</label>
					))}
				</div>

				<div className="mt-3 pt-3 border-t">
					<Label className="text-xs text-muted-foreground">Custom Range</Label>
					<div className="flex items-center gap-2 mt-2">
						<Input
							type="number"
							placeholder="Min"
							className="h-8 text-sm"
							value={customPriceMin}
							onChange={(e) => {
								setCustomPriceMin(e.target.value)
								setSelectedPriceRanges([])
							}}
						/>
						<span className="text-muted-foreground">-</span>
						<Input
							type="number"
							placeholder="Max"
							className="h-8 text-sm"
							value={customPriceMax}
							onChange={(e) => {
								setCustomPriceMax(e.target.value)
								setSelectedPriceRanges([])
							}}
						/>
					</div>
				</div>
			</div>

			<Separator />

			{/* Rating */}
			<div>
				<h4 className="font-medium text-sm mb-3">Customer Rating</h4>
				<div className="space-y-2">
					{[4, 3, 2, 1].map((rating) => (
						<label
							key={rating}
							className="flex items-center gap-2 text-sm cursor-pointer"
						>
							<Checkbox
								checked={minRating === rating}
								onCheckedChange={(checked) =>
									setMinRating(checked ? rating : null)
								}
							/>
							<div className="flex items-center gap-1">
								{[...Array(5)].map((_, i) => (
									<Star
										key={i}
										className={`h-3 w-3 ${
											i < rating
												? "fill-yellow-400 text-yellow-400"
												: "text-muted-foreground/30"
										}`}
									/>
								))}
								<span className="text-muted-foreground ml-1">& Up</span>
							</div>
						</label>
					))}
				</div>
			</div>

			<Separator />

			<Button
				variant="outline"
				className="w-full"
				size="sm"
				onClick={clearAllFilters}
				disabled={activeFiltersCount === 0}
			>
				Clear All Filters
			</Button>
		</div>
	)

	return (
		<div className="container mx-auto px-4 py-8">
			{/* Breadcrumb */}
			<nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
				<Link href="/" className="hover:text-primary transition-colors">
					Home
				</Link>
				<ChevronRight className="h-4 w-4" />
				<span className="text-foreground">Search Results</span>
			</nav>

			{/* Search Header */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold">
					{query ? (
						<>
							Search results for &quot;
							<span className="text-primary">{query}</span>&quot;
						</>
					) : (
						"Browse Products"
					)}
				</h1>
				{!isLoading && (
					<p className="text-muted-foreground mt-2">
						{filteredProducts.length} of {allProducts.length} products
						{activeFiltersCount > 0 && ` (${activeFiltersCount} filter${activeFiltersCount > 1 ? "s" : ""} applied)`}
					</p>
				)}
			</div>

			{!query && allProducts.length === 0 && !isLoading ? (
				<div className="text-center py-16">
					<div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
						<Search className="h-10 w-10 text-muted-foreground" />
					</div>
					<h2 className="text-xl font-semibold mb-2">Start searching</h2>
					<p className="text-muted-foreground max-w-md mx-auto">
						Use the search bar above to find products. Try searching for
						categories, brands, or product names.
					</p>
				</div>
			) : (
				<div className="flex flex-col lg:flex-row gap-8">
					{/* Desktop Sidebar Filters */}
					<aside className="hidden lg:block w-64 flex-shrink-0">
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-base">
									<SlidersHorizontal className="h-4 w-4" />
									Filters
									{activeFiltersCount > 0 && (
										<Badge variant="secondary" className="ml-auto">
											{activeFiltersCount}
										</Badge>
									)}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<FilterContent />
							</CardContent>
						</Card>
					</aside>

					{/* Product Grid */}
					<div className="flex-1">
						{/* Mobile Filter & Sort Bar */}
						<div className="flex items-center justify-between mb-6 gap-4">
							{/* Mobile Filter Button */}
							<Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
								<SheetTrigger asChild>
									<Button variant="outline" size="sm" className="lg:hidden">
										<SlidersHorizontal className="h-4 w-4 mr-2" />
										Filters
										{activeFiltersCount > 0 && (
											<Badge variant="secondary" className="ml-2">
												{activeFiltersCount}
											</Badge>
										)}
									</Button>
								</SheetTrigger>
								<SheetContent side="left" className="w-80">
									<SheetHeader>
										<SheetTitle>Filters</SheetTitle>
									</SheetHeader>
									<div className="mt-6">
										<FilterContent />
									</div>
								</SheetContent>
							</Sheet>

							<p className="text-sm text-muted-foreground hidden sm:block">
								Showing {filteredProducts.length} results
							</p>

							<Select value={sortBy} onValueChange={setSortBy}>
								<SelectTrigger className="w-44">
									<SelectValue placeholder="Sort by" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="relevance">Relevance</SelectItem>
									<SelectItem value="price-asc">Price: Low to High</SelectItem>
									<SelectItem value="price-desc">Price: High to Low</SelectItem>
									<SelectItem value="rating">Top Rated</SelectItem>
									<SelectItem value="newest">Newest</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Active Filters */}
						{activeFiltersCount > 0 && (
							<div className="flex flex-wrap gap-2 mb-4">
								{selectedCategories.map((catId) => {
									const category = categories.find((c) => c.id === catId)
									return (
										<Badge key={catId} variant="secondary" className="gap-1">
											{category?.name}
											<button onClick={() => toggleCategory(catId)}>
												<X className="h-3 w-3" />
											</button>
										</Badge>
									)
								})}
								{selectedPriceRanges.map((range) => (
									<Badge key={range} variant="secondary" className="gap-1">
										{range}
										<button onClick={() => togglePriceRange(range)}>
											<X className="h-3 w-3" />
										</button>
									</Badge>
								))}
								{(customPriceMin || customPriceMax) && (
									<Badge variant="secondary" className="gap-1">
										${customPriceMin || "0"} - ${customPriceMax || "∞"}
										<button onClick={() => { setCustomPriceMin(""); setCustomPriceMax(""); }}>
											<X className="h-3 w-3" />
										</button>
									</Badge>
								)}
								{minRating !== null && (
									<Badge variant="secondary" className="gap-1">
										{minRating}+ Stars
										<button onClick={() => setMinRating(null)}>
											<X className="h-3 w-3" />
										</button>
									</Badge>
								)}
								<Button
									variant="ghost"
									size="sm"
									className="h-6 text-xs"
									onClick={clearAllFilters}
								>
									Clear all
								</Button>
							</div>
						)}

						{/* Products */}
						{isLoading ? (
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
								{[...Array(20)].map((_, i) => (
									<div key={i} className="space-y-2">
										<Skeleton className="aspect-[4/3] rounded-lg" />
										<Skeleton className="h-4 w-3/4" />
										<Skeleton className="h-4 w-1/2" />
									</div>
								))}
							</div>
						) : filteredProducts.length === 0 ? (
							<div className="text-center py-16">
								<div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
									<Search className="h-10 w-10 text-muted-foreground" />
								</div>
								<h2 className="text-xl font-semibold mb-2">No products found</h2>
								<p className="text-muted-foreground max-w-md mx-auto mb-6">
									{activeFiltersCount > 0
										? "Try adjusting your filters to find more products."
										: `We couldn't find any products matching "${query}". Try a different search term.`}
								</p>
								{activeFiltersCount > 0 ? (
									<Button onClick={clearAllFilters}>Clear Filters</Button>
								) : (
									<Button asChild>
										<Link href="/">Browse All Products</Link>
									</Button>
								)}
							</div>
						) : (
							<>
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
									{filteredProducts.map((product) => (
										<ProductCard key={product.id} product={product} />
									))}
								</div>

								{/* Load More */}
								{hasNextPage && (
									<div className="text-center mt-8">
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
												"Load More Products"
											)}
										</Button>
									</div>
								)}
							</>
						)}
					</div>
				</div>
			)}
		</div>
	)
}

export default function SearchPage() {
	return (
		<Suspense fallback={<SearchPageSkeleton />}>
			<SearchContent />
		</Suspense>
	)
}

function SearchPageSkeleton() {
	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex items-center gap-2 mb-8">
				<Skeleton className="h-4 w-12" />
				<Skeleton className="h-4 w-4" />
				<Skeleton className="h-4 w-24" />
			</div>
			<Skeleton className="h-10 w-80 mb-2" />
			<Skeleton className="h-5 w-32 mb-8" />
			<div className="flex gap-8">
				<div className="w-64 hidden lg:block">
					<Skeleton className="h-96 rounded-lg" />
				</div>
				<div className="flex-1">
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
						{Array.from({ length: 20 }).map((_, i) => (
							<div key={i} className="space-y-2">
								<Skeleton className="aspect-[4/3] rounded-lg" />
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-4 w-1/2" />
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}
