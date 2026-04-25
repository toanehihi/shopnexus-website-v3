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
  ID: string
  AccountID: string
  OrderItemID: number
  TransportID: number
  Method: RefundMethod
  Reason: string
  Address: string | null
  DateCreated: string
  Status: RefundStatus
  AcceptedByID: string | null
  DateAccepted: string | null
  RejectionNote: string | null
  ApprovedByID: string | null
  DateApproved: string | null
  RefundTxID: number | null
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
