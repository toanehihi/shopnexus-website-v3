"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useListRefundsSeller, useConfirmRefundSeller, useCancelRefundSeller, TRefund, RefundMethod } from "@/core/order/refund.seller"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  RotateCcw,
  Package,
  Truck,
  MapPin,
  Loader2,
  Clock,
  AlertCircle,
} from "lucide-react"

type RefundStatus = "Pending" | "Approved" | "Rejected" | "Completed"

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  Pending: { label: "Pending", variant: "secondary", icon: Clock },
  Approved: { label: "Approved", variant: "default", icon: CheckCircle },
  Rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
  Completed: { label: "Completed", variant: "outline", icon: Package },
}

export default function SellerRefundsPage() {
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedRefund, setSelectedRefund] = useState<TRefund | null>(null)
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null)

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useListRefundsSeller({
    limit: 20,
    ...(activeTab !== "all" ? { status: activeTab } : {}),
  })
  const confirmMutation = useConfirmRefundSeller()
  const cancelMutation = useCancelRefundSeller()

  const refunds = data?.pages.flatMap((page) => page.data) ?? []

  const filteredRefunds = refunds.filter((refund) =>
    refund.id.toLowerCase().includes(search.toLowerCase()) ||
    refund.order_id.toLowerCase().includes(search.toLowerCase())
  )

  const handleAction = async () => {
    if (!selectedRefund) return

    if (actionType === "approve") {
      await confirmMutation.mutateAsync({ id: selectedRefund.id })
    } else if (actionType === "reject") {
      await cancelMutation.mutateAsync({ id: selectedRefund.id })
    }

    setSelectedRefund(null)
    setActionType(null)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getStatusFromString = (status: any): string => {
    if (typeof status === "string") return status
    return "Pending"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Refunds</h1>
        <p className="text-muted-foreground">Review and process refund requests</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Refunds</TabsTrigger>
          <TabsTrigger value="Pending">Pending</TabsTrigger>
          <TabsTrigger value="Approved">Approved</TabsTrigger>
          <TabsTrigger value="Completed">Completed</TabsTrigger>
          <TabsTrigger value="Rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by refund or order ID..."
          className="pl-10 max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Refunds List */}
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
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredRefunds.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <RotateCcw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No refunds found</h3>
            <p className="text-muted-foreground">
              {search ? "Try a different search term" : "Refund requests will appear here"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRefunds.map((refund) => {
            const statusStr = getStatusFromString(refund.status)
            const status = statusConfig[statusStr] || statusConfig.Pending
            const StatusIcon = status.icon

            return (
              <Card key={refund.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium">Refund #{refund.id.slice(0, 8)}</h3>
                        <Badge variant={status.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          {refund.method === RefundMethod.PickUp ? (
                            <>
                              <Truck className="h-3 w-3" />
                              Pick Up
                            </>
                          ) : (
                            <>
                              <MapPin className="h-3 w-3" />
                              Drop Off
                            </>
                          )}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Order #{refund.order_id.slice(0, 8)} • {formatDate(refund.date_created)}
                      </p>

                      <div className="flex items-start gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <p className="text-muted-foreground">{refund.reason}</p>
                      </div>

                      {refund.address && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <p className="text-muted-foreground">{refund.address}</p>
                        </div>
                      )}

                      {refund.resources && refund.resources.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {refund.resources.slice(0, 3).map((resource, idx) => (
                            <div
                              key={idx}
                              className="relative h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden"
                            >
                              <Image
                                src={resource.url}
                                alt="Evidence"
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                          {refund.resources.length > 3 && (
                            <div className="h-12 w-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                              +{refund.resources.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {statusStr === "Pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRefund(refund)
                              setActionType("approve")
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRefund(refund)
                              setActionType("reject")
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/seller/orders/${refund.order_id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Order
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* Action Confirmation Dialog */}
      <Dialog open={!!selectedRefund && !!actionType} onOpenChange={() => { setSelectedRefund(null); setActionType(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Refund" : "Reject Refund"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? `Are you sure you want to approve refund #${selectedRefund?.id.slice(0, 8)}? This will initiate the refund process.`
                : `Are you sure you want to reject refund #${selectedRefund?.id.slice(0, 8)}? This action cannot be undone.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedRefund(null); setActionType(null) }}>
              Cancel
            </Button>
            <Button
              variant={actionType === "reject" ? "destructive" : "default"}
              onClick={handleAction}
              disabled={confirmMutation.isPending || cancelMutation.isPending}
            >
              {(confirmMutation.isPending || cancelMutation.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : actionType === "approve" ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Refund
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Refund
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
