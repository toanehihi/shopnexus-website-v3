"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard } from "lucide-react"
import type { TPaymentSession } from "@/core/order/order.buyer"

interface PaymentInfoCardProps {
  confirmSession: TPaymentSession | null | undefined
}

export function PaymentInfoCard({ confirmSession }: PaymentInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {confirmSession ? (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="secondary" className="font-normal">
                {confirmSession.status}
              </Badge>
            </div>
            {confirmSession.date_paid && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paid on</span>
                <span>
                  {new Date(confirmSession.date_paid).toLocaleDateString()}
                </span>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No payment yet. Pay to proceed with this order.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
