"use client"

import { use, useState, useMemo, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import {
	useGetProductDetail,
	useListProductCardsRecommended,
} from "@/core/catalog/product.customer"
import { useGetAccount } from "@/core/account/account"
import { useUpdateCart } from "@/core/order/cart"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
	ProductCard,
	ProductCardSkeleton,
} from "@/components/product/product-card"
import { ProductReviews } from "@/components/product/product-reviews"
import {
	Star,
	Heart,
	Share2,
	Minus,
	Plus,
	ShoppingCart,
	Truck,
	Shield,
	RotateCcw,
	ChevronRight,
	Check,
	AlertCircle,
	Loader2,
	Store,
	MessageCircle,
	Package,
	Clock,
	BadgeCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/sonner"
import { useChatContext } from "@/components/chat/chat-context"

type SelectedAttributes = Record<string, string>

export default function ProductDetailPage({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = use(params)
	const { data: product, isLoading, error } = useGetProductDetail({ slug })
	const { data: vendor, isLoading: isLoadingVendor } = useGetAccount(product?.vendor_id ?? "")
	const { data: recommendedProducts, isLoading: isLoadingRecommended } =
		useListProductCardsRecommended({ limit: 4 })
	const updateCart = useUpdateCart()
	const { openChat } = useChatContext()

	const [selectedAttributes, setSelectedAttributes] = useState<SelectedAttributes>({})
	const [quantity, setQuantity] = useState(1)
	const [selectedImageIndex, setSelectedImageIndex] = useState(0)
	const [isAddingToCart, setIsAddingToCart] = useState(false)
	const [justAdded, setJustAdded] = useState(false)

	// Extract all unique attribute names and their possible values
	const attributeOptions = useMemo(() => {
		if (!product?.skus || product.skus.length === 0) return {}

		const options: Record<string, Set<string>> = {}

		product.skus.forEach((sku) => {
			sku.attributes?.forEach((attr) => {
				if (!options[attr.name]) {
					options[attr.name] = new Set()
				}
				options[attr.name].add(attr.value)
			})
		})

		// Convert sets to arrays
		const result: Record<string, string[]> = {}
		Object.entries(options).forEach(([name, values]) => {
			result[name] = Array.from(values)
		})

		return result
	}, [product?.skus])

	// Get attribute names in order
	const attributeNames = useMemo(() => Object.keys(attributeOptions), [attributeOptions])

	// Initialize selected attributes when product loads
	useEffect(() => {
		if (product?.skus && product.skus.length > 0 && attributeNames.length > 0) {
			// Initialize with the first SKU's attributes
			const firstSku = product.skus[0]
			const initial: SelectedAttributes = {}
			firstSku.attributes?.forEach((attr) => {
				initial[attr.name] = attr.value
			})
			setSelectedAttributes(initial)
		}
	}, [product?.skus, attributeNames])

	// Find the matching SKU based on selected attributes
	const selectedSku = useMemo(() => {
		if (!product?.skus || Object.keys(selectedAttributes).length === 0) {
			return product?.skus?.[0] || null
		}

		return product.skus.find((sku) => {
			if (!sku.attributes) return false
			return sku.attributes.every(
				(attr) => selectedAttributes[attr.name] === attr.value
			)
		}) || null
	}, [product?.skus, selectedAttributes])

	// Check which values are available for each attribute given current selections
	const getAvailableValues = (attributeName: string): Set<string> => {
		if (!product?.skus) return new Set()

		const available = new Set<string>()

		product.skus.forEach((sku) => {
			if (!sku.attributes) return

			// Check if this SKU matches all OTHER selected attributes
			const matchesOthers = Object.entries(selectedAttributes).every(([name, value]) => {
				if (name === attributeName) return true // Skip the current attribute
				const skuAttr = sku.attributes?.find((a) => a.name === name)
				return skuAttr?.value === value
			})

			if (matchesOthers) {
				const attr = sku.attributes.find((a) => a.name === attributeName)
				if (attr) {
					available.add(attr.value)
				}
			}
		})

		return available
	}

	const handleAttributeSelect = (attributeName: string, value: string) => {
		setSelectedAttributes((prev) => ({
			...prev,
			[attributeName]: value,
		}))
	}

	const discount =
		selectedSku && selectedSku.original_price > selectedSku.price
			? Math.round(
					((selectedSku.original_price - selectedSku.price) /
						selectedSku.original_price) *
						100
			  )
			: 0

	const handleAddToCart = async () => {
		if (selectedSku) {
			setIsAddingToCart(true)
			try {
				await updateCart.mutateAsync({
					sku_id: selectedSku.id,
					delta_quantity: quantity,
				})
				setJustAdded(true)
				toast.success("Added to cart", {
					description: `${product?.name} (${quantity} ${quantity > 1 ? "items" : "item"})`,
				})
				setTimeout(() => setJustAdded(false), 2000)
			} catch {
				toast.error("Failed to add to cart")
			} finally {
				setIsAddingToCart(false)
			}
		}
	}

	if (isLoading) {
		return <ProductDetailSkeleton />
	}

	if (error || !product) {
		return (
			<div className="container mx-auto px-4 py-8 sm:py-12 text-center">
				<h1 className="text-xl sm:text-2xl font-bold mb-4">Product not found</h1>
				<p className="text-muted-foreground mb-6 text-sm sm:text-base">
					The product you&apos;re looking for doesn&apos;t exist or has been
					removed.
				</p>
				<Button asChild>
					<Link href="/">Back to Home</Link>
				</Button>
			</div>
		)
	}

	const hasMultipleVariants = product.skus && product.skus.length > 1 && attributeNames.length > 0

	return (
		<div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
			{/* Breadcrumb - Hidden on mobile, visible on sm+ */}
			<nav className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground mb-6 lg:mb-8">
				<Link href="/" className="hover:text-primary transition-colors">
					Home
				</Link>
				<ChevronRight className="h-4 w-4 flex-shrink-0" />
				{product.category && (
					<>
						<Link
							href={`/categories/${product.category.id}`}
							className="hover:text-primary transition-colors"
						>
							{product.category.name}
						</Link>
						<ChevronRight className="h-4 w-4 flex-shrink-0" />
					</>
				)}
				<span className="text-foreground truncate max-w-[200px]">{product.name}</span>
			</nav>

			{/* Mobile Back Button */}
			<div className="sm:hidden mb-4">
				<Button variant="ghost" size="sm" asChild className="-ml-2">
					<Link href="/">
						<ChevronRight className="h-4 w-4 rotate-180 mr-1" />
						Back
					</Link>
				</Button>
			</div>

			<div className="grid lg:grid-cols-2 gap-6 lg:gap-12">
				{/* Product Images */}
				<div className="space-y-3 sm:space-y-4">
					<div className="relative aspect-square rounded-lg sm:rounded-xl overflow-hidden bg-muted">
						{product.resources?.[selectedImageIndex]?.url ? (
							<Image
								src={product.resources[selectedImageIndex].url}
								alt={product.name}
								fill
								className="object-cover"
								priority
							/>
						) : (
							<div className="flex items-center justify-center h-full">
								<ShoppingCart className="h-16 w-16 sm:h-24 sm:w-24 text-muted-foreground/30" />
							</div>
						)}
						{discount > 0 && (
							<Badge className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-destructive hover:bg-destructive text-sm sm:text-lg px-2 sm:px-3 py-0.5 sm:py-1">
								-{discount}%
							</Badge>
						)}
					</div>

					{/* Thumbnail Gallery */}
					{product.resources && product.resources.length > 1 && (
						<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
							{product.resources.map((resource, index) => (
								<button
									key={resource.id}
									onClick={() => setSelectedImageIndex(index)}
									className={cn(
										"relative h-14 w-14 sm:h-20 sm:w-20 rounded-md sm:rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors",
										selectedImageIndex === index
											? "border-primary"
											: "border-transparent hover:border-muted-foreground/30"
									)}
								>
									<Image
										src={resource.url}
										alt={`${product.name} ${index + 1}`}
										fill
										className="object-cover"
									/>
								</button>
							))}
						</div>
					)}
				</div>

				{/* Product Info */}
				<div className="space-y-4 sm:space-y-6">
					{/* Brand */}
					{product.brand && (
						<Link
							href={`/brands/${product.brand.id}`}
							className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
						>
							{product.brand.name}
						</Link>
					)}

					{/* Title */}
					<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">{product.name}</h1>

					{/* Rating */}
					{product.rating && product.rating.total > 0 && (
						<div className="flex items-center gap-2 sm:gap-4 flex-wrap">
							<div className="flex items-center gap-0.5 sm:gap-1">
								{Array.from({ length: 5 }).map((_, i) => (
									<Star
										key={i}
										className={cn(
											"h-4 w-4 sm:h-5 sm:w-5",
											i < Math.round(product.rating.score * 5)
												? "fill-yellow-400 text-yellow-400"
												: "text-muted-foreground/30"
										)}
									/>
								))}
							</div>
							<span className="text-xs sm:text-sm">
								<span className="font-medium">
									{(product.rating.score * 5).toFixed(1)}
								</span>
								<span className="text-muted-foreground">
									{" "}
									({product.rating.total} reviews)
								</span>
							</span>
						</div>
					)}

					{/* Price */}
					<div className="space-y-1">
						<div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
							<span className={cn("text-2xl sm:text-3xl font-bold", discount > 0 && "text-red-600")}>
								{selectedSku ? formatPrice(selectedSku.price) : "N/A"}
							</span>
							{selectedSku &&
								selectedSku.original_price > selectedSku.price && (
									<span className="text-base sm:text-xl text-muted-foreground line-through">
										{formatPrice(selectedSku.original_price)}
									</span>
								)}
						</div>
						{discount > 0 && (
							<p className="text-xs sm:text-sm text-green-600 font-medium">
								You save{" "}
								{formatPrice(
									(selectedSku?.original_price ?? 0) - (selectedSku?.price ?? 0)
								)}
							</p>
						)}
					</div>

					{/* Promotions */}
					{product.promotions && product.promotions.length > 0 && (
						<div className="flex flex-wrap gap-1.5 sm:gap-2">
							{product.promotions.map((promo) => (
								<Badge key={promo.id} variant="secondary" className="text-xs">
									{promo.title}
								</Badge>
							))}
						</div>
					)}

					<Separator />

					{/* Variant Selection */}
					{hasMultipleVariants && (
						<div className="space-y-4 sm:space-y-5">
							{attributeNames.map((attributeName) => {
								const values = attributeOptions[attributeName]
								const availableValues = getAvailableValues(attributeName)
								const selectedValue = selectedAttributes[attributeName]

								return (
									<div key={attributeName} className="space-y-2 sm:space-y-3">
										<div className="flex items-center justify-between">
											<p className="text-sm sm:text-base font-medium">
												{attributeName}:{" "}
												<span className="text-muted-foreground font-normal">
													{selectedValue || "Select"}
												</span>
											</p>
										</div>
										<div className="flex flex-wrap gap-1.5 sm:gap-2">
											{values.map((value) => {
												const isSelected = selectedValue === value
												const isAvailable = availableValues.has(value)

												return (
													<Button
														key={value}
														variant={isSelected ? "default" : "outline"}
														size="sm"
														onClick={() => handleAttributeSelect(attributeName, value)}
														disabled={!isAvailable}
														className={cn(
															"relative min-w-[50px] sm:min-w-[60px] text-xs sm:text-sm h-8 sm:h-9 transition-all",
															!isAvailable && "opacity-50 line-through",
															isSelected && "ring-2 ring-primary ring-offset-1 sm:ring-offset-2"
														)}
													>
														{value}
														{isSelected && (
															<Check className="h-3 w-3 ml-1" />
														)}
													</Button>
												)
											})}
										</div>
									</div>
								)
							})}

							{/* Selected variant info */}
							{selectedSku && (
								<div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-muted/50 rounded-lg p-2.5 sm:p-3">
									<Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
									<span className="truncate">
										Selected: {selectedSku.attributes?.map(a => a.value).join(" / ")}
									</span>
									{selectedSku.taken !== undefined && selectedSku.taken > 0 && (
										<Badge variant="secondary" className="ml-auto text-xs flex-shrink-0">
											{selectedSku.taken}+ sold
										</Badge>
									)}
								</div>
							)}

							{!selectedSku && Object.keys(selectedAttributes).length > 0 && (
								<div className="flex items-center gap-2 text-xs sm:text-sm text-destructive bg-destructive/10 rounded-lg p-2.5 sm:p-3">
									<AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
									<span>This combination is not available</span>
								</div>
							)}
						</div>
					)}

					{/* Single SKU display */}
					{!hasMultipleVariants && product.skus && product.skus.length === 1 && (
						<div className="text-xs sm:text-sm text-muted-foreground">
							{selectedSku?.taken !== undefined && selectedSku.taken > 0 && (
								<span>{selectedSku.taken}+ sold</span>
							)}
						</div>
					)}

					{/* Quantity */}
					<div className="space-y-2 sm:space-y-3">
						<p className="text-sm sm:text-base font-medium">Quantity:</p>
						<div className="flex items-center gap-3">
							<div className="flex items-center border rounded-lg">
								<Button
									variant="ghost"
									size="icon"
									className="h-9 w-9 sm:h-10 sm:w-10 rounded-r-none"
									onClick={() => setQuantity(Math.max(1, quantity - 1))}
									disabled={quantity <= 1}
								>
									<Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
								</Button>
								<span className="w-10 sm:w-12 text-center font-medium text-sm sm:text-base">{quantity}</span>
								<Button
									variant="ghost"
									size="icon"
									className="h-9 w-9 sm:h-10 sm:w-10 rounded-l-none"
									onClick={() => setQuantity(quantity + 1)}
								>
									<Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
								</Button>
							</div>
						</div>
					</div>

					{/* Actions */}
					<div className="flex gap-2 sm:gap-3">
						<Button
							size="lg"
							className={cn(
								"flex-1 h-11 sm:h-12 text-sm sm:text-base transition-all",
								justAdded && "bg-green-600 hover:bg-green-700"
							)}
							onClick={handleAddToCart}
							disabled={isAddingToCart || !selectedSku}
						>
							{justAdded ? (
								<>
									<Check className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
									Added!
								</>
							) : isAddingToCart ? (
								<>
									<Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
									Adding...
								</>
							) : (
								<>
									<ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
									Add to Cart
								</>
							)}
						</Button>
						<Button size="lg" variant="outline" className="h-11 w-11 sm:h-12 sm:w-12 p-0">
							<Heart className="h-4 w-4 sm:h-5 sm:w-5" />
						</Button>
						<Button size="lg" variant="outline" className="h-11 w-11 sm:h-12 sm:w-12 p-0 hidden sm:flex">
							<Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
						</Button>
					</div>

					{/* Features */}
					<div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2 sm:pt-4">
						{[
							{ icon: Truck, text: "Free Shipping" },
							{ icon: Shield, text: "Secure Payment" },
							{ icon: RotateCcw, text: "Easy Returns" },
						].map(({ icon: Icon, text }) => (
							<div
								key={text}
								className="flex flex-col items-center gap-1.5 sm:gap-2 text-center"
							>
								<div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-muted">
									<Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
								</div>
								<span className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{text}</span>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Product Details Section */}
			<div className="mt-8 sm:mt-12 space-y-4 sm:space-y-6">
				{/* Vendor Store Card */}
				<Card className="overflow-hidden">
					<CardContent className="p-0">
						{isLoadingVendor ? (
							<div className="p-4 sm:p-6">
								<div className="flex items-center gap-3 sm:gap-4">
									<Skeleton className="h-12 w-12 sm:h-16 sm:w-16 rounded-full" />
									<div className="flex-1 space-y-2">
										<Skeleton className="h-4 sm:h-5 w-32 sm:w-40" />
										<Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
									</div>
								</div>
							</div>
						) : vendor ? (
							<div className="flex flex-col">
								{/* Vendor Info */}
								<div className="p-4 sm:p-6">
									<div className="flex items-start gap-3 sm:gap-4">
										<Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 border-primary/10">
											<AvatarImage src={vendor.avatar_url ?? undefined} />
											<AvatarFallback className="bg-primary/5 text-primary text-lg sm:text-xl font-semibold">
												{vendor.name?.charAt(0) || vendor.username?.charAt(0) || "S"}
											</AvatarFallback>
										</Avatar>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 flex-wrap">
												<h3 className="font-semibold text-base sm:text-lg truncate">
													{vendor.name || vendor.username || "Store"}
												</h3>
												{vendor.status === "Active" && (
													<Badge variant="secondary" className="bg-green-500/10 text-green-600 border-0 text-xs">
														<BadgeCheck className="h-3 w-3 mr-0.5 sm:mr-1" />
														<span className="hidden sm:inline">Verified</span>
													</Badge>
												)}
											</div>
											{vendor.description && (
												<p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
													{vendor.description}
												</p>
											)}
											<div className="flex items-center gap-4 mt-2 sm:mt-3 text-xs sm:text-sm text-muted-foreground">
												<div className="flex items-center gap-1">
													<Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
													<span>Joined {new Date(vendor.date_created).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
												</div>
											</div>
										</div>
									</div>
								</div>

								{/* Vendor Stats & Actions */}
								<div className="border-t bg-muted/30 p-4 sm:p-6">
									<div className="grid grid-cols-3 gap-4 text-center mb-4">
										<div>
											<div className="text-base sm:text-lg font-bold text-primary">4.8</div>
											<div className="text-[10px] sm:text-xs text-muted-foreground">Rating</div>
										</div>
										<div>
											<div className="text-base sm:text-lg font-bold text-primary">98%</div>
											<div className="text-[10px] sm:text-xs text-muted-foreground">Response</div>
										</div>
										<div>
											<div className="text-base sm:text-lg font-bold text-primary">1.2k</div>
											<div className="text-[10px] sm:text-xs text-muted-foreground">Products</div>
										</div>
									</div>
									<div className="flex gap-2">
										<Button variant="outline" size="sm" className="flex-1 h-9 text-xs sm:text-sm" asChild>
											<Link href={`/store/${vendor.id}`}>
												<Store className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
												Visit Store
											</Link>
										</Button>
										<Button
											variant="outline"
											size="sm"
											className="flex-1 h-9 text-xs sm:text-sm"
											onClick={() => openChat(vendor.id)}
										>
											<MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
											Chat
										</Button>
									</div>
								</div>
							</div>
						) : (
							<div className="p-4 sm:p-6 text-center text-muted-foreground">
								<Store className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
								<p className="text-xs sm:text-sm">Store information unavailable</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Specifications & Description Card */}
				<Card>
					<CardContent className="p-4 sm:p-6 space-y-6 sm:space-y-8">
						{/* Specifications Section */}
						<div>
							<h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
								<Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
								Specifications
							</h2>
							{product.specifications && product.specifications.length > 0 ? (
								<div className="rounded-lg overflow-hidden border">
									{product.specifications.map((spec, index) => (
										<div
											key={index}
											className={cn(
												"grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-4 py-2.5 sm:py-3 px-3 sm:px-4",
												index % 2 === 0 ? "bg-muted/50" : "bg-background"
											)}
										>
											<span className="text-xs sm:text-sm text-muted-foreground font-medium">{spec.name}</span>
											<span className="text-xs sm:text-sm">{spec.value}</span>
										</div>
									))}
								</div>
							) : (
								<p className="text-muted-foreground text-xs sm:text-sm py-4 text-center bg-muted/30 rounded-lg">
									No specifications available for this product.
								</p>
							)}
						</div>

						<Separator />

						{/* Description Section */}
						<div>
							<h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Product Description</h2>
							<div
								className="prose prose-sm sm:prose prose-stone dark:prose-invert max-w-none prose-headings:font-semibold prose-p:text-muted-foreground prose-li:text-muted-foreground"
								dangerouslySetInnerHTML={{ __html: product.description || "<p class='text-center py-4'>No description available for this product.</p>" }}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Reviews Section - Always Visible (Shopee style) */}
				<Card>
					<CardContent className="p-4 sm:p-6">
						<ProductReviews productId={product.id} rating={product.rating} />
					</CardContent>
				</Card>
			</div>

			{/* Recommended Products */}
			{(isLoadingRecommended ||
				(recommendedProducts && recommendedProducts.length > 0)) && (
				<section className="mt-8 sm:mt-12">
					<h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">You May Also Like</h2>
					{isLoadingRecommended ? (
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
							{Array.from({ length: 6 }).map((_, i) => (
								<ProductCardSkeleton key={i} />
							))}
						</div>
					) : (
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
							{recommendedProducts?.map((product) => (
								<ProductCard key={product.id} product={product} />
							))}
						</div>
					)}
				</section>
			)}
		</div>
	)
}

function ProductDetailSkeleton() {
	return (
		<div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
			{/* Mobile back button skeleton */}
			<div className="sm:hidden mb-4">
				<Skeleton className="h-8 w-16" />
			</div>

			{/* Desktop breadcrumb skeleton */}
			<div className="hidden sm:flex items-center gap-2 mb-6 lg:mb-8">
				<Skeleton className="h-4 w-12" />
				<Skeleton className="h-4 w-4" />
				<Skeleton className="h-4 w-20" />
			</div>

			<div className="grid lg:grid-cols-2 gap-6 lg:gap-12">
				<div className="space-y-3 sm:space-y-4">
					<Skeleton className="aspect-square rounded-lg sm:rounded-xl" />
					<div className="flex gap-2">
						{Array.from({ length: 4 }).map((_, i) => (
							<Skeleton key={i} className="h-14 w-14 sm:h-20 sm:w-20 rounded-md sm:rounded-lg flex-shrink-0" />
						))}
					</div>
				</div>

				<div className="space-y-4 sm:space-y-6">
					<Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
					<Skeleton className="h-7 sm:h-10 w-full sm:w-3/4" />
					<div className="flex items-center gap-2">
						<Skeleton className="h-4 sm:h-5 w-24 sm:w-32" />
					</div>
					<Skeleton className="h-8 sm:h-10 w-32 sm:w-40" />
					<Skeleton className="h-px w-full" />
					<div className="space-y-3 sm:space-y-4">
						<Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
						<div className="flex gap-1.5 sm:gap-2">
							<Skeleton className="h-8 sm:h-9 w-14 sm:w-16" />
							<Skeleton className="h-8 sm:h-9 w-14 sm:w-16" />
							<Skeleton className="h-8 sm:h-9 w-14 sm:w-16" />
						</div>
					</div>
					<div className="flex gap-2 sm:gap-3">
						<Skeleton className="h-11 sm:h-12 flex-1" />
						<Skeleton className="h-11 w-11 sm:h-12 sm:w-12" />
						<Skeleton className="h-11 w-11 sm:h-12 sm:w-12 hidden sm:block" />
					</div>
					<div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="flex flex-col items-center gap-1.5 sm:gap-2">
								<Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
								<Skeleton className="h-2.5 sm:h-3 w-14 sm:w-16" />
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}
