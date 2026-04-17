import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { customFetchStandard } from "@/lib/queryclient/custom-fetch"
import { useInfiniteQueryPagination } from "@/lib/queryclient/use-infinite-query"
import { PaginationParams } from "@/lib/queryclient/response.type"
import { Resource } from "../common/resource.type"

// ===== Types =====

export type TOrderItem = {
  id: number
  order_id: string | null
  account_id: string
  seller_id: string
  address: string
  sku_id: string
  spu_id: string
  sku_name: string
  quantity: number
  unit_price: number
  paid_amount: number
  note: string | null
  serial_ids: string[]
  transport_option: string
  transport_cost_estimate: number
  payment_id: number | null
  date_created: string
  date_cancelled: string | null
  resources: Resource[]
}

export type TTransport = {
  id: string
  option: string
  status: string
  cost: number
  data: Record<string, any>
  date_created: string
}

export type TPayment = {
  id: string
  account_id: string
  option: string
  payment_method_id?: string
  status: string
  amount: number
  data: Record<string, any>
  date_created: string
  date_paid: string | null
  date_expired: string
}

export type TOrder = {
  id: string
  buyer_id: string
  seller_id: string
  transport: TTransport | null
  payment: TPayment | null
  address: string
  product_cost: number
  product_discount: number
  transport_cost: number
  total: number
  note: string | null
  data: Record<string, any>
  date_created: string
  items: TOrderItem[]
}

// ===== Hooks =====

export const useBuyerCheckout = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['checkout'],
    mutationFn: (params: {
      buy_now: boolean
      address: string
      payment_option: string
      use_wallet: boolean
      items: Array<{
        sku_id: string
        quantity: number
        transport_option: string
        note?: string
      }>
    }) => customFetchStandard<{
      items: TOrderItem[]
      payment: TPayment | null
      redirect_url: string | null
      wallet_deducted: number
      total: number
    }>(`order/buyer/checkout`, {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['account', 'cart'] })
      await qc.invalidateQueries({ queryKey: ['order', 'buyer', 'pending-items'] })
      await qc.invalidateQueries({ queryKey: ['account', 'wallet'] })
    },
  })
}

export const useListBuyerPendingItems = (params: PaginationParams) =>
  useInfiniteQueryPagination<TOrderItem>(
    ['order', 'buyer', 'pending-items'],
    'order/buyer/pending',
    params
  )

export const useCancelBuyerPending = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['order', 'buyer', 'pending-items', 'cancel'],
    mutationFn: (id: number) =>
      customFetchStandard<void>(`order/buyer/pending/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['order', 'buyer', 'pending-items'] })
    },
  })
}


export const useGetBuyerOrder = (id: string) =>
  useQuery({
    queryKey: ['order', id],
    queryFn: () => customFetchStandard<TOrder>(`order/buyer/confirmed/${id}`),
    enabled: !!id,
  })

export const useListBuyerConfirmed = (params: PaginationParams) =>
  useInfiniteQueryPagination<TOrder>(
    ['order', 'buyer', 'confirmed'],
    'order/buyer/confirmed',
    params
  )

export const useGetBuyerOverview = () => {
  const pending = useListBuyerPendingItems({ limit: 20 })
  const confirmed = useListBuyerConfirmed({ limit: 20 })
  return {
    pendingItems: pending.data?.pages.flatMap(p => p.data) ?? [],
    orders: confirmed.data?.pages.flatMap(p => p.data) ?? [],
    isLoading: pending.isLoading || confirmed.isLoading,
  }
}
