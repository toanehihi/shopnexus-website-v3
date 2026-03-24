import { useMutation, useQueryClient } from '@tanstack/react-query'
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
  date_created: string
  date_updated: string
  resources: Resource[]
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

export const useCreateComment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      ref_type: "ProductSpu" | "Comment"
      ref_id: string
      body: string
      score: number
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

