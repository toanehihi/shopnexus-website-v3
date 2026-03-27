"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  useListRefunds,
  useCancelRefund,
  TRefund,
} from "@/core/order/refund.buyer"
import { Status } from "@/core/common/status.type"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { RotateCcw, XCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const statusLabels: Record<Status, string> = {
  [Status.Pending]: "Pending",
  [Status.Processing]: "Approved",
  [Status.Success]: "Completed",
  [Status.Canceled]: "Cancelled",
  [Status.Failed]: "Rejected",
}

const statusColors: Record<Status, string> = {
  [Status.Pending]: "bg-yellow-100 text-yellow-800",
  [Status.Processing]: "bg-green-100 text-green-800",
  [Status.Success]: "bg-green-100 text-green-800",
  [Status.Canceled]: "bg-gray-100 text-gray-800",
  [Status.Failed]: "bg-red-100 text-red-800",
}

export default function RefundsPage() {
  const {
    data: refundsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListRefunds({ limit: 10 })

  const refunds = useMemo(() => {
    return refundsData?.pages.flatMap((page) => page.data) ?? []
  }, [refundsData])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Refunds</h1>
        <p className="text-muted-foreground">
          Track and manage your refund requests
        </p>
      </div>

      <RefundList
        refunds={refunds}
        isLoading={isLoading}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={() => fetchNextPage()}
      />
    </div>
  )
}

function RefundList({
  refunds,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  refunds: TRefund[]
  isLoading?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
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
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-2" />
              <Separator className="my-4" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-28" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (refunds.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <RotateCcw className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No refund requests</h3>
        <p className="text-muted-foreground mb-4">
          You haven&apos;t submitted any refund requests yet.
        </p>
        <Button asChild>
          <Link href="/account/orders">View Orders</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {refunds.map((refund) => (
        <RefundCard key={refund.id} refund={refund} />
      ))}

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

function RefundCard({ refund }: { refund: TRefund }) {
  const cancelRefund = useCancelRefund()
  const [confirmingCancel, setConfirmingCancel] = useState(false)

  const handleCancel = () => {
    if (!confirmingCancel) {
      setConfirmingCancel(true)
      return
    }
    cancelRefund.mutate(
      { id: refund.id },
      { onSettled: () => setConfirmingCancel(false) }
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header: ID, Order ref, Date, Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium">
              Refund #{refund.id.slice(0, 8)}
            </span>
            <span className="text-muted-foreground">
              Order #{refund.order_id.slice(0, 8)}
            </span>
          </div>
          <Badge
            variant="secondary"
            className={cn("font-normal", statusColors[refund.status])}
          >
            {statusLabels[refund.status]}
          </Badge>
        </div>

        {/* Reason */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {refund.reason}
        </p>

        <Separator className="my-4" />

        {/* Footer: Date + Cancel */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {new Date(refund.date_created).toLocaleDateString()}
          </span>

          <div className="flex gap-2">
            {refund.status === Status.Pending && (
              <Button
                variant={confirmingCancel ? "destructive" : "outline"}
                size="sm"
                onClick={handleCancel}
                disabled={cancelRefund.isPending}
              >
                {cancelRefund.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-1" />
                )}
                {confirmingCancel ? "Confirm Cancel" : "Cancel Refund"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
