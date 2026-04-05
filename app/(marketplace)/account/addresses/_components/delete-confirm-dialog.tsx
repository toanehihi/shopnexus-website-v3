"use client"

import { type Contact } from "@/core/account/contact"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface DeleteConfirmDialogProps {
  contact: Contact | null
  onOpenChange: (open: boolean) => void
  onDelete: () => void
  isDeleting: boolean
}

export function DeleteConfirmDialog({
  contact,
  onOpenChange,
  onDelete,
  isDeleting,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog
      open={!!contact}
      onOpenChange={() => onOpenChange(false)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Address</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this address? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        {contact && (
          <div className="rounded-lg border p-4 space-y-1">
            <p className="font-medium">{contact.full_name}</p>
            <p className="text-sm text-muted-foreground">
              {contact.address}
            </p>
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
