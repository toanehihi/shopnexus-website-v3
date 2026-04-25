"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useExchangeRates, useCurrency } from "@/core/common/currency"
import { formatPriceInline } from "@/lib/money"

interface OrderSummaryCardProps {
  totalAmount: number
  currency: string
}

export function OrderSummaryCard({
  totalAmount,
  currency,
}: OrderSummaryCardProps) {
  const preferred = useCurrency()
  const { data: rateData } = useExchangeRates()
  const fmt = (amount: number) =>
    formatPriceInline(amount, currency, preferred, rateData?.rates, "native")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center font-semibold">
          <span>Total</span>
          <span>{fmt(totalAmount)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
