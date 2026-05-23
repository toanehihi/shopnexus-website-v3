"use client"

import { memo } from "react"
import { type Option } from "@/core/common/option"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Trash2, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  cardDataOf,
  capitalizeFirst,
  formatCardNumber,
  formatExpiry,
} from "./card-data"

interface PaymentCardItemProps {
  method: Option
  onDelete: (method: Option) => void
  onSetDefault: (id: string) => void
  isSettingDefault: boolean
}

export const PaymentCardItem = memo(function PaymentCardItem({
  method,
  onDelete,
  onSetDefault,
  isSettingDefault,
}: PaymentCardItemProps) {
  const data = cardDataOf(method)
  const isDefault = data.is_default ?? false
  const cardNumber = formatCardNumber(data.last4)
  const expiry = formatExpiry(data.exp_month, data.exp_year)
  const brand = capitalizeFirst(data.brand)
  const cardType = capitalizeFirst(data.card_type)

  return (
    <Card className={cn(isDefault && "border-primary")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {cardType && <Badge variant="secondary">{cardType}</Badge>}
            {isDefault && (
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
                : cardNumber ?? method.name}
            </span>
          </div>
          {expiry && (
            <p className="text-muted-foreground pl-6">Expires {expiry}</p>
          )}
        </div>

        {!isDefault && (
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
