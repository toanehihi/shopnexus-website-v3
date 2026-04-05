"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface AccountStatusCardProps {
  status?: string | null
}

export function AccountStatusCard({ status }: AccountStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Status</CardTitle>
        <CardDescription>Your account status and type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
          </div>
          <div>
            <Label className="text-muted-foreground">Status</Label>
            <p className="text-sm font-medium mt-1">
              <span className="inline-flex items-center gap-1 text-green-600">
                <span className="h-2 w-2 rounded-full bg-green-600" />
                {status || "Active"}
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
