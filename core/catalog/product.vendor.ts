import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { customFetchStandard } from "@/lib/queryclient/custom-fetch"
import { useInfiniteQueryPagination } from "@/lib/queryclient/use-infinite-query"
import { PaginationParams } from "@/lib/queryclient/response.type"
import qs from "qs"
import { Resource } from "../common/resource.type"
import { Category } from "./category"
import { TProductCardPromotion as TProductPromotion, TRating } from "./product.customer"

// ===== Types =====

export type ProductAttribute = {
  name: string
  value: string
}

export type PackageDetails = {
  weight_grams: number
  length_cm: number
  width_cm: number
  height_cm: number
}

export type ProductSpecification = {
  name: string
  value: string
}

export type ProductSku = {
  id: string
  spu_id: string
  price: number
  combinable: boolean
  date_created: string
  stock: number

  attributes: ProductAttribute[]
  package_details: PackageDetails
}

export type ProductSPU = {
  id: string
  account_id: string
  slug: string
  category: Category
  featured_sku_id: string | null
  name: string
  description: string
  currency: string
  is_enabled: boolean
  date_created: string
  date_updated: string

  rating: TRating
  tags: string[]
  resources: Resource[]
  specifications?: ProductSpecification[]

  is_stale_embedding: boolean
  is_stale_metadata: boolean
}

// ===== Hooks =====

// List Product SPU (Infinite Query)
export const useListProductSPU = (params: PaginationParams<{
  search?: string
  my_products?: boolean
  category_id?: string[]
  is_enabled?: boolean[]
}>) =>
  useInfiniteQueryPagination<ProductSPU>(
    ['product-spu', 'list', params],
    'catalog/product-spu',
    params
  )

// Create Product SPU
export const useCreateProductSPU = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      category_id: string
      name: string
      description: string
      currency: string
      is_enabled: boolean
      tags: string[]
      resource_ids?: string[]
      specifications?: Array<{ name: string; value: string }>
    }) =>
      customFetchStandard<ProductSPU>('catalog/product-spu', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['product-spu'] })
    },
  })
}

// Update Product SPU
export const useUpdateProductSPU = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      id: string
      category_id?: string
      featured_sku_id?: string
      name?: string
      description?: string
      currency?: string
      is_enabled?: boolean
      regenerate_slug?: boolean
      tags?: string[]
      resource_ids?: string[]
      specifications?: Array<{ name: string; value: string }>
    }) =>
      customFetchStandard<ProductSPU>('catalog/product-spu', {
        method: 'PATCH',
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['product-spu'] })
    },
  })
}

// Delete Product SPU
export const useDeleteProductSPU = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: string }) =>
      customFetchStandard<{ message: string }>(`catalog/product-spu/${params.id}`, {
        method: 'DELETE',
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['product-spu'] })
    },
  })
}

// Get Product SPU by ID
export const useGetProductSPU = (id: string | undefined) =>
  useQuery({
    queryKey: ['product-spu', 'detail', id],
    queryFn: () => customFetchStandard<ProductSPU>(`catalog/product-spu/${id}`),
    enabled: !!id,
  })

export const useListProductSKU = (params?: {
  spu_id?: string
  price_from?: number
  price_to?: number
  combinable?: boolean
}) =>
  useQuery({
    queryKey: ['product-sku', 'list', params],
    queryFn: () => customFetchStandard<ProductSku[]>(`catalog/product-sku?${qs.stringify(params)}`),
  })

// Create Product SKU
export const useCreateProductSKU = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      spu_id: string
      price: number
      combinable: boolean
      attributes?: ProductAttribute[]
      package_details: Record<string, any>
    }) =>
      customFetchStandard<ProductSku>('catalog/product-sku', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['product-sku'] })
    },
  })
}

// Update Product SKU
export const useUpdateProductSKU = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      id: string
      price?: number
      combinable?: boolean
      attributes?: ProductAttribute[]
      package_details?: Record<string, any>
    }) =>
      customFetchStandard<ProductSku>('catalog/product-sku', {
        method: 'PATCH',
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['product-sku'] })
    },
  })
}

// Delete Product SKU
export const useDeleteProductSKU = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: { id: string }) =>
      customFetchStandard<{ message: string }>('catalog/product-sku', {
        method: 'DELETE',
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['product-sku'] })
    },
  })
}

