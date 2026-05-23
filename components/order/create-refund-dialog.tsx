"use client"

import { useState } from "react"
import { useCreateRefund, RefundMethod } from "@/core/order/refund.buyer"
import { useListServiceOption } from "@/core/common/option"
import { type TOrder, type TOrderItem } from "@/core/order/order.buyer"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
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
  order: TOrder
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateRefundDialog({ order, open, onOpenChange }: CreateRefundDialogProps) {
  const createRefund = useCreateRefund()
  const { data: transportOptions } = useListServiceOption({ type: "transport" })

  const items: TOrderItem[] = order.items ?? []

  const [selectedItemId, setSelectedItemId] = useState<number | null>(
    items.length === 1 ? items[0].id : null,
  )
  const [method, setMethod] = useState<RefundMethod>(RefundMethod.DropOff)
  const [reason, setReason] = useState("")
  const [address, setAddress] = useState("")
  const [returnTransportOption, setReturnTransportOption] = useState("")

  const canSubmit =
    selectedItemId !== null &&
    reason.trim().length > 0 &&
    reason.trim().length <= 500 &&
    returnTransportOption.trim().length > 0

  const handleSubmit = async () => {
    if (!canSubmit || selectedItemId === null) return

    try {
      await createRefund.mutateAsync({
        order_item_id: selectedItemId,
        method,
        reason: reason.trim(),
        address: method === RefundMethod.DropOff && address.trim() ? address.trim() : null,
        return_transport_option: returnTransportOption.trim(),
      })
      toast.success("Refund request submitted")
      onOpenChange(false)
      // Reset form
      setSelectedItemId(items.length === 1 ? items[0].id : null)
      setMethod(RefundMethod.DropOff)
      setReason("")
      setAddress("")
      setReturnTransportOption("")
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
            Choose the item to refund, return method, and describe the issue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Item Picker — hidden when only one item */}
          {items.length > 1 && (
            <div className="space-y-2">
              <Label className="font-medium">Select Item to Refund</Label>
              <RadioGroup
                value={selectedItemId?.toString() ?? ""}
                onValueChange={(v) => setSelectedItemId(Number(v))}
                className="space-y-2"
              >
                {items.map((item) => (
                  <Label
                    key={item.id}
                    htmlFor={`item-${item.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/50",
                      selectedItemId === item.id && "border-primary bg-accent/30",
                    )}
                  >
                    <RadioGroupItem value={item.id.toString()} id={`item-${item.id}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.sku_name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </div>
          )}

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
                  method === RefundMethod.DropOff && "border-primary bg-accent/30",
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
                  method === RefundMethod.PickUp && "border-primary bg-accent/30",
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

          {/* Address — shown only for DropOff */}
          {method === RefundMethod.DropOff && (
            <div className="space-y-2">
              <Label htmlFor="refund-address" className="font-medium flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Drop-off Address (optional)
              </Label>
              <Textarea
                id="refund-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter the drop-off address..."
                rows={2}
              />
            </div>
          )}

          {/* Return Transport Option */}
          <div className="space-y-2">
            <Label className="font-medium">Return Transport Option</Label>
            {transportOptions && transportOptions.length > 0 ? (
              <Select value={returnTransportOption} onValueChange={setReturnTransportOption}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a transport option" />
                </SelectTrigger>
                <SelectContent>
                  {transportOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.name}
                      {opt.description ? ` — ${opt.description}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={returnTransportOption}
                onChange={(e) => setReturnTransportOption(e.target.value)}
                placeholder="e.g. standard, express"
              />
            )}
          </div>

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
