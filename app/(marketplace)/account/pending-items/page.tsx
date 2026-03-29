"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  useListPendingItems,
  useCancelPendingItem,
  TOrderItem,
  OrderItemStatus,
} from "@/core/order/order.buyer"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Package,
  ShoppingBag,
  Loader2,
  XCircle,
  Clock,
  CheckCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const statusConfig: Record<OrderItemStatus, { label: string; color: string; icon: React.ElementType }> = {
  Pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  Confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  Canceled: { label: "Canceled", color: "bg-red-100 text-red-800", icon: XCircle },
}

export default function PendingItemsPage() {
  const {
    data: itemsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListPendingItems({ limit: 20 })

  const cancelMutation = useCancelPendingItem()
  const [cancelItem, setCancelItem] = useState<TOrderItem | null>(null)

  const items = useMemo(() => {
    return itemsData?.pages.flatMap((page) => page.data) ?? []
  }, [itemsData])

  const pendingItems = items.filter((i) => i.status === "Pending")
  const confirmedItems = items.filter((i) => i.status === "Confirmed")
  const canceledItems = items.filter((i) => i.status === "Canceled")

  const handleCancel = async () => {
    if (!cancelItem) return
    try {
      await cancelMutation.mutateAsync(cancelItem.id)
      toast.success("Item canceled successfully.")
      setCancelItem(null)
    } catch {
      toast.error("Failed to cancel item.")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pending Items</h1>
        <p className="text-muted-foreground">
          Track items waiting for seller confirmation
        </p>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({items.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingItems.length})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed ({confirmedItems.length})</TabsTrigger>
          <TabsTrigger value="canceled">Canceled ({canceledItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <ItemList
            items={items}
            isLoading={isLoading}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={() => fetchNextPage()}
            onCancel={setCancelItem}
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <ItemList items={pendingItems} isLoading={isLoading} onCancel={setCancelItem} />
        </TabsContent>

        <TabsContent value="confirmed" className="mt-6">
          <ItemList items={confirmedItems} isLoading={isLoading} onCancel={setCancelItem} />
        </TabsContent>

        <TabsContent value="canceled" className="mt-6">
          <ItemList items={canceledItems} isLoading={isLoading} onCancel={setCancelItem} />
        </TabsContent>
      </Tabs>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!cancelItem} onOpenChange={() => setCancelItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel &quot;{cancelItem?.sku_name}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelItem(null)}>
              Keep Item
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Canceling...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Item
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ItemList({
  items,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onCancel,
}: {
  items: TOrderItem[]
  isLoading?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
  onCancel?: (item: TOrderItem) => void
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-16 w-16 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No items found</h3>
        <p className="text-muted-foreground mb-4">
          Your pending items will appear here after checkout.
        </p>
        <Button asChild>
          <Link href="/">Start Shopping</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const status = statusConfig[item.status]
        const StatusIcon = status.icon

        return (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex gap-3 flex-1">
                  <div className="relative h-16 w-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    {item.resources?.[0] ? (
                      <Image src={item.resources[0].url} alt={item.sku_name} fill className="object-cover rounded" />
                    ) : (
                      <Package className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{item.sku_name}</p>
                      <Badge
                        variant="secondary"
                        className={cn("font-normal gap-1", status.color)}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      SKU: {item.sku_id.slice(0, 8)} | Qty: {item.quantity}
                    </p>
                    <p className="text-sm font-medium mt-1">
                      {formatPrice(item.unit_price * item.quantity)}
                    </p>
                    {item.address && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Ship to: {item.address}
                      </p>
                    )}
                    {item.note && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Note: {item.note}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(item.date_created).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.status === "Pending" && onCancel && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCancel(item)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                  {item.order_id && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/account/orders/${item.order_id}`}>
                        View Order
                      </Link>
                    </Button>
                  )}
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
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
