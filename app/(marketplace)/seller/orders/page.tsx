"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
	useListSellerPendingItems,
	useConfirmSellerPending,
	useRejectSellerPending,
	useListSellerConfirmed,
} from "@/core/order/order.seller"
import { TOrderItem } from "@/core/order/order.buyer"
import { useGetAccount } from "@/core/account/account"
import { useListServiceOption } from "@/core/common/option"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
	CheckCircle,
	XCircle,
	Package,
	Inbox,
	Loader2,
	MapPin,
	MoreVertical,
	Eye,
	ShoppingCart,
	Truck,
	Clock,
	AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Price } from "@/components/ui/price"
import { toast } from "sonner"

// ===== Shared Helpers =====

function AccountName({
	id,
	fallback = "User",
}: {
	id: string
	fallback?: string
}) {
	const { data } = useGetAccount(id)
	return <>{data?.name || data?.username || fallback}</>
}

function summarizeOrder(items?: Array<{ sku_name: string }>): string {
	if (!items?.length) return "Order"
	if (items.length === 1) return items[0].sku_name
	if (items.length === 2) return `${items[0].sku_name}, ${items[1].sku_name}`
	return `${items[0].sku_name} and ${items.length - 1} more`
}

function getOrderDisplayStatus(order: {
	transport?: { status: string | null } | null
	confirm_session?: { status: string } | null
}): {
	label: string
	variant: "default" | "secondary" | "destructive" | "outline"
	icon: React.ElementType
} {
	const ts = order.transport?.status

	if (ts === "Delivered")
		return { label: "Completed", variant: "outline", icon: Package }
	if (ts === "InTransit" || ts === "OutForDelivery")
		return { label: "Shipping", variant: "default", icon: Truck }
	if (ts === "Failed" || ts === "Cancelled")
		return { label: "Delivery Failed", variant: "destructive", icon: XCircle }
	return { label: "Processing", variant: "default", icon: CheckCircle }
}

// ===== Incoming Tab =====

