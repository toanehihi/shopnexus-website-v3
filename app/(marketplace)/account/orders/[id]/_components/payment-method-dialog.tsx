"use client"

import { useListPaymentMethods } from "@/core/account/payment-method"
import { useListServiceOption } from "@/core/common/option"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CreditCard, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaymentMethodDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedPaymentOption: string
  onSelectedPaymentOptionChange: (value: string) => void
  onPay: () => void
  isPaying: boolean
}

export function PaymentMethodDialog({
  open,
  onOpenChange,
  selectedPaymentOption,
  onSelectedPaymentOptionChange,
  onPay,
  isPaying,
}: PaymentMethodDialogProps) {
  const { data: paymentMethods } = useListPaymentMethods()
  const { data: serviceOptions } = useListServiceOption({ category: "payment" })

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Payment Method</DialogTitle>
        </DialogHeader>

        <RadioGroup
          value={selectedPaymentOption}
          onValueChange={onSelectedPaymentOptionChange}
          className="space-y-2"
        >
          {/* Saved Cards */}
          {paymentMethods && paymentMethods.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Saved Cards</p>
              {paymentMethods.map((pm) => (
                <Label
                  key={pm.id}
                  htmlFor={`pm-${pm.id}`}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/50",
                    selectedPaymentOption === `pm:${pm.id}` && "border-primary bg-accent/30"
                  )}
                >
                  <RadioGroupItem value={`pm:${pm.id}`} id={`pm-${pm.id}`} />
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="font-medium">
                      {pm.data.brand ?? pm.provider} **** {pm.data.last4}
                    </span>
                    {pm.data.exp_month && pm.data.exp_year && (
                      <p className="text-xs text-muted-foreground">
                        Expires {String(pm.data.exp_month).padStart(2, "0")}/{pm.data.exp_year}
                      </p>
                    )}
                  </div>
                  {pm.is_default && (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  )}
                </Label>
              ))}
            </div>
          )}

          {/* Other Payment Methods */}
          {serviceOptions && serviceOptions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Other Payment Methods</p>
              {serviceOptions.map((option) => (
                <Label
                  key={option.id}
                  htmlFor={`so-${option.id}`}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/50",
                    selectedPaymentOption === option.id && "border-primary bg-accent/30"
                  )}
                >
                  <RadioGroupItem value={option.id} id={`so-${option.id}`} />
                  <div>
                    <span className="font-medium">{option.name}</span>
                    {option.description && (
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    )}
                  </div>
                </Label>
              ))}
            </div>
          )}
        </RadioGroup>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={!selectedPaymentOption || isPaying}
            onClick={onPay}
          >
            {isPaying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
