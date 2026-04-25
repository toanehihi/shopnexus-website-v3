import { useMutation, useQueryClient } from "@tanstack/react-query"
import { customFetchStandard } from "@/lib/queryclient/custom-fetch"
import { useInfiniteQueryPagination } from "@/lib/queryclient/use-infinite-query"
import { PaginationParams } from "@/lib/queryclient/response.type"
import { TRefund } from "./refund.buyer"

export const useListRefundsSeller = (
  params: PaginationParams<{ status?: string }>,
) =>
  useInfiniteQueryPagination<TRefund>(
    ["order", "refund", "list", "seller"],
    "order/seller/refund",
    params,
  )

export const useAcceptRefundStage1 = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: string }) =>
      customFetchStandard<TRefund>(`order/refunds/${params.id}/accept`, {
        method: "POST",
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["order", "refund"] })
    },
  })
}

export const useApproveRefundStage2 = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: string }) =>
      customFetchStandard<TRefund>(`order/refunds/${params.id}/approve`, {
        method: "POST",
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["order", "refund"] })
    },
  })
}

export const useRejectRefund = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      id: string
      stage: 1 | 2
      rejection_note: string
    }) =>
      customFetchStandard<TRefund>(`order/refunds/${params.id}/reject`, {
        method: "POST",
        body: JSON.stringify({
          stage: params.stage,
          rejection_note: params.rejection_note,
        }),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["order", "refund"] })
    },
  })
}
