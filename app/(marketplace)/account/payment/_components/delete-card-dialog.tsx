"use client"

import { type PaymentMethod } from "@/core/account/payment-method"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CreditCard, Loader2 } from "lucide-react"

function formatCardNumber(last4?: string) {
  if (!last4) return null
  return `**** **** **** ${last4}`
}

function formatExpiry(month?: number, year?: number) {
  if (month == null || year == null) return null
  return `${String(month).padStart(2, "0")}/${year}`
}

function capitalizeFirst(str?: string) {
  if (!str) return null
  return str.charAt(0).toUpperCase() + str.slice(1)
}

interface DeleteCardDialogProps {
  method: PaymentMethod | null
  onOpenChange: (open: boolean) => void
  onDelete: () => void
  isDeleting: boolean
}

export function DeleteCardDialog({
  method,
  onOpenChange,
  onDelete,
  isDeleting,
}: DeleteCardDialogProps) {
  return (
    <Dialog
      open={!!method}
      onOpenChange={() => onOpenChange(false)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Card</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this card? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        {method && (
          <div className="rounded-lg border p-4 space-y-1">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">
                {method.data?.brand
                  ? `${capitalizeFirst(method.data.brand)} ${formatCardNumber(method.data.last4) ?? ""}`
                  : method.label}
              </p>
            </div>
            {method.data?.exp_month != null &&
              method.data?.exp_year != null && (
                <p className="text-sm text-muted-foreground pl-6">
                  Expires{" "}
                  {formatExpiry(
                    method.data.exp_month,
                    method.data.exp_year
                  )}
                </p>
              )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
