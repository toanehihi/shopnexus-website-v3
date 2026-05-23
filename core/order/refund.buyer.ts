import { useMutation, useQueryClient } from "@tanstack/react-query"
import { customFetchStandard } from "@/lib/queryclient/custom-fetch"
import { useInfiniteQueryPagination } from "@/lib/queryclient/use-infinite-query"
import { PaginationParams } from "@/lib/queryclient/response.type"

// ===== Types =====

export enum RefundMethod {
  PickUp = "PickUp",
  DropOff = "DropOff",
}

export type RefundStatus = "Pending" | "Processing" | "Success" | "Failed"

export type TRefund = {
  id: string
  account_id: string
  order_item_id: number
  transport_id: number
  method: RefundMethod
  reason: string
  address: string | null
  date_created: string
  status: RefundStatus
  accepted_by_id: string | null
  date_accepted: string | null
  rejection_note: string | null
  approved_by_id: string | null
  date_approved: string | null
  refund_tx_id: number | null
}

// ===== Hooks =====

export const useCreateRefund = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      order_item_id: number
      method: RefundMethod
      reason: string
      address?: string | null
      return_transport_option: string
    }) =>
      customFetchStandard<TRefund>(`order/buyer/refund`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["order", "refund"] })
    },
  })
}

export const useListRefunds = (
  params: PaginationParams<{ status?: string }>,
) =>
  useInfiniteQueryPagination<TRefund>(
    ["order", "refund", "list"],
    "order/buyer/refund",
    params,
  )
