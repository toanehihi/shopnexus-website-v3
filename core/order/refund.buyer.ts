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

export const useCreateRefund = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      order_id: string
      method: string
      reason: string
      address: string | null
      resource_ids: string[]
    }) =>
      customFetchStandard<TRefund>(`order/buyer/refund`, {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['order', 'refund'] })
    },
  })
}

export const useListRefunds = (params: PaginationParams<{
  status?: string
}>) =>
  useInfiniteQueryPagination<TRefund>(
    ['order', 'refund', 'list'],
    'order/buyer/refund',
    params
  )

export const useUpdateRefund = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      id: string
      method?: string
      address?: string | null
      reason?: string | null
      resource_ids: string[]
    }) =>
      customFetchStandard<TRefund>(`order/buyer/refund`, {
        method: 'PATCH',
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['order', 'refund'] })
    },
  })
}

export const useCancelRefund = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: string }) =>
      customFetchStandard<void>(`order/buyer/refund`, {
        method: 'DELETE',
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['order', 'refund'] })
    },
  })
}
