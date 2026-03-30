"use client"

import { useMemo, useState } from "react"
import {
  useListBuyerPending,
  useCancelBuyerPending,
  TOrderItem,
} from "@/core/order/order.buyer"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { ItemList } from "./_components/item-list"

export default function PendingItemsPage() {
  const {
    data: itemsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListBuyerPending({ limit: 20 })

  const cancelMutation = useCancelBuyerPending()
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
