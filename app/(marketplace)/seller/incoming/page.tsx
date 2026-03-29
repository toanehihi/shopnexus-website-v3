"use client"

import { useState, useMemo } from "react"
import { useDebounceValue } from "usehooks-ts"
import Image from "next/image"
import {
	useListIncomingItems,
	useConfirmItems,
	useRejectItems,
} from "@/core/order/order.seller"
import { TOrderItem } from "@/core/order/order.buyer"
import { useListServiceOption } from "@/core/common/option"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import {
	Search,
	CheckCircle,
	XCircle,
	Package,
	Inbox,
	Loader2,
	MapPin,
} from "lucide-react"
import { formatPrice, cn } from "@/lib/utils"
import { toast } from "sonner"

export default function SellerIncomingPage() {
	const [search, setSearch] = useState("")
	const [debouncedSearch] = useDebounceValue(search, 300)
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
	const [showConfirmDialog, setShowConfirmDialog] = useState(false)
	const [showRejectDialog, setShowRejectDialog] = useState(false)
	const [transportOption, setTransportOption] = useState("")
	const [confirmNote, setConfirmNote] = useState("")

	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useListIncomingItems({
			limit: 20,
			...(debouncedSearch ? { search: debouncedSearch } : {}),
		})
	const { data: transportOptions } = useListServiceOption({
		category: "transport",
	})
	const confirmMutation = useConfirmItems()
	const rejectMutation = useRejectItems()

	const items = useMemo(
		() => data?.pages.flatMap((page) => page.data) ?? [],
		[data],
	)

	// Group items by buyer + address
	const grouped = useMemo(() => {
		const map = new Map<string, TOrderItem[]>()
		for (const item of items) {
			const key = `${item.account_id}::${item.address}`
			const existing = map.get(key) ?? []
			existing.push(item)
			map.set(key, existing)
		}
		return Array.from(map.entries())
	}, [items])

	const toggleItem = (id: number) => {
		setSelectedIds((prev) => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	const selectAll = () => {
		if (selectedIds.size === items.length) {
			setSelectedIds(new Set())
		} else {
			setSelectedIds(new Set(items.map((i) => i.id)))
		}
	}

	const handleConfirm = async () => {
		if (!transportOption || selectedIds.size === 0) return
		try {
			await confirmMutation.mutateAsync({
				item_ids: Array.from(selectedIds),
				transport_option: transportOption,
				note: confirmNote || undefined,
			})
			toast.success("Items confirmed and order created.")
			setSelectedIds(new Set())
			setShowConfirmDialog(false)
			setTransportOption("")
			setConfirmNote("")
		} catch {
			toast.error("Failed to confirm items.")
		}
	}

	const handleReject = async () => {
		if (selectedIds.size === 0) return
		try {
			await rejectMutation.mutateAsync({
				item_ids: Array.from(selectedIds),
			})
			toast.success("Items rejected.")
			setSelectedIds(new Set())
			setShowRejectDialog(false)
		} catch {
			toast.error("Failed to reject items.")
		}
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Incoming Items</h1>
				<p className="text-muted-foreground">
					Review and process buyer order items
				</p>
			</div>

			{/* Search */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Search by SKU name, ID, or buyer..."
					className="pl-10 max-w-md"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</div>

			{/* Bulk Actions */}
			{items.length > 0 && (
				<div className="flex items-center gap-4">
					<Button variant="outline" size="sm" onClick={selectAll}>
						{selectedIds.size === items.length
							? "Deselect All"
							: "Select All"}
					</Button>
					{selectedIds.size > 0 && (
						<>
							<span className="text-sm text-muted-foreground">
								{selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""}{" "}
								selected
							</span>
							<Button size="sm" onClick={() => setShowConfirmDialog(true)}>
								<CheckCircle className="h-4 w-4 mr-2" />
								Confirm Selected
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={() => setShowRejectDialog(true)}
							>
								<XCircle className="h-4 w-4 mr-2" />
								Reject Selected
							</Button>
						</>
					)}
				</div>
			)}

			{/* Items List */}
			{isLoading ? (
				<div className="space-y-4">
					{[...Array(5)].map((_, i) => (
						<Card key={i}>
							<CardContent className="p-4">
								<div className="space-y-3">
									<div className="flex justify-between">
										<Skeleton className="h-5 w-32" />
										<Skeleton className="h-5 w-20" />
									</div>
									<Skeleton className="h-4 w-48" />
									<Skeleton className="h-4 w-24" />
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : items.length === 0 ? (
				<Card>
					<CardContent className="p-8 text-center">
						<Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
						<h3 className="text-lg font-semibold mb-2">No incoming items</h3>
						<p className="text-muted-foreground">
							{search
								? "Try a different search term"
								: "New items from buyers will appear here"}
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-6">
					{grouped.map(([key, groupItems]) => {
						const [buyerId, address] = key.split("::")
						return (
							<Card key={key}>
								<CardContent className="p-4">
									{/* Group Header */}
									<div className="flex items-center gap-2 mb-4 pb-3 border-b">
										<Badge variant="outline">
											Buyer #{buyerId.slice(0, 8)}
										</Badge>
										<div className="flex items-center gap-1 text-sm text-muted-foreground">
											<MapPin className="h-3 w-3" />
											{address}
										</div>
									</div>

									{/* Items */}
									<div className="space-y-3">
										{groupItems.map((item) => (
											<div
												key={item.id}
												className={cn(
													"flex items-start gap-3 p-3 rounded-lg border transition-colors",
													selectedIds.has(item.id) &&
														"border-primary bg-accent/30",
												)}
											>
												<Checkbox
													checked={selectedIds.has(item.id)}
													onCheckedChange={() => toggleItem(item.id)}
													className="mt-1"
												/>
												<div className="relative h-12 w-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
													{item.resources?.[0] ? (
														<Image src={item.resources[0].url} alt={item.sku_name} fill className="object-cover rounded" />
													) : (
														<Package className="h-5 w-5 text-muted-foreground" />
													)}
												</div>
												<div className="flex-1 min-w-0">
													<p className="font-medium truncate">
														{item.sku_name}
													</p>
													<p className="text-sm text-muted-foreground">
														SKU: {item.sku_id.slice(0, 8)}
													</p>
													<div className="flex items-center gap-4 mt-1 text-sm">
														<span>Qty: {item.quantity}</span>
														<span className="font-medium">
															{formatPrice(item.unit_price)}/ea
														</span>
														<span className="font-medium">
															{formatPrice(item.unit_price * item.quantity)}{" "}
															total
														</span>
													</div>
													{item.note && (
														<p className="text-xs text-muted-foreground mt-1">
															Note: {item.note}
														</p>
													)}
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						)
					})}

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

			{/* Confirm Items Dialog */}
			<Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirm Items</DialogTitle>
						<DialogDescription>
							Confirm {selectedIds.size} selected item
							{selectedIds.size !== 1 ? "s" : ""} and create an order. Choose a
							transport option.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label>Transport Option</Label>
							{transportOptions && transportOptions.length > 0 ? (
								<RadioGroup
									value={transportOption}
									onValueChange={setTransportOption}
									className="space-y-2"
								>
									{transportOptions.map((option) => (
										<Label
											key={option.id}
											htmlFor={`transport-${option.id}`}
											className={cn(
												"flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/50",
												transportOption === option.id &&
													"border-primary bg-accent/30",
											)}
										>
											<RadioGroupItem
												value={option.id}
												id={`transport-${option.id}`}
											/>
											<div>
												<span className="font-medium">{option.name}</span>
												{option.description && (
													<p className="text-sm text-muted-foreground">
														{option.description}
													</p>
												)}
											</div>
										</Label>
									))}
								</RadioGroup>
							) : (
								<p className="text-sm text-muted-foreground">
									No transport options available.
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="confirm-note">Note (optional)</Label>
							<Textarea
								id="confirm-note"
								placeholder="Add a note for the buyer..."
								value={confirmNote}
								onChange={(e) => setConfirmNote(e.target.value)}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowConfirmDialog(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleConfirm}
							disabled={!transportOption || confirmMutation.isPending}
						>
							{confirmMutation.isPending ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Confirming...
								</>
							) : (
								<>
									<CheckCircle className="h-4 w-4 mr-2" />
									Confirm Items
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Reject Items Dialog */}
			<Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reject Items</DialogTitle>
						<DialogDescription>
							Are you sure you want to reject {selectedIds.size} selected item
							{selectedIds.size !== 1 ? "s" : ""}? This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowRejectDialog(false)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleReject}
							disabled={rejectMutation.isPending}
						>
							{rejectMutation.isPending ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Rejecting...
								</>
							) : (
								<>
									<XCircle className="h-4 w-4 mr-2" />
									Reject Items
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
