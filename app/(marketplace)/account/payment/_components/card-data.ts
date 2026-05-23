import { type Option } from "@/core/common/option"

// Shape stored inside Option.data for owned card-type payment options.
// Keys are FE conventions; the BE treats `data` as opaque jsonb.
export type CardData = {
  token?: string
  brand?: string
  last4?: string
  exp_month?: number
  exp_year?: number
  card_type?: "credit" | "debit"
  // "card" | "ewallet" | "bank" — not all owned options are cards.
  kind?: "card" | "ewallet" | "bank"
  is_default?: boolean
}

export const cardDataOf = (o: Option): CardData => (o.data ?? {}) as CardData

export function formatCardNumber(last4?: string) {
  if (!last4) return null
  return `**** **** **** ${last4}`
}

export function formatExpiry(month?: number, year?: number) {
  if (month == null || year == null) return null
  return `${String(month).padStart(2, "0")}/${year}`
}

export function capitalizeFirst(str?: string) {
  if (!str) return null
  return str.charAt(0).toUpperCase() + str.slice(1)
}
