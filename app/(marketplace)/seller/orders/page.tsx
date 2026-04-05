"use client"

import { useState, useMemo, useEffect } from "react"
import { useDebounceValue } from "usehooks-ts"
import Link from "next/link"
import Image from "next/image"
import { ProductLink } from "@/components/product/product-link"
import {
  useListSellerPending,
  useConfirmSellerPending,
  useRejectSellerPending,
  useListSellerConfirmed,
  useQuoteTransport,
  TQuoteTransportResult,
} from "@/core/order/order.seller"
import { TOrderItem } from "@/core/order/order.buyer"
import { useListServiceOption } from "@/core/common/option"
import { useGetAccount } from "@/core/account/account"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  CheckCircle,
  XCircle,
  Package,
  Inbox,
  Loader2,
  MapPin,
  MoreVertical,
  Eye,
  ShoppingCart,
  Truck,
  Clock,
} from "lucide-react"
import { formatPrice, cn } from "@/lib/utils"
import { toast } from "sonner"

// ===== Shared Helpers =====

function AccountName({ id, fallback = "User" }: { id: string; fallback?: string }) {
  const { data } = useGetAccount(id)
  return <>{data?.name || data?.username || fallback}</>
}

function summarizeOrder(items?: Array<{ sku_name: string }>): string {
  if (!items?.length) return "Order"
  if (items.length === 1) return items[0].sku_name
  if (items.length === 2) return `${items[0].sku_name}, ${items[1].sku_name}`
  return `${items[0].sku_name} and ${items.length - 1} more`
}

function getOrderDisplayStatus(order: { payment?: { status: string } | null; transport?: { status: string } | null }): { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType } {
  const ps = order.payment?.status
  const ts = order.transport?.status

  if (!order.payment) return { label: "Unpaid", variant: "secondary", icon: Clock }
  if (ps === "Pending") return { label: "Awaiting Payment", variant: "secondary", icon: Clock }
  if (ps === "Failed") return { label: "Payment Failed", variant: "destructive", icon: XCircle }
  if (ps === "Cancelled") return { label: "Cancelled", variant: "destructive", icon: XCircle }
  if (ts === "Delivered") return { label: "Completed", variant: "outline", icon: Package }
  if (ts === "InTransit" || ts === "OutForDelivery") return { label: "Shipping", variant: "default", icon: Truck }
  if (ts === "Failed" || ts === "Cancelled") return { label: "Delivery Failed", variant: "destructive", icon: XCircle }
  return { label: "Processing", variant: "default", icon: CheckCircle }
}

// ===== Incoming Tab =====

