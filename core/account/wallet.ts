import { useQuery } from "@tanstack/react-query"
import { customFetchStandard } from "@/lib/queryclient/custom-fetch"

export type WalletBalance = {
  balance: number
}

export type WalletTransaction = {
  id: number
  account_id: string
  type: 'Refund' | 'Payment' | 'TopUp'
  amount: number
  reference_id: string | null
  note: string | null
  date_created: string
}

export const useGetWalletBalance = () =>
  useQuery({
    queryKey: ['account', 'wallet'],
    queryFn: () => customFetchStandard<WalletBalance>('account/wallet'),
  })

export const useListWalletTransactions = (params?: { limit?: number; offset?: number }) =>
  useQuery({
    queryKey: ['account', 'wallet', 'transactions', params],
    queryFn: () => customFetchStandard<WalletTransaction[]>('account/wallet/transactions', {
      method: 'GET',
      ...(params && {
        headers: { 'Content-Type': 'application/json' },
      }),
    }),
  })
