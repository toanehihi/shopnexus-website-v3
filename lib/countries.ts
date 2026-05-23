import { useMemo } from "react"

// Starter list of supported countries (ISO 3166-1 alpha-2).
// Keep it compact; expand later as the marketplace grows.
export const SUPPORTED_COUNTRIES = [
  "VN", "US", "GB", "DE", "FR", "JP", "KR", "TH", "SG", "MY",
  "ID", "PH", "AU", "CA", "IN", "CN", "TW", "HK", "IT", "ES",
  "NL", "BR", "MX", "AE",
] as const

export type SupportedCountry = (typeof SUPPORTED_COUNTRIES)[number]

export type CountryOption = {
  code: string
  label: string
}

export function useCountryOptions(): CountryOption[] {
  return useMemo(() => {
    const regionNames = new Intl.DisplayNames(["en"], { type: "region" })
    return SUPPORTED_COUNTRIES.map((code) => ({
      code,
      label: regionNames.of(code) ?? code,
    })).sort((a, b) => a.label.localeCompare(b.label))
  }, [])
}

/** Returns the localized country label for a code, falling back to the code itself. */
export function countryLabel(code: string | null | undefined): string {
  if (!code) return ""
  try {
    const regionNames = new Intl.DisplayNames(["en"], { type: "region" })
    return regionNames.of(code) ?? code
  } catch {
    return code
  }
}

// Mirror of the backend's `Infer(country) -> currency` mapping used when a
// buyer's wallet currency must be derived client-side (e.g. for the cross-
// currency FX preview at checkout). The backend is always authoritative — the
// preview is advisory, rate is snapshotted server-side on checkout receipt.
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  VN: "VND", US: "USD", GB: "GBP", JP: "JPY",
  DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR",
  KR: "KRW", TH: "THB", SG: "SGD", MY: "MYR", ID: "IDR",
  PH: "PHP", AU: "AUD", CA: "CAD", IN: "INR", CN: "CNY",
  TW: "TWD", HK: "HKD", BR: "BRL", MX: "MXN", AE: "AED",
}

/**
 * Returns the wallet currency for an ISO 3166-1 alpha-2 country code, or
 * null if unknown. Mirrors the server-side Infer(country) mapping.
 */
export function walletCurrencyForCountry(
  country: string | null | undefined,
): string | null {
  if (!country) return null
  return COUNTRY_TO_CURRENCY[country.toUpperCase()] ?? null
}

// Unique ISO-4217 currency codes derived from the country→currency map above.
// Keep this in lockstep with the backend's accepted iso4217 set; the BE
// validator rejects anything else, so a wider list here only adds dead options.
export const SUPPORTED_CURRENCIES = Array.from(
  new Set(Object.values(COUNTRY_TO_CURRENCY)),
).sort() as readonly string[]

export type CurrencyOption = {
  code: string
  label: string
}

/** Returns a localized display label like "VND — Vietnamese Dong". */
export function currencyLabel(code: string): string {
  try {
    const display = new Intl.DisplayNames(["en"], { type: "currency" })
    const name = display.of(code)
    return name ? `${code} — ${name}` : code
  } catch {
    return code
  }
}

/** Memoised select-friendly options for the supported currency set. */
export function useCurrencyOptions(): CurrencyOption[] {
  return useMemo(
    () => SUPPORTED_CURRENCIES.map((code) => ({ code, label: currencyLabel(code) })),
    [],
  )
}
