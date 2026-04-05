import { useQuery } from '@tanstack/react-query'
import { customFetchStandard } from '@/lib/queryclient/custom-fetch'
import { useInfiniteQueryPagination } from '@/lib/queryclient/use-infinite-query'
import type { PaginationParams } from '@/lib/queryclient/response.type'
import type { Resource } from '@/core/common/resource.type'

// ===== Types =====

export type Category = {
  id: string
  name: string
  description: string
  parent_id: string | null
  resources: Resource[] | null
}

// ===== Hooks =====

export const useListCategories = (params: PaginationParams<{
  search?: string
  id?: string[]
}>) =>
  useInfiniteQueryPagination<Category>(
    ['category', 'list'],
    'catalog/category',
    params
  )

export const useGetCategory = (id: string) =>
  useQuery({
    queryKey: ['category', 'detail', id],
    queryFn: () => customFetchStandard<Category>(`catalog/category/${id}`),
  })

