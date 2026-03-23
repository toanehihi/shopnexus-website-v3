import { useMutation, useQuery } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/queryclient/query-client'
import { customFetchStandard, customFetchPagination } from '@/lib/queryclient/custom-fetch'

// ===== Types =====

export type PaymentMethod = {
  id: string // UUID
  account_id: string // UUID
  type: string
  label: string
  data: Record<string, unknown>
  is_default: boolean
  date_created: string
  date_updated: string
}

// ===== Hooks =====

export const useListPaymentMethods = () =>
  useQuery({
    queryKey: ['account', 'payment-method'],
    queryFn: async () => {
      const res = await customFetchPagination<PaymentMethod>('account/payment-method')
      return res.data
    },
  })

export const useCreatePaymentMethod = () =>
  useMutation({
    mutationFn: async (params: {
      type: string
      label: string
      data: Record<string, unknown>
      is_default?: boolean
    }) =>
      customFetchStandard<PaymentMethod>('account/payment-method', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      const queryClient = getQueryClient()
      await queryClient.invalidateQueries({ queryKey: ['account', 'payment-method'] })
    },
  })

export const useUpdatePaymentMethod = () =>
  useMutation({
    mutationFn: async (params: {
      id: string // UUID
      type?: string
      label?: string
      data?: Record<string, unknown>
    }) =>
      customFetchStandard<PaymentMethod>('account/payment-method', {
        method: 'PATCH',
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      const queryClient = getQueryClient()
      await queryClient.invalidateQueries({ queryKey: ['account', 'payment-method'] })
    },
  })

export const useDeletePaymentMethod = () =>
  useMutation({
    mutationFn: async (params: { id: string }) =>
      customFetchStandard<{ message: string }>('account/payment-method', {
        method: 'DELETE',
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      const queryClient = getQueryClient()
      await queryClient.invalidateQueries({ queryKey: ['account', 'payment-method'] })
    },
  })

export const useSetDefaultPaymentMethod = () =>
  useMutation({
    mutationFn: async (id: string) =>
      customFetchStandard<PaymentMethod>(`account/payment-method/${id}/default`, {
        method: 'PUT',
      }),
    onSuccess: async () => {
      const queryClient = getQueryClient()
      await queryClient.invalidateQueries({ queryKey: ['account', 'payment-method'] })
    },
  })
