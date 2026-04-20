"use client"

import { Price } from "@/components/ui/price"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface OrderSummaryCardProps {
  productCost: number
  productDiscount: number
  transportCost: number
  total: number
  currency: string
}

export function OrderSummaryCard({
  productCost,
  productDiscount,
  transportCost,
  total,
  currency,
}: OrderSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-start text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <Price
            amount={productCost}
            currency={currency}
            emphasis="native"
            showRateHint
          />
        </div>
        {productDiscount > 0 && (
          <div className="flex justify-between items-start text-sm">
            <span className="text-muted-foreground">Discount</span>
            <span className="text-green-600 inline-flex items-center gap-0.5">
              -
              <Price
                amount={productDiscount}
                currency={currency}
                emphasis="native"
                showRateHint
              />
            </span>
          </div>
        )}
        <div className="flex justify-between items-start text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span>
            {transportCost === 0 ? (
              "Free"
            ) : (
              <Price
                amount={transportCost}
                currency={currency}
                emphasis="native"
                showRateHint
              />
            )}
          </span>
        </div>
        <Separator />
        <div className="flex justify-between items-start font-semibold">
          <span>Total</span>
          <Price
            amount={total}
            currency={currency}
            emphasis="native"
            showRateHint
            className="font-semibold"
          />
        </div>
      </CardContent>
    </Card>
  )
}
