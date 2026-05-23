"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { TOrder } from "@/core/order/order.buyer"
import { useExchangeRates, useCurrency } from "@/core/common/currency"
import { formatPriceInline } from "@/lib/money"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { WriteReviewDialog } from "@/components/product/write-review-dialog"
import {
  ImageOff,
  ChevronRight,
  ShoppingBag,
  Loader2,
  Star,
  Calendar,
  Hash,
  Truck,
} from "lucide-react"
import { cn } from "@/lib/utils"

function getOrderDisplayStatus(order: TOrder): { label: string; color: string } {
  const cs = order.confirm_session?.status
  const ts = order.transport?.status

  if (cs === "Failed")
    return {
      label: "Payment Failed",
      color: "bg-destructive/10 text-destructive",
    }
  if (cs === "Cancelled")
    return {
      label: "Cancelled",
      color: "bg-destructive/10 text-destructive",
    }
  if (ts === "Delivered")
    return {
      label: "Completed",
      color:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200",
    }
  if (ts === "InTransit" || ts === "OutForDelivery")
    return {
      label: "Shipping",
      color:
        "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-200",
    }
  if (ts === "Failed" || ts === "Cancelled")
    return {
      label: "Delivery Failed",
      color: "bg-destructive/10 text-destructive",
    }
  return {
    label: "Processing",
    color:
      "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200",
  }
}

export function OrderList({
  orders,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  orders: TOrder[]
  isLoading?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
}) {
  const [reviewingOrder, setReviewingOrder] = useState<{ orderId: string; spuId: string } | null>(null)
  const preferred = useCurrency()
  const { data: rateData } = useExchangeRates()
  const fmtInOrder = (amount: number, currency: string) =>
    formatPriceInline(
      amount,
      currency,
      preferred,
      rateData?.rates,
      "native",
    )

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Skeleton className="h-16 w-16 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-28" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No orders found</h3>
        <p className="text-muted-foreground mb-4">
          You haven&apos;t placed any orders yet.
        </p>
        <Button asChild>
          <Link href="/">Start Shopping</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const displayStatus = getOrderDisplayStatus(order)
        const orderCurrency = order.confirm_session?.currency ?? "VND"
        const reviewable =
          order.confirm_session?.status === "Success" &&
          order.transport?.status === "Delivered" &&
          order.items[0]
        return (
          <Card
            key={order.id}
            className="overflow-hidden transition-shadow hover:shadow-sm"
          >
            <CardContent className="p-0">
              {/* Order Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-mono text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    {order.id.slice(0, 8)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(order.date_created).toLocaleDateString()}
                  </span>
                  {order.transport?.option && (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Truck className="h-3 w-3" />
                      {order.transport.option}
                    </span>
                  )}
                </div>
                <Badge
                  variant="secondary"
                  className={cn("font-normal", displayStatus.color)}
                >
                  {displayStatus.label}
                </Badge>
              </div>

              {/* Order Items */}
              <div className="divide-y">
                {order.items.slice(0, 3).map((item) => {
                  const linkTarget = item.slug
                    ? `/product/${item.slug}`
                    : null
                  const Thumb = (
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.sku_name}
                          fill
                          className="object-cover"
                          sizes="64px"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center text-muted-foreground">
                          <ImageOff className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  )
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      {linkTarget ? (
                        <Link href={linkTarget} className="shrink-0">
                          {Thumb}
                        </Link>
                      ) : (
                        Thumb
                      )}
                      <div className="flex-1 min-w-0">
                        {linkTarget ? (
                          <Link
                            href={linkTarget}
                            className="text-sm font-medium hover:underline line-clamp-2"
                          >
                            {item.sku_name}
                          </Link>
                        ) : (
                          <p className="text-sm font-medium line-clamp-2">
                            {item.sku_name}
                          </p>
                        )}
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Qty {item.quantity}
                        </p>
                      </div>
                      <div className="text-right text-sm font-medium tabular-nums">
                        {fmtInOrder(item.subtotal_amount, orderCurrency)}
                      </div>
                    </div>
                  )
                })}
                {order.items.length > 3 && (
                  <p className="px-4 py-2 text-xs text-muted-foreground">
                    + {order.items.length - 3} more{" "}
                    {order.items.length - 3 === 1 ? "item" : "items"}
                  </p>
                )}
              </div>

              {/* Order Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/30 px-4 py-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground">Total</span>
                  <span className="text-base font-bold tabular-nums">
                    {fmtInOrder(order.total_amount, orderCurrency)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {reviewable && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setReviewingOrder({
                          orderId: order.id,
                          spuId: order.items[0].spu_id,
                        })
                      }
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Leave a Review
                    </Button>
                  )}
                  <Button variant="default" size="sm" asChild>
                    <Link href={`/account/orders/${order.id}`}>
                      View Details
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Orders"
            )}
          </Button>
        </div>
      )}

      {/* Write Review Dialog */}
      {reviewingOrder && (
        <WriteReviewDialog
          productId={reviewingOrder.spuId}
          defaultOrderId={reviewingOrder.orderId}
          open={true}
          onOpenChange={(open) => { if (!open) setReviewingOrder(null) }}
        />
      )}
    </div>
  )
}