function IncomingTab() {
  const [search, setSearch] = useState("")
  const [debouncedSearch] = useDebounceValue(search, 300)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [transportOption, setTransportOption] = useState("")
  const [confirmNote, setConfirmNote] = useState("")

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useListSellerPending({
      limit: 20,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    })
  const { data: transportOptions } = useListServiceOption({ category: "transport" })
  const confirmMutation = useConfirmSellerPending()
  const rejectMutation = useRejectSellerPending()
  const quoteMutation = useQuoteTransport()
  const [quote, setQuote] = useState<TQuoteTransportResult | null>(null)

  // Fetch quote when transport option or selected items change
  useEffect(() => {
    if (!showConfirmDialog || !transportOption || selectedIds.size === 0) {
      setQuote(null)
      return
    }
    quoteMutation.mutateAsync({
      item_ids: Array.from(selectedIds),
      transport_option: transportOption,
    }).then(setQuote).catch(() => setQuote(null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transportOption, showConfirmDialog])

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  )

  const grouped = useMemo(() => {
    const map = new Map<string, TOrderItem[]>()
    for (const item of items) {
      const key = `${item.account_id}::${item.address}`
      const existing = map.get(key) ?? []
      existing.push(item)
      map.set(key, existing)
    }
    return Array.from(map.entries())
  }, [items])

  const toggleItem = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)))
    }
  }

  const handleConfirm = async () => {
    if (!transportOption || selectedIds.size === 0) return
    try {
      await confirmMutation.mutateAsync({
        item_ids: Array.from(selectedIds),
        transport_option: transportOption,
        note: confirmNote || undefined,
      })
      toast.success("Items confirmed and order created.")
      setSelectedIds(new Set())
      setShowConfirmDialog(false)
      setTransportOption("")
      setConfirmNote("")
      setQuote(null)
    } catch {
      toast.error("Failed to confirm items.")
    }
  }

  const handleReject = async () => {
    if (selectedIds.size === 0) return
    try {
      await rejectMutation.mutateAsync({ item_ids: Array.from(selectedIds) })
      toast.success("Items rejected.")
      setSelectedIds(new Set())
      setShowRejectDialog(false)
    } catch {
      toast.error("Failed to reject items.")
    }
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by SKU name, ID, or buyer..."
          className="pl-10 max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Bulk Actions */}
      {items.length > 0 && (
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={selectAll}>
            {selectedIds.size === items.length ? "Deselect All" : "Select All"}
          </Button>
          {selectedIds.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected
              </span>
              <Button size="sm" onClick={() => setShowConfirmDialog(true)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Selected
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowRejectDialog(true)}>
                <XCircle className="h-4 w-4 mr-2" />
                Reject Selected
              </Button>
            </>
          )}
        </div>
      )}

      {/* Items List */}
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
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No incoming items</h3>
            <p className="text-muted-foreground">
              {search ? "Try a different search term" : "New items from buyers will appear here"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(([key, groupItems]) => {
            const [buyerId, address] = key.split("::")
            return (
              <Card key={key}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                    <Badge variant="outline">
                      <AccountName id={buyerId} fallback="Buyer" />
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {address}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {groupItems.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-colors min-h-28",
                          selectedIds.has(item.id) && "border-primary bg-accent/30",
                        )}
                      >
                        <Checkbox
                          checked={selectedIds.has(item.id)}
                          onCheckedChange={() => toggleItem(item.id)}
                          className="mt-1"
                        />
                        <div className="relative h-12 w-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                          {item.resources?.[0] ? (
                            <Image src={item.resources[0].url} alt={item.sku_name} fill className="object-cover rounded" />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <ProductLink spuId={item.spu_id} onClick={(e) => e.stopPropagation()}>
                            {item.sku_name}
                          </ProductLink>
                          {item.note && (
                            <p className="text-sm text-muted-foreground truncate">{item.note}</p>
                          )}
                          <div className="flex items-center gap-4 mt-1 text-sm">
                            <span>Qty: {item.quantity}</span>
                            <span className="font-medium">{formatPrice(item.unit_price)}/ea</span>
                            <span className="font-medium">{formatPrice(item.unit_price * item.quantity)} total</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {hasNextPage && (
            <div className="text-center pt-4">
              <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading...</> : "Load More"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Confirm Items Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Items</DialogTitle>
            <DialogDescription>
              Confirm {selectedIds.size} selected item{selectedIds.size !== 1 ? "s" : ""} and create an order. Choose a transport option.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Quote Summary */}
            <div className="rounded-lg border bg-muted/50 p-3 space-y-1.5">
              {items.filter((i) => selectedIds.has(i.id)).map((item) => (
                <div key={item.id} className="flex justify-between gap-4 text-sm">
                  <span className="min-w-0 truncate">{item.sku_name} x{item.quantity}</span>
                  <span className="font-medium flex-shrink-0">{formatPrice(item.unit_price * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-1.5 border-t text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>
                  {formatPrice(
                    items
                      .filter((i) => selectedIds.has(i.id))
                      .reduce((sum, i) => sum + i.unit_price * i.quantity, 0)
                  )}
                </span>
              </div>
              {quote && quote.product_discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(quote.product_discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  {quoteMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin inline" />
                  ) : quote ? (
                    formatPrice(quote.transport_cost)
                  ) : (
                    "Select transport"
                  )}
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t font-semibold">
                <span>Total</span>
                <span>
                  {quoteMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin inline" />
                  ) : quote ? (
                    formatPrice(quote.total)
                  ) : (
                    formatPrice(
                      items
                        .filter((i) => selectedIds.has(i.id))
                        .reduce((sum, i) => sum + i.unit_price * i.quantity, 0)
                    )
                  )}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Transport Option</Label>
              {transportOptions && transportOptions.length > 0 ? (
                <RadioGroup value={transportOption} onValueChange={setTransportOption} className="space-y-2">
                  {transportOptions.map((option) => (
                    <Label
                      key={option.id}
                      htmlFor={`transport-${option.id}`}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/50",
                        transportOption === option.id && "border-primary bg-accent/30",
                      )}
                    >
                      <RadioGroupItem value={option.id} id={`transport-${option.id}`} />
                      <div>
                        <span className="font-medium">{option.name}</span>
                        {option.description && <p className="text-sm text-muted-foreground">{option.description}</p>}
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              ) : (
                <p className="text-sm text-muted-foreground">No transport options available.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-note">Note (optional)</Label>
              <Textarea
                id="confirm-note"
                placeholder="Add a note for the buyer..."
                value={confirmNote}
                onChange={(e) => setConfirmNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={!transportOption || confirmMutation.isPending}>
              {confirmMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Confirming...</>
              ) : (
                <><CheckCircle className="h-4 w-4 mr-2" />Confirm Items</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Items Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Items</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject {selectedIds.size} selected item{selectedIds.size !== 1 ? "s" : ""}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejectMutation.isPending}>
              {rejectMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Rejecting...</>
              ) : (
                <><XCircle className="h-4 w-4 mr-2" />Reject Items</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===== Confirmed Tab =====

function ConfirmedTab() {
  const [search, setSearch] = useState("")
  const [debouncedSearch] = useDebounceValue(search, 300)

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useListSellerConfirmed({
    limit: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  })

  const orders = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  )

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
    })

  return (
    <div className="space-y-4">
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
      ) : orders.length === 0 ? (
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
          {orders.map((order) => {
            const status = getOrderDisplayStatus(order)
            const StatusIcon = status.icon

            return (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="font-medium truncate">{summarizeOrder(order.items)}</h3>
                        <Badge variant={status.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                        {order.payment === null && (
                          <Badge variant="destructive" className="font-normal">Unpaid</Badge>
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

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {order.items.slice(0, 4).map((item) => (
                        <div key={item.id} className="relative flex-shrink-0 h-12 w-12 rounded bg-muted flex items-center justify-center">
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

          {hasNextPage && (
            <div className="text-center pt-4">
              <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading...</> : "Load More"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ===== Main Page =====

export default function SellerOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Manage incoming items and confirmed orders</p>
      </div>

      <Tabs defaultValue="incoming">
        <TabsList>
          <TabsTrigger value="incoming">Incoming</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="mt-6">
          <IncomingTab />
        </TabsContent>

        <TabsContent value="confirmed" className="mt-6">
          <ConfirmedTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
