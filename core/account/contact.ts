import { useMutation, useQuery } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/queryclient/query-client'
import { customFetchStandard } from '@/lib/queryclient/custom-fetch'

// ===== Types =====

export enum AddressType {
  Home,
  Work,
}

export type Contact = {
  id: string // UUID
  account_id: string // UUID
  full_name: string
  phone: string
  phone_verified: boolean
  address: string
  address_type: AddressType
  latitude?: number | null
  longitude?: number | null
  date_created: string
  date_updated: string
}

// ===== Hooks =====

export const useGetContact = (contactId: string) =>
  useQuery({
    queryKey: ['account', 'contact', contactId],
    queryFn: async () => customFetchStandard<Contact>(`account/contact/${contactId}`),
    enabled: !!contactId,
  })

export const useListContacts = () =>
  useQuery({
    queryKey: ['account', 'contact'],
    queryFn: async () => customFetchStandard<Contact[]>('account/contact'),
  })

export const useCreateContact = () =>
  useMutation({
    mutationFn: async (params: {
      full_name: string
      phone: string
      address: string
      address_type: 'Home' | 'Work'
      latitude?: number | null
      longitude?: number | null
    }) =>
      customFetchStandard<Contact>('account/contact', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      const queryClient = getQueryClient()
      await queryClient.invalidateQueries({ queryKey: ['account', 'contact'] })
    },
  })

export const useUpdateContact = () =>
  useMutation({
    mutationFn: async (params: {
      contact_id: string // UUID
      full_name?: string
      phone?: string
      address?: string
      address_type?: 'Home' | 'Work'
      phone_verified?: boolean
      latitude?: number | null
      longitude?: number | null
    }) =>
      customFetchStandard<Contact>('account/contact', {
        method: 'PATCH',
        body: JSON.stringify(params),
      }),
    onSuccess: async (data) => {
      const queryClient = getQueryClient()
      await queryClient.invalidateQueries({ queryKey: ['account', 'contact'] })
      await queryClient.invalidateQueries({ queryKey: ['account', 'contact', data.id] })
    },
  })

export const useDeleteContact = () =>
  useMutation({
    mutationFn: async (params: { contact_id: string }) => // UUID
      customFetchStandard<{ message: string }>('account/contact', {
        method: 'DELETE',
        body: JSON.stringify(params),
      }),
    onSuccess: async () => {
      const queryClient = getQueryClient()
      await queryClient.invalidateQueries({ queryKey: ['account', 'contact'] })
    },
  })

