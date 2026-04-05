import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { customFetchStandard } from '@/lib/queryclient/custom-fetch'
import type { PaginationParams } from '@/lib/queryclient/response.type'
import { useInfiniteQueryPagination } from '@/lib/queryclient/use-infinite-query'
import { Resource } from '../common/resource.type'
import { AccountProfile } from '../account/account'

// ===== Types =====

export type TComment = {
  id: string
  profile: AccountProfile
  body: string
  upvote: number
  downvote: number
  score: number
  order_id: string | null
  date_created: string
  date_updated: string
  resources: Resource[]
  order_item_name?: string
  order_date?: string
  reply_count: number
}

export type TReviewableOrder = {
  id: string
  total: number
  date_created: string
}

// ===== Hooks =====

export const useListComments = (params: PaginationParams<{
  ref_type: "ProductSpu" | "Comment"
  ref_id: string
  id?: string[]
  account_id?: string[]
  score_from?: number
  score_to?: number
}>) =>
  useInfiniteQueryPagination<TComment>(
    ['comment', 'list'],
    'catalog/comment',
    params
  )

export const useListReviewableOrders = (spuId: string) =>
  useQuery({
    queryKey: ['comment', 'reviewable-orders', spuId],
    queryFn: () =>
      customFetchStandard<TReviewableOrder[]>(
        `catalog/comment/reviewable-orders?spu_id=${spuId}`,
      ),
    enabled: !!spuId,
  })

export const useCreateComment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      ref_type: "ProductSpu" | "Comment"
      ref_id: string
      body: string
      score: number
      order_id: string
      resource_ids: string[]
    }) =>
      customFetchStandard<TComment>('catalog/comment', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['comment', 'list'] })
    },
  })
}

export const useUpdateComment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      id: string
      body: string
      score: number
      resource_ids: string[]
      empty_resources?: boolean
    }) =>
      customFetchStandard<TComment>('catalog/comment', {
        method: 'PATCH',
        body: JSON.stringify(params),
      }),
    onSuccess: async (_, variables) => {
      await qc.invalidateQueries({ queryKey: ['comment', 'list'] })
      await qc.invalidateQueries({ queryKey: ['comment', 'detail', variables.id] })
    },
  })
}

export const useVoteComment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      comment_id: string
      vote: 'upvote' | 'downvote'
    }) =>
      customFetchStandard<TComment>('catalog/comment/vote', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['comment', 'list'] })
    },
  })
}

export const useDeleteComment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { ids: string[] }) =>
      customFetchStandard<{ message: string }>('catalog/comment', {
        method: 'DELETE',
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['comment', 'list'] })
    },
  })
}

