"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { TOrder } from "@/core/order/order.buyer"
import { Price } from "@/components/ui/price"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { WriteReviewDialog } from "@/components/product/write-review-dialog"
import { Package, ChevronRight, ShoppingBag, Loader2, Star } from "lucide-react"
import { cn } from "@/lib/utils"

function summarizeOrder(items?: Array<{ sku_name: string }>): string {
  if (!items?.length) return "Order"
  if (items.length === 1) return items[0].sku_name
  if (items.length === 2) return `${items[0].sku_name}, ${items[1].sku_name}`
  return `${items[0].sku_name} and ${items.length - 1} more`
}

function getOrderDisplayStatus(order: TOrder): { label: string; color: string } {
  const ps = order.payment?.status
  const ts = order.transport?.status

  if (ps === "Failed") return { label: "Payment Failed", color: "bg-red-100 text-red-800" }
  if (ps === "Cancelled") return { label: "Cancelled", color: "bg-red-100 text-red-800" }
  if (ts === "Delivered") return { label: "Completed", color: "bg-green-100 text-green-800" }
  if (ts === "InTransit" || ts === "OutForDelivery") return { label: "Shipping", color: "bg-purple-100 text-purple-800" }
  if (ts === "Failed" || ts === "Cancelled") return { label: "Delivery Failed", color: "bg-red-100 text-red-800" }
  return { label: "Processing", color: "bg-blue-100 text-blue-800" }
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
      {orders.map((order) => (
        <Card key={order.id}>
          <CardContent className="p-4">
            {/* Order Header */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-medium truncate">
                  {summarizeOrder(order.items)}
                </span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    #{order.id.slice(0, 8)}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(order.date_created).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const displayStatus = getOrderDisplayStatus(order)
                  return (
                    <Badge variant="secondary" className={cn("font-normal", displayStatus.color)}>
                      {displayStatus.label}
                    </Badge>
                  )
                })()}
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-3">
              {order.items.slice(0, 2).map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative h-16 w-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    {item.resources?.[0] ? (
                      <Image src={item.resources[0].url} alt={item.sku_name} fill className="object-cover rounded" />
                    ) : (
                      <Package className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.sku_name}</p>
                    <p className="text-sm text-muted-foreground inline-flex items-center gap-1">
                      Qty: {item.quantity} x{" "}
                      <Price
                        amount={item.unit_price}
                        currency={order.payment?.seller_currency || "VND"}
                        emphasis="native"
                        showRateHint
                      />
                    </p>
                  </div>
                </div>
              ))}
              {order.items.length > 2 && (
                <p className="text-sm text-muted-foreground">
                  +{order.items.length - 2} more items
                </p>
              )}
            </div>

            {/* Order Footer */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <Price
                  amount={order.total}
                  currency={order.payment?.seller_currency || "VND"}
                  emphasis="native"
                  showRateHint
                  className="font-semibold"
                />
              </div>
              <div className="flex gap-2">
                {order.payment?.status === "Success" && order.transport?.status === "Delivered" && order.items[0] && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReviewingOrder({ orderId: order.id, spuId: order.items[0].spu_id })}
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Leave a Review
                  </Button>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/account/orders/${order.id}`}>
                    View Details
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

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
