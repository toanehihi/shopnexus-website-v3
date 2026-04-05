"use client"

import { useMemo } from "react"
import {
  useListNotifications,
  useUnreadCount,
  useMarkAllRead,
} from "@/core/account/notification"
import { Button } from "@/components/ui/button"
import { CheckCheck } from "lucide-react"
import { NotificationList } from "./_components/notification-list"

export default function NotificationsPage() {
  const {
    data: notificationsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListNotifications({ limit: 20 })

  const { data: unreadData } = useUnreadCount()
  const markAllRead = useMarkAllRead()

  const notifications = useMemo(() => {
    return notificationsData?.pages.flatMap((page) => page.data) ?? []
  }, [notificationsData])

  const unreadCount = unreadData?.count ?? 0

  const handleMarkAllRead = () => {
    markAllRead.mutate()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated on your orders and messages
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      <NotificationList
        notifications={notifications}
        isLoading={isLoading}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={() => fetchNextPage()}
      />
    </div>
  )
}
