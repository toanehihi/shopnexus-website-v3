"use client"

import { use } from "react"
import Link from "next/link"
import { TOrder } from "@/core/order/order.buyer"
import { useGetSellerOrder } from "@/core/order/order.seller"
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
import { Price } from "@/components/ui/price"
import { useGetAccount } from "@/core/account/account"

function summarizeOrder(items?: Array<{ sku_name: string }>): string {
  if (!items?.length) return "Order"
  if (items.length === 1) return items[0].sku_name
  if (items.length === 2) return `${items[0].sku_name}, ${items[1].sku_name}`
  return `${items[0].sku_name} and ${items.length - 1} more`
}

function AccountName({ id, fallback = "User" }: { id: string; fallback?: string }) {
  const { data } = useGetAccount(id)
  return <>{data?.name || data?.username || fallback}</>
}

function getOrderDisplayStatus(order: TOrder): { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType } {
  const cs = order.confirm_session?.status
  const ts = order.transport?.status
  if (!order.confirm_session) return { label: "Unpaid", variant: "secondary", icon: Clock }
  if (cs === "Pending") return { label: "Awaiting Payment", variant: "secondary", icon: Clock }
  if (cs === "Failed") return { label: "Payment Failed", variant: "destructive", icon: XCircle }
  if (cs === "Cancelled") return { label: "Cancelled", variant: "destructive", icon: XCircle }
  if (ts === "Delivered") return { label: "Completed", variant: "outline", icon: Package }
  if (ts === "InTransit" || ts === "OutForDelivery") return { label: "Shipping", variant: "default", icon: Truck }
  if (ts === "Failed" || ts === "Cancelled") return { label: "Delivery Failed", variant: "destructive", icon: XCircle }
  return { label: "Processing", variant: "default", icon: CheckCircle }
}

const progressSteps = [
  { key: "placed", label: "Order Placed" },
  { key: "paid", label: "Paid" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
]

export default function SellerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: order, isLoading } = useGetSellerOrder(id)

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

  const getCurrentStep = (order: TOrder) => {
    const cs = order.confirm_session?.status
    const ts = order.transport?.status
    const ps = order.payout_session?.status
    const terminal = (s?: string | null) => s === "Failed" || s === "Cancelled"
    if (terminal(cs) || terminal(ts) || terminal(ps)) return -1
    if (ts === "Delivered") return 3
    if (ts === "InTransit" || ts === "OutForDelivery") return 2
    if (cs === "Success") return 1
    return 0
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

  const status = getOrderDisplayStatus(order)
  const StatusIcon = status.icon
  const currentStep = getCurrentStep(order)
  const isCancelled = currentStep === -1

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
              <h1 className="text-2xl font-bold">{summarizeOrder(order.items)}</h1>
              <p className="text-sm text-muted-foreground">#{order.id.slice(0, 8)}</p>
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
          {order.confirm_session === null && (
            <Badge variant="destructive" className="font-normal">
              Unpaid
            </Badge>
          )}
        </div>
      </div>

      {/* Progress Tracker */}
      {!isCancelled && (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(currentStep / (progressSteps.length - 1)) * 100}%` }}
                />
              </div>

              {progressSteps.map((step, index) => {
                const isCompleted = index <= currentStep
                const isCurrent = index === currentStep
                return (
                  <div key={step.key} className="flex flex-col items-center relative z-10">
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
                  <div className="relative h-16 w-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.sku_name}</p>
                    {item.note && (
                      <p className="text-sm text-muted-foreground truncate">
                        {item.note}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm">Qty: {item.quantity}</span>
                      <span className="font-medium">
                        <Price
                          amount={item.subtotal_amount}
                          currency={order.confirm_session?.currency ?? "VND"}
                          emphasis="native-only"
                        />
                      </span>
                    </div>
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
              <p className="font-medium"><AccountName id={order.buyer_id} fallback="Buyer" /></p>
              <p className="text-sm text-muted-foreground">#{order.buyer_id.slice(0, 8)}</p>
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
          {order.transport && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Transport
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  ID: {String(order.transport.id).slice(0, 8)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Status: {order.transport.status}
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
              {order.confirm_session ? (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline">{order.confirm_session.status}</Badge>
                </div>
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
              <Separator className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>
                  <Price
                    amount={order.total_amount}
                    currency={order.confirm_session?.currency ?? "VND"}
                    emphasis="native-only"
                  />
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
