import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { customFetchStandard } from "@/lib/queryclient/custom-fetch"
import { useInfiniteQueryPagination } from "@/lib/queryclient/use-infinite-query"
import { PaginationParams } from "@/lib/queryclient/response.type"
import { Status } from "../common/status.type"

// ===== Types =====

export type TRefundDispute = {
  id: string
  account_id: string
  refund_id: string
  reason: string
  note: string
  status: Status
  date_created: string
  resolved_by_id: string | null
  date_resolved: string | null
}

// ===== Hooks =====

export const useCreateRefundDispute = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { refund_id: string; reason: string; note: string }) =>
      customFetchStandard<TRefundDispute>(
        `order/refunds/${params.refund_id}/disputes`,
        { method: "POST", body: JSON.stringify({ reason: params.reason, note: params.note }) }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disputes"] })
    },
  })
}

export const useListRefundDisputes = (params?: PaginationParams) =>
  useInfiniteQueryPagination<TRefundDispute>(
    ["disputes", params],
    "order/disputes",
    params ?? { limit: 20 },
  )

export const useListRefundDisputesByRefund = (
  refundId: string,
  params?: PaginationParams
) =>
  useInfiniteQueryPagination<TRefundDispute>(
    ["disputes", "refund", refundId, params],
    `order/refunds/${refundId}/disputes`,
    params ?? { limit: 20 },
  )

export const useGetRefundDispute = (disputeId: string) =>
  useQuery({
    queryKey: ["disputes", disputeId],
    queryFn: () =>
      customFetchStandard<TRefundDispute>(`order/disputes/${disputeId}`),
    enabled: !!disputeId,
  })
