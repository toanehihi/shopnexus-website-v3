"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard } from "lucide-react"

interface PaymentInfoCardProps {
  payment: {
    option: string
    status: string
    date_paid: string | null
  } | null
}

export function PaymentInfoCard({ payment }: PaymentInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {payment ? (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Method</span>
              <span>{payment.option}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="secondary" className="font-normal">
                {payment.status}
              </Badge>
            </div>
            {payment.date_paid && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paid on</span>
                <span>
                  {new Date(payment.date_paid).toLocaleDateString()}
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
