"use client"

import { memo, useState } from "react"
import Link from "next/link"
import { TRefund, RefundStatus } from "@/core/order/refund.buyer"
import { CreateDisputeDialog } from "@/components/order/create-dispute-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Scale, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

const statusConfig: Record<
  RefundStatus,
  { label: string; className: string }
> = {
  Pending: {
    label: "Awaiting seller review",
    className: "bg-blue-100 text-blue-800",
  },
  Processing: {
    label: "Return shipping in progress",
    className: "bg-yellow-100 text-yellow-800",
  },
  Success: {
    label: "Refunded",
    className: "bg-green-100 text-green-800",
  },
  Failed: {
    label: "Rejected",
    className: "bg-red-100 text-red-800",
  },
}

function StageIndicator({ refund }: { refund: TRefund }) {
  const stages = [
    { label: "Requested", done: true },
    { label: "Seller accepted", done: refund.accepted_by_id !== null },
    { label: "Refund approved", done: refund.approved_by_id !== null },
  ]

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      {stages.map((stage, idx) => (
        <span key={stage.label} className="flex items-center gap-1">
          {idx > 0 && <span className="text-muted-foreground/50">›</span>}
          <span className={cn(stage.done ? "text-foreground font-medium" : "")}>
            {stage.label}
          </span>
        </span>
      ))}
    </div>
  )
}

export const RefundCard = memo(function RefundCard({ refund }: { refund: TRefund }) {
  const [showDisputeDialog, setShowDisputeDialog] = useState(false)

  const config = statusConfig[refund.status] ?? statusConfig.Pending

  return (
    <>
      <Card>
        <CardContent className="p-4">
          {/* Header: ID, Status */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-sm">
                Refund request
              </span>
              <span className="text-xs text-muted-foreground">
                #{refund.id.slice(0, 8)} &middot; Item #{refund.order_item_id}
              </span>
            </div>
            <Badge
              variant="secondary"
              className={cn("font-normal", config.className)}
            >
              {config.label}
            </Badge>
          </div>

          {/* Stage indicator */}
          <StageIndicator refund={refund} />

          {/* Reason */}
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {refund.reason}
          </p>

          {/* Rejection note */}
          {refund.status === "Failed" && refund.rejection_note && (
            <p className="text-sm text-destructive mt-1">
              Rejected — {refund.rejection_note}
            </p>
          )}

          <Separator className="my-4" />

          {/* Footer: Date + Actions */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {new Date(refund.date_created).toLocaleDateString()}
            </span>

            <div className="flex gap-2">
              {refund.status === "Failed" && (
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
