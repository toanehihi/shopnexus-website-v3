"use client"

import { useEventStream } from "@/core/chat/use-chat-socket"

/**
 * Establishes the SSE connection when mounted.
 * Place in a layout that wraps authenticated pages.
 * Renders nothing — just holds the connection.
 */
export function EventStreamProvider({ children }: { children: React.ReactNode }) {
  useEventStream()
  return <>{children}</>
}
