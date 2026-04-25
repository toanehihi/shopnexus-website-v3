import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { customFetchStandard } from "@/lib/queryclient/custom-fetch"
import { useInfiniteQueryPagination } from "@/lib/queryclient/use-infinite-query"
import { PaginationParams } from "@/lib/queryclient/response.type"

// ===== Types =====

export const PromotionTypes = [
  "Discount",
  "ShipDiscount",
  "Bundle",
  "BuyXGetY",
  "Cashback",
] as const

export type PromotionType = (typeof PromotionTypes)[number]

export type PromotionRef = {
  ref_type: string
  ref_id: string
}

export type Promotion = {
  id: string
  code: string
  owner_id: string | null
  type: string
  title: string
  description: string | null
  is_enabled: boolean
  auto_apply: boolean
  group: string
  priority: number
  data: unknown
  date_started: string
  date_ended: string | null
  date_created: string
  date_updated: string
  refs: PromotionRef[]
}

export type PromotionDiscount = Promotion & {
  min_spend: number
  max_discount: number
  discount_percent: number | null
  discount_price: number | null
}

// ===== Hooks =====

export const useGetPromotion = (id?: string) =>
  useQuery({
    queryKey: ["promotion", id],
    queryFn: async () =>
      customFetchStandard<Promotion>(`catalog/promotion/${id}`),
    enabled: !!id,
  })

export const useListPromotionVendor = (
  params: PaginationParams<{
    is_enabled?: boolean
  }>
) =>
  useInfiniteQueryPagination<Promotion>(
    ["promotion", "list", "vendor"],
    "catalog/promotion",
    params
  )

export const useCreatePromotion = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      code: string
      type: PromotionType
      title: string
      description?: string | null
      is_enabled: boolean
      auto_apply: boolean
      group: string
      priority: number
      data?: unknown
      date_started: string
      date_ended?: string | null
      refs?: PromotionRef[]
    }) =>
      customFetchStandard<Promotion>(`catalog/promotion`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["promotion"] })
    },
  })
}

export const useUpdatePromotion = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      id: string
      code?: string | null
      title?: string | null
      description?: string | null
      is_enabled?: boolean | null
      auto_apply?: boolean | null
      group?: string | null
      priority?: number | null
      data?: unknown
      null_data?: boolean
      date_started?: string | null
      date_ended?: string | null
      null_date_ended?: boolean
      refs?: PromotionRef[]
    }) =>
      customFetchStandard<Promotion>(`catalog/promotion`, {
        method: "PATCH",
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["promotion"] })
    },
  })
}

export const useDeletePromotion = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      customFetchStandard<{ message: string }>(`catalog/promotion/${id}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["promotion"] })
    },
  })
}

// Legacy discount-specific hooks (kept for backward compatibility)

export const useCreateDiscount = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      code: string
      refs: Array<{
        ref_type: string
        ref_id: string
      }>
      title: string
      description?: string | null
      is_enabled: boolean
      auto_apply: boolean
      date_started: string
      date_ended?: string | null
      min_spend: number
      max_discount: number
      discount_percent?: number | null
      discount_price?: number | null
    }) =>
      customFetchStandard<PromotionDiscount>(`catalog/promotion/discount`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["promotion"] })
    },
  })
}

export const useUpdateDiscount = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      id: string
      code?: string | null
      owner_id?: string | null
      refs?: Array<{
        ref_type: string
        ref_id: string
      }>
      title?: string | null
      description?: string | null
      is_enabled?: boolean | null
      date_started?: string | null
      date_ended?: string | null
      null_date_ended?: boolean
      min_spend?: number | null
      max_discount?: number | null
      discount_percent?: number | null
      discount_price?: number | null
    }) =>
      customFetchStandard<PromotionDiscount>(`catalog/promotion/discount`, {
        method: "PATCH",
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["promotion"] })
    },
  })
}
