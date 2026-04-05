import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { customFetchStandard } from "@/lib/queryclient/custom-fetch"
import { useInfiniteQueryPagination } from "@/lib/queryclient/use-infinite-query"
import { PaginationParams } from "@/lib/queryclient/response.type"
import { TOrder, TOrderItem } from "./order.buyer"

// ===== Hooks =====

export const useListSellerPending = (params: PaginationParams<{
  search?: string
}>) =>
  useInfiniteQueryPagination<TOrderItem>(
    ['order', 'seller', 'pending'],
    'order/seller/pending',
    params
  )

export type TQuoteTransportResult = {
  product_cost: number
  product_discount: number
  transport_cost: number
  total: number
}

export const useQuoteTransport = () => {
  return useMutation({
    mutationKey: ['order', 'seller', 'pending', 'quote'],
    mutationFn: (params: {
      item_ids: number[]
      transport_option: string
    }) =>
      customFetchStandard<TQuoteTransportResult>(`order/seller/pending/quote`, {
        method: 'POST',
        body: JSON.stringify(params),
      }),
  })
}

export const useConfirmSellerPending = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['order', 'seller', 'pending', 'confirm'],
    mutationFn: (params: {
      item_ids: number[]
      transport_option: string
      note?: string
    }) =>
      customFetchStandard<TOrder>(`order/seller/pending/confirm`, {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['order', 'seller', 'pending'] })
      await qc.invalidateQueries({ queryKey: ['order', 'seller', 'confirmed'] })
    },
  })
}

export const useRejectSellerPending = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['order', 'seller', 'pending', 'reject'],
    mutationFn: (params: {
      item_ids: number[]
    }) =>
      customFetchStandard<void>(`order/seller/pending/reject`, {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['order', 'seller', 'pending'] })
    },
  })
}

export const useListSellerConfirmed = (params: PaginationParams<{
  search?: string
  payment_status?: string[]
}>) =>
  useInfiniteQueryPagination<TOrder>(
    ['order', 'seller', 'confirmed'],
    'order/seller/confirmed',
    params
  )

export const useGetSellerOrder = (id: string) =>
  useQuery({
    queryKey: ['order', 'seller', 'confirmed', id],
    queryFn: () => customFetchStandard<TOrder>(`order/seller/confirmed/${id}`),
    enabled: !!id,
  })

export const useGetSellerOverview = (params?: { search?: string }) => {
  const pending = useListSellerPending({ limit: 20, ...params })
  const confirmed = useListSellerConfirmed({ limit: 20, ...params })
  return {
    incomingItems: pending.data?.pages.flatMap(p => p.data) ?? [],
    orders: confirmed.data?.pages.flatMap(p => p.data) ?? [],
    isLoading: pending.isLoading || confirmed.isLoading,
  }
}
