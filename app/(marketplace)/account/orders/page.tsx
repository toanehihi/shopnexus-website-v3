"use client"

import { useMemo } from "react"
import { useListBuyerConfirmed } from "@/core/order/order.buyer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrderList } from "./_components/order-list"

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
  )
}
