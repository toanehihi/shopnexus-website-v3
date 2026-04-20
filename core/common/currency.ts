import { useMutation, useQuery } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/queryclient/query-client"
import { customFetchStandard } from "@/lib/queryclient/custom-fetch"
import { useGetMe } from "@/core/account/account"

export type ExchangeRateSnapshot = {
  base: string
  rates: Record<string, number>
  fetched_at: string | null
  supported: string[]
}

const RATES_QUERY_KEY = ["common", "exchange-rates"] as const

export const useExchangeRates = () =>
  useQuery({
    queryKey: RATES_QUERY_KEY,
    queryFn: () =>
      customFetchStandard<ExchangeRateSnapshot>("common/currencies/rates"),
    staleTime: 60 * 60 * 1000,           // 1h — rate updates BE-side every 6h
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

const LS_KEY = "preferred_currency"
const DEFAULT_CURRENCY = "VND"

/**
 * Returns the active preferred currency. Fallback chain:
 *   profile.settings.preferred_currency > localStorage > "VND"
 */
export function usePreferredCurrency(): string {
  const { data: me } = useGetMe()
  const fromProfile = me?.settings?.preferred_currency
  if (fromProfile) return fromProfile

  if (typeof window !== "undefined") {
    const fromLocal = window.localStorage.getItem(LS_KEY)
    if (fromLocal) return fromLocal
  }
  return DEFAULT_CURRENCY
}

export const useUpdatePreferredCurrency = () => {
  const queryClient = getQueryClient()
  return useMutation({
    mutationFn: (currency: string) =>
      customFetchStandard("account/me/settings", {
        method: "PATCH",
        body: JSON.stringify({ preferred_currency: currency }),
      }),
    onSuccess: (_, currency) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(LS_KEY, currency)
      }
      queryClient.invalidateQueries({ queryKey: ["account", "me"] })
    },
  })
}
