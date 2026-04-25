"use client"

import { memo } from "react"
import { useRouter } from "next/navigation"
import { TRefund, RefundStatus } from "@/core/order/refund.buyer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const statusConfig: Record<
  RefundStatus,
  { label: string; className: string; walletCredited?: boolean }
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
    walletCredited: true,
  },
  Failed: {
    label: "Rejected",
    className: "bg-red-100 text-red-800",
  },
}

function StageIndicator({ refund }: { refund: TRefund }) {
  const stages = [
    { label: "Requested", done: true },
    { label: "Seller accepted", done: refund.AcceptedByID !== null },
    { label: "Refund approved", done: refund.ApprovedByID !== null },
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
  const router = useRouter()
  const config = statusConfig[refund.Status] ?? {
    label: refund.Status as string,
    className: "",
  }

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-sm">Refund request</span>
            <span className="text-xs text-muted-foreground">
              #{refund.ID.slice(0, 8)} &middot; Item #{refund.OrderItemID}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge
              variant="secondary"
              className={cn("font-normal", config.className)}
            >
              {config.label}
            </Badge>
            {config.walletCredited && (
              <span className="text-xs text-green-700 font-medium">Wallet credited</span>
            )}
          </div>
        </div>

        {/* Stage indicator */}
        <StageIndicator refund={refund} />

        {/* Reason */}
        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
          {refund.Reason}
        </p>

        {/* Rejection note */}
        {refund.Status === "Failed" && refund.RejectionNote && (
          <p className="text-sm text-red-600 mt-1">
            <span className="font-medium">Rejection reason: </span>
            {refund.RejectionNote}
          </p>
        )}

        <Separator className="my-4" />

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {new Date(refund.DateCreated).toLocaleDateString()}
          </span>

          <div className="flex gap-2">
            {refund.Status === "Failed" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  // TODO: dispute creation
                  router.push(`/account/disputes/new?refund_id=${refund.ID}`)
                }
              >
                Raise dispute
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
