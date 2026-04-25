import type { TOrder } from "@/core/order/order.buyer"

// "Cancelled" in user-facing terms: any non-recoverable terminal failure on the
// confirm-fee transaction OR the transport. Includes both the payment-expired
// (Failed) and explicit-cancel (Cancelled) cases — both render under the
// Cancelled tab and hide the active order UI.
export function isCancelledOrder(order: TOrder): boolean {
  const cs = order.ConfirmFeeTx?.Status
  const ts = order.Transport?.Status
  return cs === "Cancelled" || cs === "Failed" || ts === "Failed" || ts === "Cancelled"
}

export function isCompletedOrder(order: TOrder): boolean {
  return order.Transport?.Status === "Delivered"
}

// Active = confirmed but neither completed nor cancelled. Used by the Pending
// tab so failed/completed orders don't double up across tabs.
export function isActiveOrder(order: TOrder): boolean {
  return !isCompletedOrder(order) && !isCancelledOrder(order)
}
