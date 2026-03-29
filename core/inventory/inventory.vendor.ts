import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { customFetchStandard } from "@/lib/queryclient/custom-fetch"
import { useInfiniteQueryPagination } from "@/lib/queryclient/use-infinite-query"
import { PaginationParams } from "@/lib/queryclient/response.type"
import qs from "qs"

// ===== Types =====

export interface Serial {
  id: string
  ref_type: "ProductSku" | "Promotion"
  ref_id: string
  status: "Active" | "Inactive" | "Taken" | "Damaged"
  date_created: string
}

export interface Stock {
  id: string
  ref_type: "ProductSku" | "Promotion"
  ref_id: string
  stock: number
  taken: number
  serial_required: boolean
  date_created: string
}

export interface StockHistory {
  id: number
  change: number
  date_created: string
}

// ===== Hooks =====
export function useGetStock(params: {
  ref_id: string
  ref_type: "ProductSku" | "Promotion"
}) {
  return useQuery({
    queryKey: ["inventory", "stock", params],
    queryFn: () => customFetchStandard<Stock>(`inventory/stock?${qs.stringify(params)}`),
    enabled: !!params.ref_id && !!params.ref_type,
  })
}

export function useListStockHistory(params: PaginationParams<{
  ref_id: string
  ref_type: "ProductSku" | "Promotion"
}>) {
  return useInfiniteQueryPagination<StockHistory>(
    ["inventory", "stock-history"],
    "inventory/stock/history",
    params,
    {
      enabled: !!params.ref_id && !!params.ref_type,
    }
  )
}

export function useListProductSerials(params: PaginationParams<{
  stock_id: number
}>) {
  return useInfiniteQueryPagination<Serial>(
    ["inventory", "serials", params.stock_id],
    "inventory/serial",
    params,
    {
      enabled: !!params.stock_id,
    }
  )
}

export function useUpdateStockSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      ref_id: string
      ref_type: "ProductSku" | "Promotion"
      serial_required: boolean
    }) =>
      customFetchStandard<Stock>('inventory/stock', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "stock"] })
    },
  })
}

// Mutation functions
export function useImportStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      ref_id: string
      ref_type: "ProductSku" | "Promotion"
      change: number
      serial_ids: string[]
    }) =>
      customFetchStandard<string>('inventory/stock/import', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "serials"] })
      queryClient.invalidateQueries({ queryKey: ["inventory", "stock"] })
      queryClient.invalidateQueries({ queryKey: ["inventory", "stock-history"] })
      queryClient.invalidateQueries({ queryKey: ["product-sku"] })
    },
  })
}

export function useUpdateSkuSerial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      serial_ids: string[]
      status: "Active" | "Inactive" | "Taken" | "Damaged"
    }) =>
      customFetchStandard<string>(`inventory/serial`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "serials"] })
      queryClient.invalidateQueries({ queryKey: ["inventory", "stock"] })
    },
  })
}

