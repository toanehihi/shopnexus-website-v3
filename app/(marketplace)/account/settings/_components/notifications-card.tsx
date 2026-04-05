"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Bell } from "lucide-react"

interface NotificationsState {
  email: boolean
  push: boolean
  orders: boolean
  promotions: boolean
}

interface NotificationsCardProps {
  notifications: NotificationsState
  onNotificationsChange: (notifications: NotificationsState) => void
}

export function NotificationsCard({
  notifications,
  onNotificationsChange,
}: NotificationsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
        <CardDescription>
          Choose what notifications you want to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Email Notifications</p>
            <p className="text-sm text-muted-foreground">
              Receive notifications via email
            </p>
          </div>
          <Switch
            checked={notifications.email}
            onCheckedChange={(checked) =>
              onNotificationsChange({ ...notifications, email: checked })
            }
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Push Notifications</p>
            <p className="text-sm text-muted-foreground">
              Receive push notifications on your device
            </p>
          </div>
          <Switch
            checked={notifications.push}
            onCheckedChange={(checked) =>
              onNotificationsChange({ ...notifications, push: checked })
            }
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Order Updates</p>
            <p className="text-sm text-muted-foreground">
              Get notified about your order status
            </p>
          </div>
          <Switch
            checked={notifications.orders}
            onCheckedChange={(checked) =>
              onNotificationsChange({ ...notifications, orders: checked })
            }
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Promotions & Deals</p>
            <p className="text-sm text-muted-foreground">
              Receive updates about sales and special offers
            </p>
          </div>
          <Switch
            checked={notifications.promotions}
            onCheckedChange={(checked) =>
              onNotificationsChange({ ...notifications, promotions: checked })
            }
          />
        </div>
      </CardContent>
    </Card>
  )
}
