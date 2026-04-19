import { useMutation, useQueryClient } from "@tanstack/react-query"
import { customFetchStandard } from "@/lib/queryclient/custom-fetch"
import { useInfiniteQueryPagination } from "@/lib/queryclient/use-infinite-query"
import { PaginationParams } from "@/lib/queryclient/response.type"
import { Status } from "../common/status.type"
import { Resource } from "../common/resource.type"

// ===== Types =====

export enum RefundMethod {
  PickUp = "PickUp",
  DropOff = "DropOff",
}

export type TRefund = {
  id: string
  account_id: string
  order_id: string
  confirmed_by_id: string | null
  transport_id: string | null
  method: RefundMethod
  status: Status
  reason: string
  address: string | null
  date_created: string
  resources: Resource[]
}

// ===== Hooks =====

export const useListRefundsSeller = (params: PaginationParams<{
  status?: string
}>) =>
  useInfiniteQueryPagination<TRefund>(
    ['order', 'refund', 'list', 'seller'],
    'order/seller/refund',
    params
  )

export const useConfirmRefundSeller = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: string }) =>
      customFetchStandard<TRefund>(`order/seller/refund/confirm`, {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['order', 'refund'] })
    },
  })
}
