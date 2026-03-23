import { useMutation, useQuery } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/queryclient/query-client'
import { customFetchPagination, customFetchStandard } from '@/lib/queryclient/custom-fetch'
import qs from 'qs'
import { SuccessPaginationRes } from '@/lib/queryclient/response.type'

// ===== Types =====

export type AccountFavorite = {
  id: number
  account_id: string // UUID
  spu_id: string // UUID
  date_created: string
}

// ===== Hooks =====

export const useListFavorites = (params: { page?: number; limit: number }) =>
  useQuery({
    queryKey: ['account', 'favorite', params],
    queryFn: async () =>
      customFetchPagination<AccountFavorite>(
        `account/favorite?${qs.stringify(params)}`
      ),
  })

export const useAddFavorite = () =>
  useMutation({
    mutationFn: async (spuId: string) =>
      customFetchStandard<AccountFavorite>(`account/favorite/${spuId}`, {
        method: 'POST',
      }),
    onSuccess: async () => {
      const queryClient = getQueryClient()
      await queryClient.invalidateQueries({ queryKey: ['account', 'favorite'] })
    },
  })

export const useRemoveFavorite = () =>
  useMutation({
    mutationFn: async (spuId: string) =>
      customFetchStandard<{ message: string }>(`account/favorite/${spuId}`, {
        method: 'DELETE',
      }),
    onSuccess: async () => {
      const queryClient = getQueryClient()
      await queryClient.invalidateQueries({ queryKey: ['account', 'favorite'] })
    },
  })
