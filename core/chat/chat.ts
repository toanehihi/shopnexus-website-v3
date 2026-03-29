import { useMutation } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/queryclient/query-client'
import { customFetchStandard } from '@/lib/queryclient/custom-fetch'
import { useInfiniteQueryPagination } from '@/lib/queryclient/use-infinite-query'
import { PaginationParams } from '@/lib/queryclient/response.type'

// ===== Types =====

export type Conversation = {
  id: string
  buyer_id: string
  seller_id: string
  last_message_at: string | null
  date_created: string
}

export type ChatMessage = {
  id: number
  conversation_id: string
  sender_id: string
  type: 'Text' | 'Image' | 'System'
  content: string
  status: 'Sent' | 'Delivered' | 'Read'
  metadata: Record<string, any> | null
  date_created: string
}

// ===== Hooks =====

export const useCreateConversation = () =>
  useMutation({
    mutationFn: async (params: { vendor_id: string }) =>
      customFetchStandard<Conversation>('chat/conversation', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      const queryClient = getQueryClient()
      await queryClient.invalidateQueries({ queryKey: ['chat', 'conversation'] })
    },
  })

export const useListConversations = (
  params: PaginationParams,
  options?: {
    enabled?: boolean
    staleTime?: number
    gcTime?: number
    refetchOnWindowFocus?: boolean
    refetchOnMount?: boolean
    refetchOnReconnect?: boolean
    retry?: number | boolean
    retryDelay?: number | ((attemptIndex: number) => number)
  }
) =>
  useInfiniteQueryPagination<Conversation>(
    ['chat', 'conversation'],
    'chat/conversation',
    params,
    options
  )

export const useListMessages = (
  conversationId: string,
  params: PaginationParams,
  options?: {
    enabled?: boolean
    staleTime?: number
    gcTime?: number
    refetchOnWindowFocus?: boolean
    refetchOnMount?: boolean
    refetchOnReconnect?: boolean
    retry?: number | boolean
    retryDelay?: number | ((attemptIndex: number) => number)
  }
) =>
  useInfiniteQueryPagination<ChatMessage>(
    ['chat', 'conversation', conversationId, 'messages'],
    `chat/conversation/${conversationId}/messages`,
    params,
    {
      enabled: !!conversationId,
      ...options,
    }
  )
