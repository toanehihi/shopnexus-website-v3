"use client"

import { type Option } from "@/core/common/option"
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
import {
  cardDataOf,
  capitalizeFirst,
  formatCardNumber,
  formatExpiry,
} from "./card-data"

interface DeleteCardDialogProps {
  method: Option | null
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
  const data = method ? cardDataOf(method) : null
  return (
    <Dialog open={!!method} onOpenChange={() => onOpenChange(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Card</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this card? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        {method && data && (
          <div className="rounded-lg border p-4 space-y-1">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">
                {data.brand
                  ? `${capitalizeFirst(data.brand)} ${formatCardNumber(data.last4) ?? ""}`
                  : method.name}
              </p>
            </div>
            {data.exp_month != null && data.exp_year != null && (
              <p className="text-sm text-muted-foreground pl-6">
                Expires {formatExpiry(data.exp_month, data.exp_year)}
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
