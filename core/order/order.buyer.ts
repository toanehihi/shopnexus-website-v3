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

export const useCheckout = () => {
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
    }>(`order/checkout`, {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['account', 'cart'] })
      await qc.invalidateQueries({ queryKey: ['order', 'checkout', 'items'] })
    },
  })
}

export const useListPendingItems = (params: PaginationParams<{
  status?: string[]
}>) =>
  useInfiniteQueryPagination<TOrderItem>(
    ['order', 'checkout', 'items'],
    'order/checkout/items',
    params
  )

export const useCancelPendingItem = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['order', 'checkout', 'items', 'cancel'],
    mutationFn: (id: number) =>
      customFetchStandard<void>(`order/checkout/items/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['order', 'checkout', 'items'] })
    },
  })
}

export const usePayOrders = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['order', 'pay'],
    mutationFn: (params: {
      order_ids: string[]
      payment_option: string
    }) => customFetchStandard<{
      payment: TPayment
      redirect_url?: string
    }>(`order/pay`, {
      method: 'POST',
      body: JSON.stringify(params),
    }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['order'] })
    },
  })
}

export const useGetOrder = (id: string) =>
  useQuery({
    queryKey: ['order', id],
    queryFn: () => customFetchStandard<TOrder>(`order/${id}`),
    enabled: !!id,
  })

export const useListOrders = (params: PaginationParams<unknown>) =>
  useInfiniteQueryPagination<TOrder>(
    ['order', 'list'],
    'order',
    params
  )
