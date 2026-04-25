import { useQuery } from "@tanstack/react-query"
import { customFetchStandard } from "@/lib/queryclient/custom-fetch"
import { useInfiniteQueryPagination } from "@/lib/queryclient/use-infinite-query"
import { PaginationParams } from "@/lib/queryclient/response.type"

// ===== Types =====

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
  date_started: string
  date_ended: string | null
  date_created: string
  date_updated: string
  refs: PromotionRef[]
}

// ===== Hooks =====

export const useGetPromotion = (id?: string) => useQuery({
  queryKey: ['promotion', id],
  queryFn: async () => customFetchStandard<Promotion>(`catalog/promotion/${id}`),
  enabled: !!id,
})

export const useListPromotion = (params: PaginationParams<{
  is_enabled?: boolean
}>) =>
  useInfiniteQueryPagination<Promotion>(
    ['promotion', 'list'],
    'catalog/promotion',
    params
  )

