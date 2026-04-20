"use client"

import { useState } from "react"
import { useDebounceValue } from "usehooks-ts"
import Link from "next/link"
import Image from "next/image"
import {
	useListProductSPU,
	useDeleteProductSPU,
	ProductSPU,
} from "@/core/catalog/product.vendor"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
	Plus,
	Search,
	MoreVertical,
	Pencil,
	Trash2,
	Eye,
	Package,
	Star,
	Loader2,
	Video,
} from "lucide-react"

export default function SellerProductsPage() {
	const [search, setSearch] = useState("")
	const [debouncedSearch] = useDebounceValue(search, 300)
	const [statusFilter, setStatusFilter] = useState<string>("all")
	const [deleteProduct, setDeleteProduct] = useState<ProductSPU | null>(null)

	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useListProductSPU({
			limit: 20,
			my_products: true,
			...(debouncedSearch ? { search: debouncedSearch } : {}),
			...(statusFilter !== "all"
				? { is_active: [statusFilter === "active"] }
				: {}),
		})
	const deleteMutation = useDeleteProductSPU()

	const filteredProducts = data?.pages.flatMap((page) => page.data) ?? []

	const handleDelete = async () => {
		if (!deleteProduct) return
		await deleteMutation.mutateAsync({ id: deleteProduct.id })
		setDeleteProduct(null)
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold">Products</h1>
					<p className="text-muted-foreground">Manage your product catalog</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" asChild>
						<Link href="/seller/products/new/from-video">
							<Video className="h-4 w-4 mr-2" />
							Create from Video
						</Link>
					</Button>
					<Button asChild>
						<Link href="/seller/products/new">
							<Plus className="h-4 w-4 mr-2" />
							Add Product
						</Link>
					</Button>
				</div>
			</div>

			{/* Filters */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search products..."
						className="pl-10"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-full sm:w-40">
						<SelectValue placeholder="Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Status</SelectItem>
						<SelectItem value="active">Active</SelectItem>
						<SelectItem value="inactive">Inactive</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Products List */}
			{isLoading ? (
				<div className="space-y-4">
					{[...Array(5)].map((_, i) => (
						<Card key={i}>
							<CardContent className="p-4">
								<div className="flex gap-4">
									<Skeleton className="h-20 w-20 rounded-lg" />
									<div className="flex-1 space-y-2">
										<Skeleton className="h-5 w-48" />
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-4 w-32" />
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : filteredProducts.length === 0 ? (
				<Card>
					<CardContent className="p-8 text-center">
						<Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
						<h3 className="text-lg font-semibold mb-2">No products found</h3>
						<p className="text-muted-foreground mb-4">
							{search
								? "Try a different search term"
								: "Start by adding your first product"}
						</p>
						{!search && (
							<Button asChild>
								<Link href="/seller/products/new">
									<Plus className="h-4 w-4 mr-2" />
									Add Product
								</Link>
							</Button>
						)}
					</CardContent>
				</Card>
			) : (
				<div className="space-y-4">
					{filteredProducts.map((product) => (
						<Card key={product.id}>
							<CardContent className="p-4">
								<div className="flex gap-4">
									{/* Product Image */}
									<div className="relative h-20 w-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
										{product.resources?.[0] ? (
											<Image
												src={product.resources[0].url}
												alt={product.name}
												fill
												className="object-cover rounded-lg"
											/>
										) : (
											<Package className="h-8 w-8 text-muted-foreground" />
										)}
									</div>

									{/* Product Info */}
									<div className="flex-1 min-w-0">
										<div className="flex items-start justify-between gap-2">
											<div className="grow overflow-hidden">
												<h3 className="font-medium truncate">{product.name}</h3>
												<p className="text-sm text-muted-foreground">
													{product.category?.name || "Uncategorized"}
												</p>
											</div>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8"
													>
														<MoreVertical className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem asChild>
														<Link href={`/product/${product.slug}`}>
															<Eye className="h-4 w-4 mr-2" />
															View
														</Link>
													</DropdownMenuItem>
													<DropdownMenuItem asChild>
														<Link href={`/seller/products/${product.id}/edit`}>
															<Pencil className="h-4 w-4 mr-2" />
															Edit
														</Link>
													</DropdownMenuItem>
													<DropdownMenuItem
														className="text-destructive"
														onClick={() => setDeleteProduct(product)}
													>
														<Trash2 className="h-4 w-4 mr-2" />
														Delete
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>

										<div className="flex items-center gap-4 mt-2 text-sm">
											<div className="flex items-center gap-1">
												<Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
												<span>
													{product.rating?.score != null ? (product.rating.score * 5).toFixed(1) : "N/A"}
												</span>
												<span className="text-muted-foreground">
													({product.rating?.total || 0})
												</span>
											</div>
											<Badge
												variant={product.is_active ? "default" : "secondary"}
											>
												{product.is_active ? "Active" : "Inactive"}
											</Badge>
											{product.is_stale_embedding && (
												<Badge variant="outline" className="text-xs border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-950/30">
													Embedding queued
												</Badge>
											)}
											{product.is_stale_metadata && (
												<Badge variant="outline" className="text-xs border-blue-300 text-blue-600 bg-blue-50 dark:bg-blue-950/30">
													Sync queued
												</Badge>
											)}
										</div>

										{product.tags && product.tags.length > 0 && (
											<div className="flex gap-1 mt-2 flex-wrap">
												{product.tags.slice(0, 3).map((tag) => (
													<Badge
														key={tag}
														variant="outline"
														className="text-xs"
													>
														{tag}
													</Badge>
												))}
												{product.tags.length > 3 && (
													<Badge variant="outline" className="text-xs">
														+{product.tags.length - 3}
													</Badge>
												)}
											</div>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					))}

					{/* Load More */}
					{hasNextPage && (
						<div className="text-center pt-4">
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
									"Load More"
								)}
							</Button>
						</div>
					)}
				</div>
			)}

			{/* Delete Confirmation Dialog */}
			<Dialog
				open={!!deleteProduct}
				onOpenChange={() => setDeleteProduct(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Product</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete &quot;{deleteProduct?.name}&quot;?
							This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteProduct(null)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={deleteMutation.isPending}
						>
							{deleteMutation.isPending ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Deleting...
								</>
							) : (
								"Delete"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
