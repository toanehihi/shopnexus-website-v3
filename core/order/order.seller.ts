import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { customFetchStandard } from "@/lib/queryclient/custom-fetch"
import { useInfiniteQueryPagination } from "@/lib/queryclient/use-infinite-query"
import { PaginationParams } from "@/lib/queryclient/response.type"
import { TOrder, TOrderItem } from "./order.buyer"

// ConfirmSellerPendingResult — sync envelope from POST /order/seller/pending/confirm.
// The workflow runs async; this response carries the workflow ID + the gateway
// redirect URL (empty for wallet-only confirms).
export type TConfirmSellerPendingResult = {
  confirm_session_id: string
  payment_url: string
}

// ===== Hooks =====

export const useListSellerPendingItems = (params: PaginationParams) =>
  useInfiniteQueryPagination<TOrderItem>(
    ['order', 'seller', 'pending-items'],
    'order/seller/pending',
    params
  )

export const useConfirmSellerPending = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['order', 'seller', 'pending-items', 'confirm'],
    mutationFn: (params: {
      item_ids: number[]
      use_wallet: boolean
      payment_option: string
      wallet_id?: string
      note?: string
    }) =>
      customFetchStandard<TConfirmSellerPendingResult>(`order/seller/pending/confirm`, {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['order', 'seller', 'pending-items'] })
      await qc.invalidateQueries({ queryKey: ['order', 'seller', 'confirmed'] })
    },
  })
}

export const useRejectSellerPending = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['order', 'seller', 'pending-items', 'reject'],
    mutationFn: (params: {
      item_ids: number[]
    }) =>
      customFetchStandard<void>(`order/seller/pending/reject`, {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['order', 'seller', 'pending-items'] })
    },
  })
}

export const useListSellerConfirmed = (params: PaginationParams) =>
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

export const useGetSellerOverview = () => {
  const pending = useListSellerPendingItems({ limit: 20 })
  const confirmed = useListSellerConfirmed({ limit: 20 })
  return {
    incomingItems: pending.data?.pages.flatMap(p => p.data) ?? [],
    orders: confirmed.data?.pages.flatMap(p => p.data) ?? [],
    isLoading: pending.isLoading || confirmed.isLoading,
  }
}
