"use client"

import { memo } from "react"
import Link from "next/link"
import { TRefundDispute } from "@/core/order/dispute"
import { Status } from "@/core/common/status.type"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Clock, Loader, CheckCircle, XCircle, Ban, ExternalLink, Scale } from "lucide-react"
import { cn } from "@/lib/utils"

const statusConfig: Record<Status, { label: string; color: string; icon: React.ElementType }> = {
  [Status.Pending]: { label: "Under Review", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  [Status.Processing]: { label: "In Progress", color: "bg-blue-100 text-blue-800", icon: Loader },
  [Status.Success]: { label: "Resolved", color: "bg-green-100 text-green-800", icon: CheckCircle },
  [Status.Failed]: { label: "Rejected", color: "bg-red-100 text-red-800", icon: XCircle },
  [Status.Canceled]: { label: "Cancelled", color: "bg-gray-100 text-gray-800", icon: Ban },
}

export const DisputeCard = memo(function DisputeCard({ dispute }: { dispute: TRefundDispute }) {
  const config = statusConfig[dispute.status] ?? statusConfig[Status.Pending]
  const StatusIcon = config.icon

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium text-sm">Dispute</span>
            </div>
            <span className="text-xs text-muted-foreground">
              #{dispute.id.slice(0, 8)} &middot; Refund #{dispute.refund_id.slice(0, 8)}
            </span>
          </div>
          <Badge
            variant="secondary"
            className={cn("font-normal gap-1 flex-shrink-0", config.color)}
          >
            <StatusIcon className="h-3 w-3" />
            {config.label}
          </Badge>
        </div>

        {/* Reason */}
        <div className="space-y-1.5 mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reason</p>
          <p className="text-sm line-clamp-2">{dispute.reason}</p>
        </div>

        {/* Note */}
        {dispute.note && (
          <div className="space-y-1.5 mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Details</p>
            <p className="text-sm text-muted-foreground line-clamp-3">{dispute.note}</p>
          </div>
        )}

        <Separator className="my-3" />

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">
              Opened {formatDate(dispute.date_created)}
            </span>
            {dispute.date_resolved && (
              <span className="text-xs text-muted-foreground">
                Resolved {formatDate(dispute.date_resolved)}
              </span>
            )}
          </div>

          <Button variant="ghost" size="sm" asChild>
            <Link href={`/account/refunds`} className="gap-1 text-xs">
              <ExternalLink className="h-3.5 w-3.5" />
              View Refund
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})
