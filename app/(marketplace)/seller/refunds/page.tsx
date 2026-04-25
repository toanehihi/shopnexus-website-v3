"use client"

import { useState } from "react"
import {
  useListRefundsSeller,
  useAcceptRefundStage1,
  useApproveRefundStage2,
  useRejectRefund,
} from "@/core/order/refund.seller"
import { TRefund, RefundMethod } from "@/core/order/refund.buyer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
  CheckCircle,
  XCircle,
  RotateCcw,
  Truck,
  MapPin,
  Loader2,
  Clock,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type RejectDialogState = {
  refundId: string
  stage: 1 | 2
} | null

const statusBadge: Record<string, { label: string; className: string }> = {
  Pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
  Processing: { label: "Processing", className: "bg-blue-100 text-blue-800" },
  Success: { label: "Refunded", className: "bg-green-100 text-green-800" },
  Failed: { label: "Rejected", className: "bg-red-100 text-red-800" },
}

function RefundRow({
  refund,
  onAccept,
  onApprove,
  onRejectOpen,
  acceptPending,
  approvePending,
}: {
  refund: TRefund
  onAccept: (id: string) => void
  onApprove: (id: string) => void
  onRejectOpen: (state: RejectDialogState) => void
  acceptPending: boolean
  approvePending: boolean
}) {
  const badge = statusBadge[refund.Status] ?? statusBadge.Pending
  const isStage1Actionable = refund.Status === "Pending" && refund.AcceptedByID === null
  const isStage2Actionable =
    refund.Status === "Processing" &&
    refund.AcceptedByID !== null &&
    refund.ApprovedByID === null

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-sm">#{refund.ID.slice(0, 8)}</h3>
              <Badge
                variant="secondary"
                className={cn("font-normal", badge.className)}
              >
                {badge.label}
              </Badge>
              <Badge variant="outline" className="gap-1">
                {refund.Method === RefundMethod.PickUp ? (
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

            <p className="text-xs text-muted-foreground">
              Item #{refund.OrderItemID} &middot;{" "}
              {new Date(refund.DateCreated).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>

            <div className="flex items-start gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-muted-foreground">{refund.Reason}</p>
            </div>

            {refund.Address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground">{refund.Address}</p>
              </div>
            )}

            {refund.Status === "Failed" && (
              <p className="text-sm text-muted-foreground">
                Rejected — {refund.RejectionNote}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isStage1Actionable && (
              <>
                <Button
                  size="sm"
                  onClick={() => onAccept(refund.ID)}
                  disabled={acceptPending}
                >
                  {acceptPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Accept return
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRejectOpen({ refundId: refund.ID, stage: 1 })}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </>
            )}

            {isStage2Actionable && (
              <>
                <Button
                  size="sm"
                  onClick={() => onApprove(refund.ID)}
                  disabled={approvePending}
                >
                  {approvePending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve refund
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRejectOpen({ refundId: refund.ID, stage: 2 })}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </>
            )}

            {refund.Status === "Success" && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 font-normal"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Refunded
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SellerRefundsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [rejectDialog, setRejectDialog] = useState<RejectDialogState>(null)
  const [rejectionNote, setRejectionNote] = useState("")

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useListRefundsSeller({
      limit: 20,
      ...(activeTab !== "all" ? { status: activeTab } : {}),
    })

  const acceptMutation = useAcceptRefundStage1()
  const approveMutation = useApproveRefundStage2()
  const rejectMutation = useRejectRefund()

  const refunds = data?.pages.flatMap((page) => page.data) ?? []

  const handleAccept = (id: string) => {
    acceptMutation.mutate(
      { id },
      { onError: () => toast.error("Failed to accept return.") },
    )
  }

  const handleApprove = (id: string) => {
    approveMutation.mutate(
      { id },
      { onError: () => toast.error("Failed to approve refund.") },
    )
  }

  const handleRejectSubmit = async () => {
    if (!rejectDialog || !rejectionNote.trim()) return

    rejectMutation.mutate(
      {
        id: rejectDialog.refundId,
        stage: rejectDialog.stage,
        rejection_note: rejectionNote.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Refund rejected.")
          setRejectDialog(null)
          setRejectionNote("")
        },
        onError: () => toast.error("Failed to reject refund."),
      },
    )
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
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="Pending">
            <Clock className="h-3.5 w-3.5 mr-1" />
            Pending
          </TabsTrigger>
          <TabsTrigger value="Processing">Processing</TabsTrigger>
          <TabsTrigger value="Success">Refunded</TabsTrigger>
          <TabsTrigger value="Failed">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Refund List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : refunds.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <RotateCcw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No refunds found</h3>
            <p className="text-muted-foreground">Refund requests will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {refunds.map((refund) => (
            <RefundRow
              key={refund.ID}
              refund={refund}
              onAccept={handleAccept}
              onApprove={handleApprove}
              onRejectOpen={setRejectDialog}
              acceptPending={acceptMutation.isPending}
              approvePending={approveMutation.isPending}
            />
          ))}

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

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRejectDialog(null)
            setRejectionNote("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Refund</DialogTitle>
            <DialogDescription>
              {rejectDialog?.stage === 1
                ? "Reject the return request (stage 1). The buyer will not need to ship the item back."
                : "Reject the refund after return (stage 2). Provide a reason for the rejection."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="rejection-note" className="font-medium">
              Rejection reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="rejection-note"
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Explain why this refund is being rejected..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialog(null)
                setRejectionNote("")
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectSubmit}
              disabled={!rejectionNote.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit reject"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
