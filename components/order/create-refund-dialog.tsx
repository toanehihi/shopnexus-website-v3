"use client"

import { useState } from "react"
import { useCreateRefund, RefundMethod } from "@/core/order/refund.buyer"
import { useListContacts } from "@/core/account/contact"
import { ImageUpload, type UploadedImage } from "@/components/ui/image-upload"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Package, MapPin } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CreateRefundDialogProps {
  orderId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateRefundDialog({ orderId, open, onOpenChange }: CreateRefundDialogProps) {
  const createRefund = useCreateRefund()
  const { data: contacts } = useListContacts()

  const [method, setMethod] = useState<RefundMethod>(RefundMethod.DropOff)
  const [reason, setReason] = useState("")
  const [selectedContactId, setSelectedContactId] = useState("")
  const [evidence, setEvidence] = useState<UploadedImage[]>([])

  const selectedContact = contacts?.find((c) => c.id === selectedContactId)
  const returnAddress = method === RefundMethod.PickUp ? selectedContact?.address ?? null : null

  const canSubmit = reason.trim().length > 0 && (method !== RefundMethod.PickUp || !!selectedContactId)

  const handleSubmit = async () => {
    if (!canSubmit) return

    try {
      await createRefund.mutateAsync({
        order_id: orderId,
        method,
        reason: reason.trim(),
        address: returnAddress,
        resource_ids: evidence.map((e) => e.id),
      })
      toast.success("Refund request submitted.")
      onOpenChange(false)
      // Reset form
      setMethod(RefundMethod.DropOff)
      setReason("")
      setSelectedContactId("")
      setEvidence([])
    } catch {
      toast.error("Failed to submit refund request.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Request Refund
          </DialogTitle>
          <DialogDescription>
            Describe the issue and choose a return method. The seller will review your request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Return Method */}
          <div className="space-y-2">
            <Label className="font-medium">Return Method</Label>
            <RadioGroup
              value={method}
              onValueChange={(v) => setMethod(v as RefundMethod)}
              className="grid grid-cols-2 gap-3"
            >
              <Label
                htmlFor="method-dropoff"
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/50",
                  method === RefundMethod.DropOff && "border-primary bg-accent/30"
                )}
              >
                <RadioGroupItem value={RefundMethod.DropOff} id="method-dropoff" />
                <div>
                  <p className="font-medium text-sm">Drop Off</p>
                  <p className="text-xs text-muted-foreground">Deliver to a drop-off point</p>
                </div>
              </Label>
              <Label
                htmlFor="method-pickup"
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/50",
                  method === RefundMethod.PickUp && "border-primary bg-accent/30"
                )}
              >
                <RadioGroupItem value={RefundMethod.PickUp} id="method-pickup" />
                <div>
                  <p className="font-medium text-sm">Pick Up</p>
                  <p className="text-xs text-muted-foreground">Carrier picks up from your address</p>
                </div>
              </Label>
            </RadioGroup>
          </div>

          {/* Return Address (only for PickUp) */}
          {method === RefundMethod.PickUp && (
            <div className="space-y-2">
              <Label className="font-medium flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Pickup Address
              </Label>
              {contacts && contacts.length > 0 ? (
                <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an address" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.full_name} — {contact.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">No saved addresses. Please add one first.</p>
              )}
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="refund-reason" className="font-medium">Reason</Label>
            <Textarea
              id="refund-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the issue with your order..."
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">{reason.length}/500</p>
          </div>

          {/* Evidence Photos */}
          <div className="space-y-2">
            <Label className="font-medium">Evidence (optional)</Label>
            <p className="text-xs text-muted-foreground mb-2">Upload photos or screenshots to support your request.</p>
            <ImageUpload
              value={evidence}
              onChange={setEvidence}
              maxFiles={5}
              maxSizeInMB={5}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || createRefund.isPending}
          >
            {createRefund.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Refund Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
