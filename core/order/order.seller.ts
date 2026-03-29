import { useMutation, useQueryClient } from "@tanstack/react-query"
import { customFetchStandard } from "@/lib/queryclient/custom-fetch"
import { useInfiniteQueryPagination } from "@/lib/queryclient/use-infinite-query"
import { PaginationParams } from "@/lib/queryclient/response.type"
import { TOrder, TOrderItem } from "./order.buyer"

// ===== Hooks =====

export const useListIncomingItems = (params: PaginationParams<{
  search?: string
}>) =>
  useInfiniteQueryPagination<TOrderItem>(
    ['order', 'incoming'],
    'order/incoming',
    params
  )

export const useConfirmItems = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['order', 'incoming', 'confirm'],
    mutationFn: (params: {
      item_ids: number[]
      transport_option: string
      note?: string
    }) =>
      customFetchStandard<TOrder>(`order/incoming/confirm`, {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['order', 'incoming'] })
      await qc.invalidateQueries({ queryKey: ['order', 'seller'] })
    },
  })
}

export const useRejectItems = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['order', 'incoming', 'reject'],
    mutationFn: (params: {
      item_ids: number[]
    }) =>
      customFetchStandard<void>(`order/incoming/reject`, {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['order', 'incoming'] })
    },
  })
}

export const useListSellerOrders = (params: PaginationParams<{
  search?: string
  payment_status?: string[]
  order_status?: string[]
}>) =>
  useInfiniteQueryPagination<TOrder>(
    ['order', 'seller'],
    'order/seller',
    params
  )
