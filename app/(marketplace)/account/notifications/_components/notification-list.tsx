"use client"

import { useRouter } from "next/navigation"
import {
  useMarkRead,
  Notification,
  NotificationType,
  getNotificationHref,
} from "@/core/account/notification"
import { formatTimeAgo } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  Bell,
  Package,
  RotateCcw,
  CreditCard,
  Star,
  UserPlus,
  ShoppingCart,
  XCircle,
  Loader2,
  ExternalLink,
} from "lucide-react"

const typeIcons: Record<NotificationType, typeof Bell> = {
  // Order -- buyer
  order_cancelled: XCircle,
  items_confirmed: Package,
  items_rejected: XCircle,
  payment_success: CreditCard,
  payment_failed: CreditCard,
  refund_approved: RotateCcw,
  // Order -- seller
  new_pending_items: ShoppingCart,
  pending_item_cancelled: XCircle,
  refund_requested: RotateCcw,
  refund_cancelled: RotateCcw,
  // Catalog
  new_review: Star,
  // Account
  welcome: UserPlus,
  payment_method_added: CreditCard,
  payment_method_deleted: CreditCard,
}

function getNotificationIcon(type: string) {
  return typeIcons[type as NotificationType] ?? Bell
}

export function NotificationList({
  notifications,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  notifications: Notification[]
  isLoading?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
}) {
  const router = useRouter()
  const markRead = useMarkRead()

  const handleClick = (notification: Notification) => {
    if (!notification.is_read) {
      markRead.mutate({ ids: [notification.id] })
    }
    const href = getNotificationHref(notification)
    if (href) {
      router.push(href)
    }
  }

  const handleRedirect = (e: React.MouseEvent, url: string) => {
    e.stopPropagation()
    window.open(url, "_blank")
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <Bell className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
        <p className="text-muted-foreground">
          When you receive notifications, they will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => {
        const Icon = getNotificationIcon(notification.type)
        const href = getNotificationHref(notification)
        const redirectUrl = notification.metadata?.redirect_url

        return (
          <Card
            key={notification.id}
            className={cn(
              "transition-colors hover:bg-muted/50",
              href && "cursor-pointer",
              !notification.is_read && "border-primary/30 bg-primary/5"
            )}
            onClick={() => handleClick(notification)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0",
                    !notification.is_read
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        "text-sm",
                        !notification.is_read ? "font-semibold" : "font-medium"
                      )}
                    >
                      {notification.title}
                    </p>
                    {!notification.is_read && (
                      <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {notification.content}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(notification.date_created)}
                    </p>
                    {redirectUrl && notification.type === "payment_failed" && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={(e) => handleRedirect(e, redirectUrl)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Retry Payment
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
