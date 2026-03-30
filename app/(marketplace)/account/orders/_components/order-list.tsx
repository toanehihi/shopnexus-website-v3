"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { TOrder, usePayBuyerOrders } from "@/core/order/order.buyer"
import { useListPaymentMethods } from "@/core/account/payment-method"
import { useListServiceOption } from "@/core/common/option"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Package, ChevronRight, ShoppingBag, Loader2, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

function summarizeOrder(items?: Array<{ sku_name: string }>): string {
  if (!items?.length) return "Order"
  if (items.length === 1) return items[0].sku_name
  if (items.length === 2) return `${items[0].sku_name}, ${items[1].sku_name}`
  return `${items[0].sku_name} and ${items.length - 1} more`
}

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Confirmed: "bg-blue-100 text-blue-800",
  Shipped: "bg-purple-100 text-purple-800",
  Delivered: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
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
  const payMutation = usePayBuyerOrders()
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null)
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<string>("")
  const { data: paymentMethods } = useListPaymentMethods()
  const { data: serviceOptions } = useListServiceOption({ category: "payment" })

  useEffect(() => {
    if (paymentMethods && paymentMethods.length > 0) {
      const defaultMethod = paymentMethods.find((pm) => pm.is_default)
      if (defaultMethod) {
        setSelectedPaymentOption(`pm:${defaultMethod.id}`)
      }
    }
  }, [paymentMethods])

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
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
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
                {order.payment === null && (
                  <Badge variant="destructive" className="font-normal">
                    Unpaid
                  </Badge>
                )}
                <Badge
                  variant="secondary"
                  className={cn("font-normal", statusColors[order.status] ?? "")}
                >
                  {order.status}
                </Badge>
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
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity} x {formatPrice(item.unit_price)}
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
                <p className="font-semibold">{formatPrice(order.total)}</p>
              </div>
              <div className="flex gap-2">
                {order.payment === null && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setPayingOrderId(order.id)}
                  >
                    <CreditCard className="h-4 w-4 mr-1" />
                    Pay
                  </Button>
                )}
                {order.payment?.status === "Pending" && order.payment?.data?.redirect_url && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => window.open(order.payment!.data.redirect_url, "_blank")}
                  >
                    <CreditCard className="h-4 w-4 mr-1" />
                    Complete Payment
                  </Button>
                )}
                {order.status === "Delivered" && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/account/orders/${order.id}/refund`}>
                      Request Refund
                    </Link>
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

      {/* Payment Method Selection Dialog */}
      <Dialog
        open={payingOrderId !== null}
        onOpenChange={(open) => {
          if (!open) setPayingOrderId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Payment Method</DialogTitle>
          </DialogHeader>

          <RadioGroup
            value={selectedPaymentOption}
            onValueChange={setSelectedPaymentOption}
            className="space-y-2"
          >
            {/* Saved Cards */}
            {paymentMethods && paymentMethods.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Saved Cards</p>
                {paymentMethods.map((pm) => (
                  <Label
                    key={pm.id}
                    htmlFor={`pm-${pm.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/50",
                      selectedPaymentOption === `pm:${pm.id}` && "border-primary bg-accent/30"
                    )}
                  >
                    <RadioGroupItem value={`pm:${pm.id}`} id={`pm-${pm.id}`} />
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <span className="font-medium">
                        {pm.data.brand ?? pm.provider} **** {pm.data.last4}
                      </span>
                      {pm.data.exp_month && pm.data.exp_year && (
                        <p className="text-xs text-muted-foreground">
                          Expires {String(pm.data.exp_month).padStart(2, "0")}/{pm.data.exp_year}
                        </p>
                      )}
                    </div>
                    {pm.is_default && (
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                    )}
                  </Label>
                ))}
              </div>
            )}

            {/* Other Payment Methods */}
            {serviceOptions && serviceOptions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Other Payment Methods</p>
                {serviceOptions.map((option) => (
                  <Label
                    key={option.id}
                    htmlFor={`so-${option.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/50",
                      selectedPaymentOption === option.id && "border-primary bg-accent/30"
                    )}
                  >
                    <RadioGroupItem value={option.id} id={`so-${option.id}`} />
                    <div>
                      <span className="font-medium">{option.name}</span>
                      {option.description && (
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      )}
                    </div>
                  </Label>
                ))}
              </div>
            )}
          </RadioGroup>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPayingOrderId(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={!selectedPaymentOption || payMutation.isPending}
              onClick={async () => {
                if (!payingOrderId) return
                try {
                  const result = await payMutation.mutateAsync({
                    order_ids: [payingOrderId],
                    payment_option: selectedPaymentOption,
                  })
                  setPayingOrderId(null)
                  if (result.redirect_url) {
                    window.open(result.redirect_url, "_blank")
                    toast.success("Payment page opened in a new tab.")
                  } else {
                    toast.success("Payment initiated successfully.")
                  }
                } catch {
                  toast.error("Failed to initiate payment.")
                }
              }}
            >
              {payMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
