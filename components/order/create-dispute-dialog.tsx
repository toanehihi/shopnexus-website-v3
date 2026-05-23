"use client"

import { useState } from "react"
import { useCreateRefundDispute } from "@/core/order/dispute"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Scale } from "lucide-react"
import { toast } from "sonner"

interface CreateDisputeDialogProps {
  refundId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateDisputeDialog({ refundId, open, onOpenChange }: CreateDisputeDialogProps) {
  const createDispute = useCreateRefundDispute()

  const [reason, setReason] = useState("")
  const [note, setNote] = useState("")

  const canSubmit = reason.trim().length > 0 && note.trim().length > 0

  const handleSubmit = async () => {
    if (!canSubmit) return

    try {
      await createDispute.mutateAsync({
        refund_id: refundId,
        reason: reason.trim(),
        note: note.trim(),
      })
      toast.success("Dispute submitted successfully. We'll review your case shortly.")
      onOpenChange(false)
      // Reset form
      setReason("")
      setNote("")
    } catch {
      toast.error("Failed to submit dispute. Please try again.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Open Dispute
          </DialogTitle>
          <DialogDescription>
            If you disagree with the refund decision, you can open a dispute. Our team will review the case and make a final decision.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="dispute-reason" className="font-medium">Reason</Label>
            <Input
              id="dispute-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Item was defective, not as described..."
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">{reason.length}/1000</p>
          </div>

          {/* Note / Supporting Details */}
          <div className="space-y-2">
            <Label htmlFor="dispute-note" className="font-medium">Supporting Details</Label>
            <p className="text-xs text-muted-foreground">
              Provide additional context, evidence references, or details to support your dispute.
            </p>
            <Textarea
              id="dispute-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Explain why you believe the refund should be reconsidered..."
              maxLength={2000}
              rows={4}
            />
            <p className="text-xs text-muted-foreground text-right">{note.length}/2000</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || createDispute.isPending}
          >
            {createDispute.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Dispute"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
