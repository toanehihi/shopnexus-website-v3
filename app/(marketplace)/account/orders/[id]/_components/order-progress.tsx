"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Clock, Check, Truck, Package, Loader } from "lucide-react"
import { cn } from "@/lib/utils"

const steps = [
  { key: "placed", label: "Order Placed", icon: Clock },
  { key: "paid", label: "Paid", icon: Check },
  { key: "processing", label: "Processing", icon: Loader },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Package },
]

interface OrderProgressProps {
  confirmFeeStatus?: string | null
  transportStatus?: string | null
}

export function OrderProgress({ confirmFeeStatus, transportStatus }: OrderProgressProps) {
  let currentStepIndex = 0
  if (confirmFeeStatus === "Success") currentStepIndex = 1
  if (transportStatus === "LabelCreated") currentStepIndex = 2
  if (transportStatus === "InTransit" || transportStatus === "OutForDelivery") currentStepIndex = 3
  if (transportStatus === "Delivered") currentStepIndex = 4

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index <= currentStepIndex
            const isCurrent = index === currentStepIndex
            const Icon = step.icon

            return (
              <div key={step.key} className="flex flex-col items-center flex-1">
                <div className="relative flex items-center w-full">
                  {index > 0 && (
                    <div
                      className={cn(
                        "absolute left-0 right-1/2 h-0.5 -translate-x-1/2",
                        index <= currentStepIndex ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "absolute left-1/2 right-0 h-0.5 translate-x-1/2",
                        index < currentStepIndex ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                  <div
                    className={cn(
                      "relative z-10 mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2",
                      isCompleted
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted bg-background text-muted-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p
                  className={cn(
                    "mt-2 text-sm",
                    isCurrent ? "font-medium" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
