"use client"

import { use } from "react"
import Link from "next/link"
import { useGetOrder, TOrder } from "@/core/order/order.buyer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  CreditCard,
  User,
  CheckCircle,
  Clock,
  XCircle,
  Copy,
  ShoppingCart,
} from "lucide-react"
import { formatPrice } from "@/lib/utils"

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType; color: string }> = {
  Pending: { label: "Pending", variant: "secondary", icon: Clock, color: "text-yellow-600" },
  Confirmed: { label: "Confirmed", variant: "default", icon: CheckCircle, color: "text-blue-600" },
  Shipped: { label: "Shipped", variant: "default", icon: Truck, color: "text-purple-600" },
  Delivered: { label: "Delivered", variant: "outline", icon: Package, color: "text-green-600" },
  Cancelled: { label: "Cancelled", variant: "destructive", icon: XCircle, color: "text-red-600" },
}

const steps = [
  { status: "Pending", label: "Order Placed" },
  { status: "Confirmed", label: "Confirmed" },
  { status: "Shipped", label: "Shipped" },
  { status: "Delivered", label: "Delivered" },
]

export default function SellerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: order, isLoading } = useGetOrder(id)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getCurrentStep = (status: string) => {
    if (status === "Cancelled") return -1
    return steps.findIndex((s) => s.status === status)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Order not found</h2>
        <p className="text-muted-foreground mb-4">
          The order you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/seller/orders">Back to Orders</Link>
        </Button>
      </div>
    )
  }

  const status = statusConfig[order.status] ?? statusConfig.Pending
  const StatusIcon = status.icon
  const currentStep = getCurrentStep(order.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/seller/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Order #{order.id.slice(0, 8)}</h1>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(order.id)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-muted-foreground">{formatDate(order.date_created)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={status.variant} className="gap-1">
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
          {order.payment === null && (
            <Badge variant="destructive" className="font-normal">
              Unpaid
            </Badge>
          )}
        </div>
      </div>

      {/* Progress Tracker */}
      {order.status !== "Cancelled" && (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                />
              </div>

              {steps.map((step, index) => {
                const isCompleted = index <= currentStep
                const isCurrent = index === currentStep
                return (
                  <div key={step.status} className="flex flex-col items-center relative z-10">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      } ${isCurrent ? "ring-2 ring-primary ring-offset-2" : ""}`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <span className="text-xs">{index + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 ${
                        isCompleted ? "text-foreground font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-muted/50 rounded-lg"
                >
                  <div className="h-16 w-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{item.sku_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      SKU: {item.sku_id.slice(0, 8)}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm">Qty: {item.quantity}</span>
                      <span className="font-medium">{formatPrice(item.unit_price * item.quantity)}</span>
                    </div>
                    {item.note && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Note: {item.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Order Note */}
          {order.note && (
            <Card>
              <CardHeader>
                <CardTitle>Order Note</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{order.note}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-6">
          {/* Buyer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Buyer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">Buyer #{order.buyer_id.slice(0, 8)}</p>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{order.address}</p>
            </CardContent>
          </Card>

          {/* Transport Info */}
          {order.transport_id && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Transport
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  ID: {order.transport_id.slice(0, 8)}
                </p>
              </CardContent>
            </Card>
          )}

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
                    <Badge variant="outline">{order.payment.status}</Badge>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Awaiting payment from buyer</p>
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.product_cost)}</span>
              </div>
              {order.product_discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(order.product_discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatPrice(order.transport_cost)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
