"use client"

import { memo } from "react"
import { type PaymentMethod } from "@/core/account/payment-method"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Trash2, Star } from "lucide-react"
import { cn } from "@/lib/utils"

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

interface PaymentCardItemProps {
  method: PaymentMethod
  onDelete: (method: PaymentMethod) => void
  onSetDefault: (id: string) => void
  isSettingDefault: boolean
}

export const PaymentCardItem = memo(function PaymentCardItem({
  method,
  onDelete,
  onSetDefault,
  isSettingDefault,
}: PaymentCardItemProps) {
  const cardNumber = formatCardNumber(method.data?.last4)
  const expiry = formatExpiry(method.data?.exp_month, method.data?.exp_year)
  const brand = capitalizeFirst(method.data?.brand)
  const cardType = capitalizeFirst(method.data?.card_type)

  return (
    <Card className={cn(method.is_default && "border-primary")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {cardType && (
              <Badge variant="secondary">{cardType}</Badge>
            )}
            {method.is_default && (
              <Badge className="gap-1">
                <Star className="h-3 w-3" />
                Default
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(method)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium">
              {brand && cardNumber
                ? `${brand} ${cardNumber}`
                : cardNumber ?? method.label}
            </span>
          </div>
          {expiry && (
            <p className="text-muted-foreground pl-6">
              Expires {expiry}
            </p>
          )}
        </div>

        {!method.is_default && (
          <Button
            variant="outline"
            size="sm"
            className="mt-4 w-full"
            onClick={() => onSetDefault(method.id)}
            disabled={isSettingDefault}
          >
            <Star className="h-4 w-4 mr-1" />
            Set as Default
          </Button>
        )}
      </CardContent>
    </Card>
  )
})
