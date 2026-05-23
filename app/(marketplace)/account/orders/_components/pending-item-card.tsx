"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, ImageOff, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { useExchangeRates, useCurrency } from "@/core/common/currency"
import { formatPriceInline } from "@/lib/money"
import { useEnsureBuyerPaymentURL, TOrderItem } from "@/core/order/order.buyer"
import { toast } from "sonner"

type Props = {
  item: TOrderItem
  onCancel?: (id: number) => void
  readOnly?: boolean
}

export function PendingItemCard({ item, onCancel, readOnly = false }: Props) {
  const preferred = useCurrency()
  const { data: rateData } = useExchangeRates()
  const fmt = (amount: number) =>
    formatPriceInline(amount, "VND", preferred, rateData?.rates, "native")

  const txStatus = item.payment_session?.status
  let badgeLabel: string
  let badgeColor: string
  if (txStatus === "Pending") {
    badgeLabel = "Awaiting Payment"
    badgeColor =
      "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"
  } else if (txStatus === "Failed") {
    badgeLabel = "Payment Failed"
    badgeColor = "bg-destructive/10 text-destructive"
  } else if (txStatus === "Cancelled") {
    badgeLabel = "Cancelled"
    badgeColor = "bg-muted text-muted-foreground"
  } else {
    badgeLabel = "Awaiting Seller"
    badgeColor =
      "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200"
  }

  const ensurePaymentURL = useEnsureBuyerPaymentURL()
  const handleContinuePayment = async () => {
    const sessionID = item.payment_session?.id
    if (!sessionID) {
      toast.error("Payment session not found")
      return
    }
    try {
      const { payment_url } = await ensurePaymentURL.mutateAsync(
        String(sessionID),
      )
      if (payment_url) {
        window.location.href = payment_url
        return
      }
      toast.error("Payment URL unavailable")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not start payment"
      toast.error(msg)
    }
  }

  const isTerminal = txStatus === "Failed" || txStatus === "Cancelled"
  const showCancel =
    !readOnly && !item.order_id && !item.date_cancelled && !isTerminal && onCancel

  const linkTarget = item.slug ? `/product/${item.slug}` : null

  const Thumbnail = (
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
      {item.image_url ? (
        <Image
          src={item.image_url}
          alt={item.sku_name}
          fill
          className="object-cover"
          sizes="80px"
          unoptimized
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-muted-foreground">
          <ImageOff className="h-6 w-6" />
        </div>
      )}
    </div>
  )

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-sm">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {linkTarget ? (
            <Link href={linkTarget} className="shrink-0">
              {Thumbnail}
            </Link>
          ) : (
            Thumbnail
          )}

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {linkTarget ? (
                  <Link
                    href={linkTarget}
                    className="font-medium hover:underline line-clamp-2"
                  >
                    {item.sku_name}
                  </Link>
                ) : (
                  <p className="font-medium line-clamp-2">{item.sku_name}</p>
                )}
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Qty {item.quantity} · {fmt(Math.round(item.subtotal_amount / Math.max(item.quantity, 1)))} each
                </p>
              </div>
              <Badge
                variant="secondary"
                className={cn("font-normal gap-1 shrink-0", badgeColor)}
              >
                <Clock className="h-3 w-3" />
                {badgeLabel}
              </Badge>
            </div>

            {item.note && (
              <p className="text-xs text-muted-foreground italic truncate">
                Note: {item.note}
              </p>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-base font-semibold tabular-nums">
                {fmt(item.total_amount)}
              </span>
              <div className="flex items-center gap-2">
                {!readOnly && txStatus === "Pending" && (
                  <Button size="sm" onClick={handleContinuePayment}>
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Continue Payment
                  </Button>
                )}
                {showCancel && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive h-8"
                    onClick={() => onCancel(item.id)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
