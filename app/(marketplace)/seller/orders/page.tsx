"use client"

import { useState, useMemo } from "react"
import { useDebounceValue } from "usehooks-ts"
import Link from "next/link"
import Image from "next/image"
import { useListSellerConfirmed, useListSellerPending } from "@/core/order/order.seller"
import { TOrder, TOrderItem } from "@/core/order/order.buyer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  MoreVertical,
  Eye,
  ShoppingCart,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  ChevronRight,
  Inbox,
} from "lucide-react"
import { formatPrice, cn } from "@/lib/utils"
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

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  Pending: { label: "Pending", variant: "secondary", icon: Clock },
  Confirmed: { label: "Confirmed", variant: "default", icon: CheckCircle },
  Shipped: { label: "Shipped", variant: "default", icon: Truck },
  Delivered: { label: "Delivered", variant: "outline", icon: Package },
  Cancelled: { label: "Cancelled", variant: "destructive", icon: XCircle },
}

const pendingItemStatusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  Pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  Confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  Canceled: { label: "Canceled", color: "bg-red-100 text-red-800", icon: XCircle },
}

function IncomingItemRow({ item }: { item: TOrderItem }) {
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

function IncomingItemsSection() {
  const { data, isLoading } = useListSellerPending({ limit: 5 })
  const items = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Incoming Items</h2>
        <Link
          href="/seller/incoming"
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
              <Inbox className="h-5 w-5" />
              <p className="text-sm">No incoming items — buyer orders awaiting confirmation will appear here.</p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map((item) => (
                <IncomingItemRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function SellerOrdersPage() {
  const [search, setSearch] = useState("")
  const [debouncedSearch] = useDebounceValue(search, 300)
  const [activeTab, setActiveTab] = useState("all")

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useListSellerConfirmed({
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(activeTab !== "all" ? { order_status: [activeTab] } : {}),
  })

  const filteredOrders = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  )

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground">View your confirmed orders</p>
      </div>

      <IncomingItemsSection />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Confirmed Orders</h2>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="Pending">Pending</TabsTrigger>
            <TabsTrigger value="Confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="Shipped">Shipped</TabsTrigger>
            <TabsTrigger value="Delivered">Delivered</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order ID..."
            className="pl-10 max-w-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders found</h3>
              <p className="text-muted-foreground">
                {search ? "Try a different search term" : "Orders will appear here when items are confirmed"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const status = statusConfig[order.status] ?? statusConfig.Pending
              const StatusIcon = status.icon

              return (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{summarizeOrder(order.items)}</h3>
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
                        <p className="text-sm text-muted-foreground">
                          #{order.id.slice(0, 8)} &middot; {formatDate(order.date_created)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Buyer: <AccountName id={order.buyer_id} fallback="Buyer" />
                        </p>
                        <p className="text-sm">
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""} |
                          <span className="font-medium ml-1">{formatPrice(order.total)}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/seller/orders/${order.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {order.items.slice(0, 4).map((item) => (
                          <div
                            key={item.id}
                            className="relative flex-shrink-0 h-12 w-12 rounded bg-muted flex items-center justify-center"
                          >
                            {item.resources?.[0] ? (
                              <Image src={item.resources[0].url} alt={item.sku_name} fill className="object-cover rounded" />
                            ) : (
                              <Package className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        ))}
                        {order.items.length > 4 && (
                          <div className="flex-shrink-0 h-12 w-12 rounded bg-muted flex items-center justify-center text-sm text-muted-foreground">
                            +{order.items.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {/* Load More */}
            {hasNextPage && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
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
        )}
      </div>
    </div>
  )
}
