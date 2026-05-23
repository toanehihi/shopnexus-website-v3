import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { customFetchStandard } from "@/lib/queryclient/custom-fetch"
import { useInfiniteQueryPagination } from "@/lib/queryclient/use-infinite-query"
import { PaginationParams } from "@/lib/queryclient/response.type"

// ===== Types =====
// Field names match Go's encoding/json serialization (explicit snake_case json tags).

// Mirror of biz.SessionKind* — DB column is plain TEXT; this is the source of truth on FE.
export const SessionKind = {
  BuyerCheckout: "buyer-checkout",
  SellerConfirmationFee: "seller-confirmation-fee",
  SellerPayout: "seller-payout",
} as const
export type TSessionKind = (typeof SessionKind)[keyof typeof SessionKind]

export type TPaymentSession = {
  id: number
  kind: TSessionKind | string
  status: string
  from_id: string | null
  to_id: string | null
  note: string
  currency: string
  total_amount: number
  data: Record<string, unknown>

  date_created: string
  date_paid: string | null
  date_expired: string
}

// Append-only ledger leg. One row per rail movement within a payment session.
// Reversals are NEW rows (negative amount + reverses_id pointing to the original).
export type TTransaction = {
  id: number
  session_id: number
  status: string
  note: string
  error: string | null
  payment_option: string | null
  wallet_id: string | null
  data: Record<string, unknown>

  amount: number
  from_currency: string
  to_currency: string
  exchange_rate: string // decimal.Decimal serialized as string

  reverses_id: number | null

  date_created: string
  date_settled: string | null
  date_expired: string | null // gateway URL expiry; null for internal wallet rails
}

export type TTransport = {
  id: number
  option: string
  status: string | null
  data: unknown
  date_created: string
}

export type TOrderItem = {
  id: number
  order_id: string | null
  account_id: string
  seller_id: string
  sku_id: string
  spu_id: string
  sku_name: string
  address: string
  note: string | null
  serial_ids: unknown

  quantity: number
  transport_option: string
  subtotal_amount: number
  total_amount: number
  payment_session_id: number

  date_created: string
  date_cancelled: string | null
  cancelled_by_id: string | null

  // Hydrated from catalog by enrichItems on the server side.
  slug: string
  image_url: string

  // Derived (optional loaded on buyer pending list):
  payment_session?: TPaymentSession | null
}

export type TOrder = {
  id: string
  buyer_id: string
  seller_id: string
  transport_id: number
  address: string
  date_created: string

  confirmed_by_id: string
  confirm_session_id: number
  note: string | null

  // Derived (optional loaded):
  total_amount: number
  items: TOrderItem[]
  transport: TTransport | null
  confirm_session: TPaymentSession | null
  payout_session: TPaymentSession | null
}

// BuyerCheckoutResult — sync envelope from POST /order/buyer/checkout. The
// workflow runs async; this response only carries the workflow ID + the
// gateway redirect URL (empty for wallet-only checkouts).
export type TBuyerCheckoutResult = {
  checkout_session_id: string
  payment_url: string
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

// EnsurePaymentURL — multi-attempt entry point. Returns the latest reusable
// gateway URL when the current attempt is alive, otherwise BE signals the
// workflow to mint the next attempt. 410 if the session is already terminal.
export type TEnsurePaymentURLResult = { payment_url: string }

export const useEnsureBuyerPaymentURL = () => {
  return useMutation({
    mutationKey: ['order', 'buyer', 'checkout', 'payment-url'],
    mutationFn: (sessionID: string) =>
      customFetchStandard<TEnsurePaymentURLResult>(
        `order/buyer/checkout/${sessionID}/payment-url`,
        { method: 'POST' },
      ),
  })
}

// QuoteTransport — preview per-item shipping cost without reserving stock.
// Mirrors the per-item quote loop the workflow runs at checkout, so the cart
// summary shows the same number the buyer will be charged.
export type TQuoteTransportItem = {
  sku_id: string
  transport_option: string
  cost: number
  currency: string
}

export type TQuoteTransportResult = {
  items: TQuoteTransportItem[]
}

export type TQuoteTransportParams = {
  address: string
  items: Array<{
    sku_id: string
    quantity: number
    transport_option: string
    note?: string
  }>
}

export const useQuoteBuyerTransport = (
  params: TQuoteTransportParams | null,
) => {
  return useQuery({
    queryKey: ['order', 'buyer', 'quote-transport', params],
    queryFn: () =>
      customFetchStandard<TQuoteTransportResult>('order/buyer/quote-transport', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    enabled: !!params && params.items.length > 0 && !!params.address,
    staleTime: 30_000,
    retry: false,
  })
}

export const useListBuyerPendingItems = (params: PaginationParams) =>
  useInfiniteQueryPagination<TOrderItem>(
    ['order', 'buyer', 'pending-items'],
    'order/buyer/pending-items',
    params,
  )

export const useCancelBuyerPending = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['order', 'buyer', 'pending-items', 'cancel'],
    mutationFn: (id: number) =>
      customFetchStandard<void>(`order/buyer/pending-items/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['order', 'buyer', 'pending-items'] }),
        qc.invalidateQueries({ queryKey: ['order', 'buyer', 'cancelled-items'] }),
        qc.invalidateQueries({ queryKey: ['order', 'buyer', 'pending-orders'] }),
        qc.invalidateQueries({ queryKey: ['order', 'buyer', 'cancelled-orders'] }),
      ])
    },
  })
}


export const useGetBuyerOrder = (id: string) =>
  useQuery({
    queryKey: ['order', id],
    queryFn: () => customFetchStandard<TOrder>(`order/buyer/orders/${id}`),
    enabled: !!id,
  })

export type TCheckoutSummaryItem = {
  id: number
  sku_id: string
  spu_id: string
  slug: string
  sku_name: string
  quantity: number
  total_amount: number
  currency: string
  image_url: string
}

export type TCheckoutSummary = {
  session: TPaymentSession
  items: TCheckoutSummaryItem[]
}

export const useGetCheckoutSummary = (txID: string | null) =>
  useQuery({
    queryKey: ['order', 'buyer', 'checkout-summary', txID],
    queryFn: () =>
      customFetchStandard<TCheckoutSummary>(
        `order/buyer/checkout-summary/${txID}`,
      ),
    enabled: !!txID,
  })

export const useListBuyerPendingOrders = (params: PaginationParams) =>
  useInfiniteQueryPagination<TOrder>(
    ['order', 'buyer', 'pending-orders'],
    'order/buyer/pending-orders',
    params,
  )

export const useListBuyerCompletedOrders = (params: PaginationParams) =>
  useInfiniteQueryPagination<TOrder>(
    ['order', 'buyer', 'completed-orders'],
    'order/buyer/completed-orders',
    params,
  )

export const useListBuyerCancelledOrders = (params: PaginationParams) =>
  useInfiniteQueryPagination<TOrder>(
    ['order', 'buyer', 'cancelled-orders'],
    'order/buyer/cancelled-orders',
    params,
  )

export const useListBuyerCancelledItems = (params: PaginationParams) =>
  useInfiniteQueryPagination<TOrderItem>(
    ['order', 'buyer', 'cancelled-items'],
    'order/buyer/cancelled-items',
    params,
  )
