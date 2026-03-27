"use client"

import { use } from "react"
import Link from "next/link"
import { useGetOrder, usePayOrders } from "@/core/order/order.buyer"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChevronLeft,
  Package,
  Truck,
  MapPin,
  CreditCard,
  Check,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Confirmed: "bg-blue-100 text-blue-800",
  Shipped: "bg-purple-100 text-purple-800",
  Delivered: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
}

const steps = [
  { status: "Pending", label: "Order Placed", icon: Clock },
  { status: "Confirmed", label: "Confirmed", icon: Check },
  { status: "Shipped", label: "Shipped", icon: Truck },
  { status: "Delivered", label: "Delivered", icon: Package },
]

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: order, isLoading, error } = useGetOrder(id)
  const payMutation = usePayOrders()

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

  const currentStepIndex = steps.findIndex((s) => s.status === order.status)
  const isCancelled = order.status === "Cancelled"

  const handlePay = async () => {
    try {
      const result = await payMutation.mutateAsync({
        order_ids: [order.id],
        payment_option: "default",
      })
      if (result.url) {
        window.location.href = result.url
      } else {
        toast.success("Payment initiated successfully.")
      }
    } catch {
      toast.error("Failed to initiate payment.")
    }
  }

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
          <h1 className="text-2xl font-bold">Order #{order.id.slice(0, 8)}</h1>
          <p className="text-muted-foreground">
            Placed on {new Date(order.date_created).toLocaleDateString()}
          </p>
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

      {/* Awaiting Payment Banner */}
      {order.payment === null && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">Awaiting Payment</p>
                <p className="text-sm text-orange-700">
                  This order needs to be paid before it can be processed.
                </p>
              </div>
            </div>
            <Button onClick={handlePay} disabled={payMutation.isPending}>
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
          </CardContent>
        </Card>
      )}

      {/* Order Progress */}
      {!isCancelled && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const isCompleted = index <= currentStepIndex
                const isCurrent = index === currentStepIndex
                const Icon = step.icon

                return (
                  <div key={step.status} className="flex flex-col items-center flex-1">
                    <div className="relative flex items-center w-full">
                      {index > 0 && (
                        <div
                          className={cn(
                            "absolute left-0 right-1/2 h-0.5 -translate-x-1/2",
                            index <= currentStepIndex ? "bg-primary" : "bg-muted"
                          )}
                        />
                      )}
                      {index < steps.length - 1 && (
                        <div
                          className={cn(
                            "absolute left-1/2 right-0 h-0.5 translate-x-1/2",
                            index < currentStepIndex ? "bg-primary" : "bg-muted"
                          )}
                        />
                      )}
                      <div
                        className={cn(
                          "relative z-10 mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2",
                          isCompleted
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted bg-background text-muted-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <p
                      className={cn(
                        "mt-2 text-sm",
                        isCurrent ? "font-medium" : "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
          <Card>
            <CardHeader>
              <CardTitle>Order Items ({order.items.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{item.sku_name}</p>
                    <p className="text-sm text-muted-foreground">
                      SKU: {item.sku_id.slice(0, 8)}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                      <p className="font-medium">
                        {formatPrice(item.unit_price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Shipping Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-line">{order.address}</p>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.product_cost)}</span>
              </div>
              {order.product_discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-green-600">
                    -{formatPrice(order.product_discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  {order.transport_cost === 0 ? "Free" : formatPrice(order.transport_cost)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {order.payment ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Method</span>
                    <span>{order.payment.option}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="secondary" className="font-normal">
                      {order.payment.status}
                    </Badge>
                  </div>
                  {order.payment.date_paid && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Paid on</span>
                      <span>
                        {new Date(order.payment.date_paid).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No payment yet. Pay to proceed with this order.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            {order.payment === null && (
              <Button className="w-full" onClick={handlePay} disabled={payMutation.isPending}>
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
            )}
            {order.status === "Delivered" && (
              <Button className="w-full" asChild>
                <Link href={`/account/orders/${order.id}/refund`}>
                  Request Refund
                </Link>
              </Button>
            )}
            <Button variant="outline" className="w-full" asChild>
              <Link href="/account/orders">Back to Orders</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function OrderDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-20 w-20 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
