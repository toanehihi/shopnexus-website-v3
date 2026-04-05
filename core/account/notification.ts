import { useMutation, useQuery } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/queryclient/query-client'
import { customFetchStandard } from '@/lib/queryclient/custom-fetch'
import { useIsAuthenticated } from '@/core/account/auth'
import { useInfiniteQueryPagination } from '@/lib/queryclient/use-infinite-query'
import { PaginationParams } from '@/lib/queryclient/response.type'

// ===== Types =====

export type NotificationType =
  // Order — buyer
  | 'order_cancelled'
  | 'items_confirmed'
  | 'items_rejected'
  | 'payment_success'
  | 'payment_failed'
  | 'refund_approved'
  // Order — seller
  | 'new_pending_items'
  | 'pending_item_cancelled'
  | 'refund_requested'
  | 'refund_cancelled'
  // Catalog — seller
  | 'new_review'
  // Account
  | 'welcome'
  | 'payment_method_added'
  | 'payment_method_deleted'

export type NotificationMetadata = {
  order_id?: string
  refund_id?: string
  redirect_url?: string
  [key: string]: any
}

export type Notification = {
  id: number
  account_id: string
  type: NotificationType
  channel: string
  title: string
  content: string
  is_read: boolean
  metadata: NotificationMetadata | null
  date_created: string
  date_updated: string
  date_sent: string | null
  date_scheduled: string | null
}

/** Returns the in-app route for a notification, or null if not navigable. */
export function getNotificationHref(n: Notification): string | null {
  const m = n.metadata
  switch (n.type) {
    case 'order_cancelled':
    case 'items_confirmed':
    case 'payment_success':
    case 'payment_failed':
      return m?.order_id ? `/account/orders/${m.order_id}` : '/account/orders'
    case 'items_rejected':
    case 'new_pending_items':
    case 'pending_item_cancelled':
      return '/seller/orders'
    case 'refund_requested':
    case 'refund_cancelled':
    case 'refund_approved':
      return m?.order_id ? `/account/orders/${m.order_id}` : '/account/orders'
    case 'new_review':
      return '/seller/orders'
    case 'payment_method_added':
    case 'payment_method_deleted':
      return '/account/settings'
    default:
      return null
  }
}

// ===== Hooks =====

export const useListNotifications = (params: PaginationParams<unknown>) =>
  useInfiniteQueryPagination<Notification>(
    ['notification', 'list'],
    'account/notification',
    params
  )

export const useUnreadCount = () => {
  const isAuthenticated = useIsAuthenticated()
  return useQuery({
    queryKey: ['notification', 'unread'],
    queryFn: async () => customFetchStandard<{ count: number }>('account/notification/unread-count'),
    enabled: isAuthenticated,
    // No polling — SSE pushes invalidation via useEventStream
  })
}

export const useMarkRead = () =>
  useMutation({
    mutationFn: async (params: { ids: number[] }) =>
      customFetchStandard<{ message: string }>('account/notification/read', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      const queryClient = getQueryClient()
      await queryClient.invalidateQueries({ queryKey: ['notification'] })
    },
  })

export const useMarkAllRead = () =>
  useMutation({
    mutationFn: async () =>
      customFetchStandard<{ message: string }>('account/notification/read-all', {
        method: 'POST',
      }),
    onSuccess: async () => {
      const queryClient = getQueryClient()
      await queryClient.invalidateQueries({ queryKey: ['notification'] })
    },
  })
