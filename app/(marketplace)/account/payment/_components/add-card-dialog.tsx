"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CreditCard, Loader2, Info } from "lucide-react"

export type CardFormData = {
  provider: string
  label: string
  token: string
  is_default: boolean
}

interface AddCardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: CardFormData
  onFormDataChange: (data: CardFormData) => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function AddCardDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSubmit,
  isSubmitting,
}: AddCardDialogProps) {
  const [showDevForm, setShowDevForm] = useState(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Card</DialogTitle>
          <DialogDescription>
            Add a credit or debit card to your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50 p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Card payment integration coming soon. You'll be able to add
                credit/debit cards for one-click payments.
              </p>
            </div>
          </div>

          {!showDevForm && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowDevForm(true)}
            >
              Manual entry (dev/testing)
            </Button>
          )}

          {showDevForm && (
            <div className="space-y-4 border rounded-lg p-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Dev / Testing Fallback
              </p>

              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Input
                  id="provider"
                  placeholder="e.g. stripe, adyen"
                  value={formData.provider}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, provider: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="label"
                    placeholder="e.g. My Visa ending in 4242"
                    className="pl-10"
                    value={formData.label}
                    onChange={(e) =>
                      onFormDataChange({ ...formData, label: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="token">Token</Label>
                <Input
                  id="token"
                  placeholder="tok_xxxxxxxxxxxx"
                  className="font-mono text-sm"
                  value={formData.token}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, token: e.target.value })
                  }
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={formData.is_default}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, is_default: e.target.checked })
                  }
                />
                <span className="text-sm">Set as default card</span>
              </label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {showDevForm && (
            <Button
              onClick={onSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Card"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
