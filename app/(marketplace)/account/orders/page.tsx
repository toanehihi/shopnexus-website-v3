"use client"

import { useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useListBuyerConfirmed, useListBuyerPending, TOrderItem } from "@/core/order/order.buyer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { OrderList } from "./_components/order-list"
import { Package, Clock, CheckCircle, XCircle, ChevronRight, ShoppingBag } from "lucide-react"
import { formatPrice, cn } from "@/lib/utils"

const pendingItemStatusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  Pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  Confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  Canceled: { label: "Canceled", color: "bg-red-100 text-red-800", icon: XCircle },
}

function PendingItemRow({ item }: { item: TOrderItem }) {
  const status = pendingItemStatusConfig[item.status] ?? pendingItemStatusConfig.Pending
  const StatusIcon = status.icon

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="relative h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
        {item.resources?.[0] ? (
          <Image src={item.resources[0].url} alt={item.sku_name} fill className="object-cover rounded" />
        ) : (
          <Package className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.sku_name}</p>
        <p className="text-xs text-muted-foreground">
          Qty: {item.quantity} &middot; {formatPrice(item.unit_price * item.quantity)}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant="secondary" className={cn("font-normal gap-1 text-xs", status.color)}>
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </Badge>
        <span className="text-xs text-muted-foreground hidden sm:block">
          {new Date(item.date_created).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}

function PendingItemsSection() {
  const { data, isLoading } = useListBuyerPending({ limit: 5 })
  const items = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Pending Items</h2>
        <Link
          href="/account/pending-items"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          View all
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center gap-3 py-2 text-muted-foreground">
              <ShoppingBag className="h-5 w-5" />
              <p className="text-sm">No pending items — your items will appear here after checkout.</p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((item) => (
                <PendingItemRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function OrdersPage() {
  const {
    data: ordersData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListBuyerConfirmed({ limit: 10 })

  const orders = useMemo(() => {
    return ordersData?.pages.flatMap((page) => page.data) ?? []
  }, [ordersData])

  const unpaidOrders = orders.filter((o) => o.payment === null)
  const activeOrders = orders.filter(
    (o) => o.status === "Pending" || o.status === "Confirmed" || o.status === "Shipped"
  )
  const completedOrders = orders.filter((o) => o.status === "Delivered")
  const cancelledOrders = orders.filter((o) => o.status === "Cancelled")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="text-muted-foreground">View and track your orders</p>
      </div>

      <PendingItemsSection />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Orders</h2>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
            <TabsTrigger value="unpaid">Unpaid ({unpaidOrders.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeOrders.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({cancelledOrders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <OrderList
              orders={orders}
              isLoading={isLoading}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onLoadMore={() => fetchNextPage()}
            />
          </TabsContent>

          <TabsContent value="unpaid" className="mt-6">
            <OrderList orders={unpaidOrders} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            <OrderList orders={activeOrders} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <OrderList orders={completedOrders} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="cancelled" className="mt-6">
            <OrderList orders={cancelledOrders} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