function IncomingTab() {
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
	const [showConfirmDialog, setShowConfirmDialog] = useState(false)
	const [showRejectDialog, setShowRejectDialog] = useState(false)
	const [confirmNote, setConfirmNote] = useState("")
	const [selectedPaymentOption, setSelectedPaymentOption] = useState("")

	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useListSellerPendingItems({ limit: 20 })
	const confirmMutation = useConfirmSellerPending()
	const rejectMutation = useRejectSellerPending()
	const { data: paymentOptions } = useListServiceOption({ type: "payment" })

	const items = useMemo(
		() => data?.pages.flatMap((page) => page.data) ?? [],
		[data],
	)

	// Group by buyer + address + transport_option (seller can only confirm items with the same transport_option)
	const grouped = useMemo(() => {
		const map = new Map<string, TOrderItem[]>()
		for (const item of items) {
			const key = `${item.account_id}::${item.address}::${item.transport_option}`
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

	const selectAllInGroup = (groupItems: TOrderItem[]) => {
		const groupIds = groupItems.map((i) => i.id)
		const allSelected = groupIds.every((id) => selectedIds.has(id))
		setSelectedIds((prev) => {
			const next = new Set(prev)
			if (allSelected) {
				for (const id of groupIds) next.delete(id)
			} else {
				for (const id of groupIds) next.add(id)
			}
			return next
		})
	}

	const selectedItems = useMemo(
		() => items.filter((i) => selectedIds.has(i.id)),
		[items, selectedIds],
	)

	const handleConfirm = async () => {
		if (selectedIds.size === 0) return
		if (!selectedPaymentOption) {
			toast.error("Please select a payment method.")
			return
		}
		try {
			const result = await confirmMutation.mutateAsync({
				item_ids: Array.from(selectedIds),
				use_wallet: false,
				payment_option: selectedPaymentOption,
				note: confirmNote || undefined,
			})
			setSelectedIds(new Set())
			setShowConfirmDialog(false)
			setConfirmNote("")
			setSelectedPaymentOption("")
			if (result.payment_url) {
				toast.info("Redirecting to payment...")
				window.location.href = result.payment_url
				return
			}
			toast.success("Items confirmed and order created.")
		} catch {
			toast.error("Failed to confirm items.")
		}
	}

	const handleReject = async () => {
		if (selectedIds.size === 0) return
		try {
			await rejectMutation.mutateAsync({ item_ids: Array.from(selectedIds) })
			toast.success("Items rejected. Money refunded to buyer's wallet.")
			setSelectedIds(new Set())
			setShowRejectDialog(false)
		} catch {
			toast.error("Failed to reject items.")
		}
	}

	return (
		<div className="space-y-4">
			{/* Bulk Actions */}
			{selectedIds.size > 0 && (
				<div className="flex items-center gap-4">
					<span className="text-sm text-muted-foreground">
						{selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected
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
							New paid items from buyers will appear here
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-6">
					{grouped.map(([key, groupItems]) => {
						const [buyerId, address, transportOption] = key.split("::")
						return (
							<Card key={key}>
								<CardContent className="p-4">
									<div className="flex items-center gap-2 mb-4 pb-3 border-b flex-wrap">
										<Badge variant="outline">
											<AccountName id={buyerId} fallback="Buyer" />
										</Badge>
										<div className="flex items-center gap-1 text-sm text-muted-foreground">
											<MapPin className="h-3 w-3" />
											{address}
										</div>
										<Badge variant="secondary" className="gap-1">
											<Truck className="h-3 w-3" />
											{transportOption}
										</Badge>
										<Button
											variant="outline"
											size="sm"
											className="ml-auto"
											onClick={() => selectAllInGroup(groupItems)}
										>
											{groupItems.every((i) => selectedIds.has(i.id))
												? "Deselect All"
												: "Select All"}
										</Button>
									</div>

									<div className="space-y-3">
										{groupItems.map((item) => (
											<div
												key={item.id}
												className={cn(
													"flex items-center gap-3 p-3 rounded-lg border transition-colors min-h-28",
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
													<Package className="h-5 w-5 text-muted-foreground" />
												</div>
												<div className="flex-1 min-w-0">
													<p className="font-medium truncate">{item.sku_name}</p>
													{item.note && (
														<p className="text-sm text-muted-foreground truncate">
															{item.note}
														</p>
													)}
													<div className="flex items-center gap-4 mt-1 text-sm flex-wrap">
														<span>Qty: {item.quantity}</span>
														{/* subtotal_amount = unit_price * quantity */}
														<span className="font-medium">
															<Price
																amount={item.subtotal_amount}
																currency="VND"
																emphasis="native-only"
															/>{" "}
															total
														</span>
													</div>
													<div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
														<Badge variant="outline" className="text-xs gap-1">
															<CheckCircle className="h-3 w-3 text-green-600" />
															Paid
														</Badge>
														<span className="flex items-center gap-1">
															<Truck className="h-3 w-3" />
															{item.transport_option}
														</span>
													</div>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						)
					})}

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
							{selectedIds.size !== 1 ? "s" : ""} and create an order.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4 overflow-hidden">
						{/* Selected Items Summary */}
						<div className="rounded-lg border bg-muted/50 p-3 space-y-1.5">
							{selectedItems.map((item) => (
								<div
									key={item.id}
									className="flex justify-between gap-4 text-sm"
								>
									<span className="min-w-0 truncate line-clamp-1">
										{item.sku_name} x{item.quantity}
									</span>
									<span className="font-medium shrink-0">
										<Price
											amount={item.total_amount}
											currency="VND"
											emphasis="native-only"
										/>
									</span>
								</div>
							))}
							<div className="flex justify-between pt-1.5 border-t text-sm">
								<span className="text-muted-foreground">Subtotal (paid)</span>
								<span>
									<Price
										amount={selectedItems.reduce(
											(sum, i) => sum + i.total_amount,
											0,
										)}
										currency="VND"
										emphasis="native-only"
									/>
								</span>
							</div>
						</div>

						{/* Buyer's transport option (read-only) */}
						{selectedItems.length > 0 && (
							<div className="rounded-lg border p-3">
								<Label className="text-sm text-muted-foreground">
									Transport Option (chosen by buyer)
								</Label>
								<div className="flex items-center gap-2 mt-1">
									<Truck className="h-4 w-4 text-muted-foreground" />
									<span className="font-medium">
										{selectedItems[0].transport_option}
									</span>
								</div>
							</div>
						)}

						{/* Payment Method */}
						<div className="space-y-2">
							<Label className="text-sm font-medium">
								Payment Method <span className="text-destructive">*</span>
							</Label>
							{paymentOptions && paymentOptions.length > 0 ? (
								<RadioGroup
									value={selectedPaymentOption}
									onValueChange={setSelectedPaymentOption}
									className="space-y-2"
								>
									{paymentOptions.map((option) => (
										<Label
											key={option.id}
											htmlFor={`confirm-pay-${option.id}`}
											className={cn(
												"flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/50",
												selectedPaymentOption === option.id &&
													"border-primary bg-accent/30",
											)}
										>
											<RadioGroupItem
												value={option.id}
												id={`confirm-pay-${option.id}`}
											/>
											<div>
												<span className="font-medium">{option.name}</span>
												{option.description && (
													<p className="text-xs text-muted-foreground">
														{option.description}
													</p>
												)}
											</div>
										</Label>
									))}
								</RadioGroup>
							) : (
								<p className="text-sm text-muted-foreground">
									Loading payment options…
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
							disabled={
								selectedIds.size === 0 ||
								!selectedPaymentOption ||
								confirmMutation.isPending
							}
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
					<div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950 p-3 flex items-start gap-2">
						<AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
						<p className="text-sm text-amber-800 dark:text-amber-200">
							Ti&#7873;n s&#7869; &#273;&#432;&#7907;c ho&#224;n v&#224;o
							v&#237; ng&#432;&#7901;i mua (Money will be refunded to
							buyer&apos;s wallet)
						</p>
					</div>
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

// ===== Confirmed Tab =====

function ConfirmedTab() {
	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useListSellerConfirmed({
			limit: 20,
		})

	const orders = useMemo(
		() => data?.pages.flatMap((page) => page.data) ?? [],
		[data],
	)

	const formatDate = (dateStr: string) =>
		new Date(dateStr).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		})

	return (
		<div className="space-y-4">
			{/* Orders List */}
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
			) : orders.length === 0 ? (
				<Card>
					<CardContent className="p-8 text-center">
						<ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
						<h3 className="text-lg font-semibold mb-2">No orders found</h3>
						<p className="text-muted-foreground">
							Orders will appear here when items are confirmed
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-4">
					{orders.map((order) => {
						const status = getOrderDisplayStatus(order)
						const StatusIcon = status.icon

						return (
							<Card key={order.id}>
								<CardContent className="p-4">
									<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
										<div className="space-y-1">
											<div className="flex items-center gap-2 min-w-0">
												<h3 className="font-medium truncate">
													{summarizeOrder(order.items)}
												</h3>
												<Badge variant={status.variant} className="gap-1">
													<StatusIcon className="h-3 w-3" />
													{status.label}
												</Badge>
											</div>
											<p className="text-sm text-muted-foreground">
												#{order.id.slice(0, 8)} &middot;{" "}
												{formatDate(order.date_created)}
											</p>
											<p className="text-sm text-muted-foreground">
												Buyer:{" "}
												<AccountName id={order.buyer_id} fallback="Buyer" />
											</p>
											<p className="text-sm">
												{order.items.length} item
												{order.items.length !== 1 ? "s" : ""} |
												<span className="font-medium ml-1">
													<Price
														amount={order.total_amount}
														currency={order.confirm_session?.currency ?? "VND"}
														emphasis="native-only"
													/>
												</span>
											</p>
										</div>

										<div className="flex items-center gap-2">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="outline"
														size="icon"
														className="h-8 w-8"
													>
														<MoreVertical className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem asChild>
														<Link href={`/seller/orders/${order.id}`}>
															<Eye className="h-4 w-4 mr-2" />
															View Details
														</Link>
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</div>

									<div className="mt-4 pt-4 border-t">
										<div className="flex gap-2 overflow-x-auto pb-2">
											{order.items.slice(0, 4).map((item) => (
												<div
													key={item.id}
													className="relative flex-shrink-0 h-12 w-12 rounded bg-muted flex items-center justify-center"
												>
													<Package className="h-5 w-5 text-muted-foreground" />
												</div>
											))}
											{order.items.length > 4 && (
												<div className="flex-shrink-0 h-12 w-12 rounded bg-muted flex items-center justify-center text-sm text-muted-foreground">
													+{order.items.length - 4}
												</div>
											)}
										</div>
									</div>
								</CardContent>
							</Card>
						)
					})}

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
		</div>
	)
}

// ===== Main Page =====

export default function SellerOrdersPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Orders</h1>
				<p className="text-muted-foreground">
					Manage incoming items and confirmed orders
				</p>
			</div>

			<Tabs defaultValue="incoming">
				<TabsList>
					<TabsTrigger value="incoming">Incoming</TabsTrigger>
					<TabsTrigger value="confirmed">Confirmed</TabsTrigger>
				</TabsList>

				<TabsContent value="incoming" className="mt-6">
					<IncomingTab />
				</TabsContent>

				<TabsContent value="confirmed" className="mt-6">
					<ConfirmedTab />
				</TabsContent>
			</Tabs>
		</div>
	)
}
