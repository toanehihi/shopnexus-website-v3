"use client"

import { memo, useState } from "react"
import Link from "next/link"
import { useCancelRefund, TRefund } from "@/core/order/refund.buyer"
import { Status } from "@/core/common/status.type"
import { CreateDisputeDialog } from "@/components/order/create-dispute-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { XCircle, Loader2, Scale, ExternalLink } from "lucide-react"
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

export const RefundCard = memo(function RefundCard({ refund }: { refund: TRefund }) {
  const cancelRefund = useCancelRefund()
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [showDisputeDialog, setShowDisputeDialog] = useState(false)

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
    <>
      <Card>
        <CardContent className="p-4">
          {/* Header: ID, Order ref, Date, Status */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-sm">
                Refund request
              </span>
              <span className="text-xs text-muted-foreground">
                #{refund.id.slice(0, 8)} &middot; Order #{refund.order_id.slice(0, 8)}
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

          {/* Footer: Date + Actions */}
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

              {refund.status === Status.Failed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDisputeDialog(true)}
                  className="gap-1"
                >
                  <Scale className="h-4 w-4" />
                  Open Dispute
                </Button>
              )}

              <Button variant="ghost" size="sm" asChild>
                <Link href={`/account/disputes?refund=${refund.id}`} className="gap-1">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Disputes
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <CreateDisputeDialog
        refundId={refund.id}
        open={showDisputeDialog}
        onOpenChange={setShowDisputeDialog}
      />
    </>
  )
})
