import { customFetchStandard } from "@/lib/queryclient/custom-fetch"
import { useMutation, useQuery } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/queryclient/query-client"
import { Resource } from "../common/resource.type"
import { useIsAuthenticated } from "@/core/account/auth"

import { ProductSku } from "../catalog/product.vendor"

// ===== Types =====

export type CartItem = {
  spu_id: string
  sku: ProductSku
  quantity: number
  resource: Resource | null
}

export type Cart = CartItem[]

// ===== Hooks =====

export const useGetCart = () => {
  const isAuthenticated = useIsAuthenticated()
  return useQuery({
    queryKey: ['account', 'cart'],
    queryFn: async () => customFetchStandard<Cart>('order/cart'),
    enabled: isAuthenticated,
  })
}

export const useUpdateCart = () =>
  useMutation({
    mutationFn: async (params: {
      sku_id: string
      quantity?: number // either quantity or delta_quantity must be provided
      delta_quantity?: number
    }) =>
      customFetchStandard<{ message: string }>('order/cart', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      const queryClient = getQueryClient()
      await queryClient.invalidateQueries({ queryKey: ['account', 'cart'] })
    },
  })

export const useClearCart = () =>
  useMutation({
    mutationFn: async () =>
      customFetchStandard<{ message: string }>('order/cart', {
        method: 'DELETE',
      }),
    onSuccess: async () => {
      const queryClient = getQueryClient()
      await queryClient.invalidateQueries({ queryKey: ['account', 'cart'] })
    },
  })


