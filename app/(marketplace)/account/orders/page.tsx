"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  useListBuyerPendingItems,
  useListBuyerConfirmed,
  useCancelBuyerPending,
  TOrderItem,
  TOrder,
} from "@/core/order/order.buyer"
import { ProductLink } from "@/components/product/product-link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { OrderList } from "./_components/order-list"
import {
  Package,
  Clock,
  Loader2,
  Inbox,
} from "lucide-react"
import { formatPrice, cn } from "@/lib/utils"
import { toast } from "sonner"

// ===== Pending Items Section =====

function PendingItemCard({ item, onCancel }: { item: TOrderItem; onCancel: (id: number) => void }) {
  const badgeLabel = "Awaiting Seller"
  const badgeColor = "bg-yellow-100 text-yellow-800"

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
            {item.resources?.[0] ? (
              <Image src={item.resources[0].url} alt={item.sku_name} fill className="object-cover rounded" />
            ) : (
              <Package className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <ProductLink spuId={item.spu_id}>{item.sku_name}</ProductLink>
            <p className="text-sm text-muted-foreground">
              Qty: {item.quantity} x {formatPrice(item.unit_price)}
            </p>
            {item.note && (
              <p className="text-sm text-muted-foreground truncate">{item.note}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <Badge variant="secondary" className={cn("font-normal gap-1", badgeColor)}>
              <Clock className="h-3 w-3" />
              {badgeLabel}
            </Badge>
            <p className="text-sm font-medium">{formatPrice(item.unit_price * item.quantity)}</p>
            {!item.order_id && !item.date_cancelled && (
              <Button variant="ghost" size="sm" className="text-destructive h-7 px-2" onClick={() => onCancel(item.id)}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PendingTab() {
  const {
    data: pendingData,
    isLoading: pendingLoading,
    fetchNextPage: fetchMorePending,
    hasNextPage: hasMorePending,
    isFetchingNextPage: fetchingMorePending,
  } = useListBuyerPendingItems({ limit: 20 })

  const {
    data: ordersData,
    isLoading: ordersLoading,
    fetchNextPage: fetchMoreOrders,
    hasNextPage: hasMoreOrders,
    isFetchingNextPage: fetchingMoreOrders,
  } = useListBuyerConfirmed({ limit: 20 })

  const cancelMutation = useCancelBuyerPending()
  const [cancelId, setCancelId] = useState<number | null>(null)

  const pendingItems = useMemo(
    () => pendingData?.pages.flatMap((p) => p.data) ?? [],
    [pendingData],
  )
  const activeOrders = useMemo(
    () => ordersData?.pages.flatMap((p) => p.data) ?? [],
    [ordersData],
  )

  const handleCancel = async () => {
    if (cancelId === null) return
    try {
      await cancelMutation.mutateAsync(cancelId)
      toast.success("Item cancelled.")
      setCancelId(null)
    } catch {
      toast.error("Failed to cancel item.")
    }
  }

  const isLoading = pendingLoading || ordersLoading

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-16 w-16 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (pendingItems.length === 0 && activeOrders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <Inbox className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No pending orders</h3>
        <p className="text-muted-foreground mb-4">
          Items awaiting approval and active orders will appear here.
        </p>
        <Button asChild>
          <Link href="/">Start Shopping</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pending Items (awaiting seller approval) */}
      {pendingItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Awaiting Seller Approval</h3>
          <div className="space-y-3">
            {pendingItems.map((item) => (
              <PendingItemCard key={item.id} item={item} onCancel={setCancelId} />
            ))}
          </div>
          {hasMorePending && (
            <div className="text-center">
              <Button variant="outline" size="sm" onClick={() => fetchMorePending()} disabled={fetchingMorePending}>
                {fetchingMorePending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading...</> : "Load More"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Active Orders (unpaid / confirmed / shipped) */}
      {activeOrders.length > 0 && (
        <div className="space-y-3">
          {pendingItems.length > 0 && (
            <h3 className="text-sm font-medium text-muted-foreground">Active Orders</h3>
          )}
          <OrderList
            orders={activeOrders}
            hasNextPage={hasMoreOrders}
            isFetchingNextPage={fetchingMoreOrders}
            onLoadMore={() => fetchMoreOrders()}
          />
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelId !== null} onOpenChange={(open) => { if (!open) setCancelId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this item? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelId(null)}>Keep Item</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Cancelling...</> : "Cancel Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===== Main Page =====

function isCompletedOrder(order: TOrder): boolean {
  return order.transport?.status === "Delivered"
}

function isCancelledOrder(order: TOrder): boolean {
  const ps = order.payment?.status
  const ts = order.transport?.status
  return ps === "Cancelled" || ps === "Failed" || ts === "Failed" || ts === "Cancelled"
}

export default function OrdersPage() {
  const {
    data: allOrdersData,
    isLoading: ordersLoading,
    fetchNextPage: fetchMoreOrders,
    hasNextPage: hasMoreOrders,
    isFetchingNextPage: fetchingMoreOrders,
  } = useListBuyerConfirmed({ limit: 50 })

  const allOrders = useMemo(
    () => allOrdersData?.pages.flatMap((p) => p.data) ?? [],
    [allOrdersData],
  )
  const completedOrders = useMemo(
    () => allOrders.filter(isCompletedOrder),
    [allOrders],
  )
  const cancelledOrders = useMemo(
    () => allOrders.filter(isCancelledOrder),
    [allOrders],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="text-muted-foreground">View and track your orders</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <PendingTab />
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <OrderList
            orders={completedOrders}
            isLoading={ordersLoading}
            hasNextPage={hasMoreOrders}
            isFetchingNextPage={fetchingMoreOrders}
            onLoadMore={() => fetchMoreOrders()}
          />
        </TabsContent>

        <TabsContent value="cancelled" className="mt-6">
          <OrderList
            orders={cancelledOrders}
            isLoading={ordersLoading}
            hasNextPage={hasMoreOrders}
            isFetchingNextPage={fetchingMoreOrders}
            onLoadMore={() => fetchMoreOrders()}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
