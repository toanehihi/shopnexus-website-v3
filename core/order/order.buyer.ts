import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { customFetchStandard } from "@/lib/queryclient/custom-fetch"
import { useInfiniteQueryPagination } from "@/lib/queryclient/use-infinite-query"
import { PaginationParams } from "@/lib/queryclient/response.type"

// ===== Types =====
// Field names match Go's encoding/json serialization of model structs (no json tags = PascalCase).

export type TTransaction = {
  ID: number
  FromID: string | null
  ToID: string | null
  Type: string
  Status: string
  Note: string
  PaymentOption: string | null
  WalletID: string | null
  Data: unknown

  Amount: number
  FromCurrency: string
  ToCurrency: string
  ExchangeRate: string // decimal.Decimal serialized as string

  DateCreated: string
  DatePaid: string | null
  DateExpired: string
}

export type TTransport = {
  ID: number
  Option: string
  Status: string | null
  Data: unknown
  DateCreated: string
}

export type TOrderItem = {
  ID: number
  OrderID: string | null
  AccountID: string
  SellerID: string
  SkuID: string
  SkuName: string
  Address: string
  Note: string | null
  SerialIDs: unknown

  Quantity: number
  TransportOption: string
  SubtotalAmount: number
  PaidAmount: number
  PaymentTxID: number

  DateCreated: string
  DateCancelled: string | null
  CancelledByID: string | null
  RefundTxID: number | null
}

export type TOrder = {
  ID: string
  BuyerID: string
  SellerID: string
  TransportID: number
  Address: string
  DateCreated: string

  ConfirmedByID: string
  SellerTxID: number
  Note: string | null

  // Derived (optional loaded):
  TotalAmount: number
  Items: TOrderItem[]
  Transport: TTransport | null
  ConfirmFeeTx: TTransaction | null
  PayoutTx: TTransaction | null
}

// BuyerCheckoutResult — field names from interface.go json tags (snake_case)
export type TBuyerCheckoutResult = {
  items: TOrderItem[]
  checkout_tx_ids: number[]
  blocker_tx_id: number
  requires_gateway_payment: boolean
  gateway_url: string | null
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
    }) => customFetchStandard<TBuyerCheckoutResult>(`order/buyer/checkout`, {
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
