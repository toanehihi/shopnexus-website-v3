import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { customFetchStandard } from "@/lib/queryclient/custom-fetch"
import { useInfiniteQueryPagination } from "@/lib/queryclient/use-infinite-query"
import { PaginationParams } from "@/lib/queryclient/response.type"
import { Resource } from "../common/resource.type"

// ===== Types =====

export type OrderItemStatus = 'Pending' | 'Confirmed' | 'Canceled'

export type TOrderItem = {
  id: number
  order_id: string | null
  account_id: string
  seller_id: string
  address: string
  status: OrderItemStatus
  sku_id: string
  spu_id: string
  sku_name: string
  quantity: number
  unit_price: number
  paid_amount: number
  note: string | null
  serial_ids: string[]
  date_created: string
  resources: Resource[]
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
  transport_id: string | null
  payment: TPayment | null
  status: string
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
      items: Array<{
        sku_id: string
        quantity: number
        address: string
        note?: string
      }>
    }) => customFetchStandard<{
      items: TOrderItem[]
    }>(`order/buyer/checkout`, {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['account', 'cart'] })
      await qc.invalidateQueries({ queryKey: ['order', 'buyer', 'pending'] })
    },
  })
}

export const useListBuyerPending = (params: PaginationParams<{
  status?: string[]
}>) =>
  useInfiniteQueryPagination<TOrderItem>(
    ['order', 'buyer', 'pending'],
    'order/buyer/pending',
    params
  )

export const useCancelBuyerPending = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['order', 'buyer', 'pending', 'cancel'],
    mutationFn: (id: number) =>
      customFetchStandard<void>(`order/buyer/pending/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['order', 'buyer', 'pending'] })
    },
  })
}

export const usePayBuyerOrders = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['order', 'pay'],
    mutationFn: (params: {
      order_ids: string[]
      payment_option: string
    }) => customFetchStandard<{
      payment: TPayment
      redirect_url?: string
    }>(`order/buyer/pay`, {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['order', 'buyer', 'confirmed'] })
    },
  })
}

export const useGetBuyerOrder = (id: string) =>
  useQuery({
    queryKey: ['order', id],
    queryFn: () => customFetchStandard<TOrder>(`order/buyer/confirmed/${id}`),
    enabled: !!id,
  })

export const useListBuyerConfirmed = (params: PaginationParams<unknown>) =>
  useInfiniteQueryPagination<TOrder>(
    ['order', 'buyer', 'confirmed'],
    'order/buyer/confirmed',
    params
  )
