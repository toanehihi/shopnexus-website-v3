"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useGetBuyerOrder } from "@/core/order/order.buyer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, MapPin, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { OrderDetailSkeleton } from "./_components/order-detail-skeleton"
import { OrderProgress } from "./_components/order-progress"
import { OrderItemsCard } from "./_components/order-items-card"
import { OrderSummaryCard } from "./_components/order-summary-card"
import { PaymentInfoCard } from "./_components/payment-info-card"
import { CreateRefundDialog } from "@/components/order/create-refund-dialog"

function summarizeOrder(items?: Array<{ SkuName: string }>): string {
	if (!items?.length) return "Order"
	if (items.length === 1) return items[0].SkuName
	if (items.length === 2) return `${items[0].SkuName}, ${items[1].SkuName}`
	return `${items[0].SkuName} and ${items.length - 1} more`
}

import type { TOrder } from "@/core/order/order.buyer"

function getOrderDisplayStatus(order: TOrder): { label: string; color: string } {
	const cs = order.ConfirmFeeTx?.Status
	const ts = order.Transport?.Status
	if (cs === "Failed") return { label: "Payment Failed", color: "bg-red-100 text-red-800" }
	if (cs === "Cancelled") return { label: "Cancelled", color: "bg-red-100 text-red-800" }
	if (ts === "Delivered") return { label: "Completed", color: "bg-green-100 text-green-800" }
	if (ts === "InTransit" || ts === "OutForDelivery") return { label: "Shipping", color: "bg-purple-100 text-purple-800" }
	if (ts === "Failed" || ts === "Cancelled") return { label: "Delivery Failed", color: "bg-red-100 text-red-800" }
	return { label: "Processing", color: "bg-blue-100 text-blue-800" }
}

export default function OrderDetailPage({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = use(params)
	const { data: order, isLoading, error } = useGetBuyerOrder(id)
	const [showRefundDialog, setShowRefundDialog] = useState(false)

	if (isLoading) {
		return <OrderDetailSkeleton />
	}

	if (error || !order) {
		return (
			<div className="text-center py-12">
				<h2 className="text-xl font-semibold mb-2">Order not found</h2>
				<p className="text-muted-foreground mb-4">
					The order you&apos;re looking for doesn&apos;t exist.
				</p>
				<Button asChild>
					<Link href="/account/orders">Back to Orders</Link>
				</Button>
			</div>
		)
	}

	const displayStatus = getOrderDisplayStatus(order)
	const isCancelled = order.ConfirmFeeTx?.Status === "Cancelled" || order.ConfirmFeeTx?.Status === "Failed"

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/account/orders">
						<ChevronLeft className="h-5 w-5" />
					</Link>
				</Button>
				<div className="flex-1">
					<h1 className="text-2xl font-bold">{summarizeOrder(order.Items)}</h1>
					<p className="text-muted-foreground">
						#{order.ID.slice(0, 8)} &middot; Placed on{" "}
						{new Date(order.DateCreated).toLocaleDateString()}
					</p>
				</div>
				<Badge
					variant="secondary"
					className={cn("font-normal", displayStatus.color)}
				>
					{displayStatus.label}
				</Badge>
			</div>

			{/* Order Progress */}
			{!isCancelled && <OrderProgress confirmFeeStatus={order.ConfirmFeeTx?.Status} transportStatus={order.Transport?.Status} />}

			{isCancelled && (
				<Card className="border-destructive/50 bg-destructive/5">
					<CardContent className="p-6 flex items-center gap-4">
						<XCircle className="h-8 w-8 text-destructive" />
						<div>
							<p className="font-medium text-destructive">Order Cancelled</p>
							<p className="text-sm text-muted-foreground">
								This order has been cancelled.
							</p>
						</div>
					</CardContent>
				</Card>
			)}

			<div className="grid lg:grid-cols-3 gap-6">
				{/* Order Items */}
				<div className="lg:col-span-2 space-y-6">
					<OrderItemsCard
						items={order.Items}
						currency={order.ConfirmFeeTx?.ToCurrency ?? "VND"}
					/>

					{/* Shipping Info */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<MapPin className="h-5 w-5" />
								Shipping Address
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm whitespace-pre-line">{order.Address}</p>
						</CardContent>
					</Card>
				</div>

				{/* Order Summary */}
				<div className="space-y-6">
					<OrderSummaryCard
						totalAmount={order.TotalAmount}
						currency={order.ConfirmFeeTx?.ToCurrency ?? "VND"}
					/>

					<PaymentInfoCard confirmFeeTx={order.ConfirmFeeTx} />

					{/* Actions */}
					<div className="space-y-2">
						{order.ConfirmFeeTx?.Status === "Success" && order.Transport?.Status === "Delivered" && (
							<Button className="w-full" onClick={() => setShowRefundDialog(true)}>
								Request Refund
							</Button>
						)}
						<Button variant="outline" className="w-full" asChild>
							<Link href="/account/orders">Back to Orders</Link>
						</Button>
					</div>
				</div>
			</div>

			<CreateRefundDialog
				orderId={order.ID}
				open={showRefundDialog}
				onOpenChange={setShowRefundDialog}
			/>
		</div>
	)
}
