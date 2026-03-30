"use client"

import { use, useState, useEffect } from "react"
import Link from "next/link"
import { useGetBuyerOrder, usePayBuyerOrders } from "@/core/order/order.buyer"
import { useListPaymentMethods } from "@/core/account/payment-method"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  CreditCard,
  MapPin,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { OrderDetailSkeleton } from "./_components/order-detail-skeleton"
import { PaymentMethodDialog } from "./_components/payment-method-dialog"
import { OrderProgress } from "./_components/order-progress"
import { OrderItemsCard } from "./_components/order-items-card"
import { OrderSummaryCard } from "./_components/order-summary-card"
import { PaymentInfoCard } from "./_components/payment-info-card"

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

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: order, isLoading, error } = useGetBuyerOrder(id)
  const payMutation = usePayBuyerOrders()
  const [showPayDialog, setShowPayDialog] = useState(false)
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<string>("")
  const { data: paymentMethods } = useListPaymentMethods()

  useEffect(() => {
    if (paymentMethods && paymentMethods.length > 0) {
      const defaultMethod = paymentMethods.find((pm) => pm.is_default)
      if (defaultMethod) {
        setSelectedPaymentOption(`pm:${defaultMethod.id}`)
      }
    }
  }, [paymentMethods])

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

  const isCancelled = order.status === "Cancelled"

  const handlePay = async () => {
    if (!selectedPaymentOption) return
    try {
      const result = await payMutation.mutateAsync({
        order_ids: [order.id],
        payment_option: selectedPaymentOption,
      })
      setShowPayDialog(false)
      if (result.redirect_url) {
        window.open(result.redirect_url, "_blank")
        toast.success("Payment page opened in a new tab.")
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
          <h1 className="text-2xl font-bold">{summarizeOrder(order.items)}</h1>
          <p className="text-muted-foreground">
            #{order.id.slice(0, 8)} &middot; Placed on {new Date(order.date_created).toLocaleDateString()}
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
            <Button onClick={() => setShowPayDialog(true)}>
              <CreditCard className="h-4 w-4 mr-2" />
              Pay Now
            </Button>
          </CardContent>
        </Card>
      )}
      {order.payment?.status === "Pending" && order.payment?.data?.redirect_url && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Payment Pending</p>
                <p className="text-sm text-blue-700">
                  Complete your payment on the provider&apos;s page.
                </p>
              </div>
            </div>
            <Button onClick={() => window.open(order.payment!.data.redirect_url, "_blank")}>
              <CreditCard className="h-4 w-4 mr-2" />
              Complete Payment
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Order Progress */}
      {!isCancelled && <OrderProgress currentStatus={order.status} />}

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
          <OrderItemsCard items={order.items} />

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
          <OrderSummaryCard
            productCost={order.product_cost}
            productDiscount={order.product_discount}
            transportCost={order.transport_cost}
            total={order.total}
          />

          <PaymentInfoCard payment={order.payment} />

          {/* Actions */}
          <div className="space-y-2">
            {order.payment === null && (
              <Button className="w-full" onClick={() => setShowPayDialog(true)}>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Now
              </Button>
            )}
            {order.payment?.status === "Pending" && order.payment?.data?.redirect_url && (
              <Button className="w-full" onClick={() => window.open(order.payment!.data.redirect_url, "_blank")}>
                <CreditCard className="h-4 w-4 mr-2" />
                Complete Payment
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

      {/* Payment Method Selection Dialog */}
      <PaymentMethodDialog
        open={showPayDialog}
        onOpenChange={(open) => {
          if (!open) setShowPayDialog(false)
        }}
        selectedPaymentOption={selectedPaymentOption}
        onSelectedPaymentOptionChange={setSelectedPaymentOption}
        onPay={handlePay}
        isPaying={payMutation.isPending}
      />
    </div>
  )
}
