import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/queryclient/query-client'
import { customFetchStandard } from '@/lib/queryclient/custom-fetch'
import type { ChatMessage } from './chat'
import type { Notification } from '@/core/account/notification'

// ===== Types =====

type SSEEvent = {
  type: 'new_message' | 'read_receipt' | 'notification'
  data: any
}

type SendMessagePayload = {
  conversation_id: string
  type: 'Text' | 'Image' | 'System'
  content: string
  metadata?: Record<string, any>
}

// ===== Constants =====

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://shopnexus.hopto.org/api/v1/'

const MAX_RETRIES = 5
const BASE_DELAY_MS = 1000

function getSSEUrl(): string {
  const token = globalThis?.localStorage?.getItem?.('token') ?? ''
  return `${BASE_URL}common/stream?token=${encodeURIComponent(token)}`
}

// ===== SSE Hook =====

export function useEventStream() {
  const esRef = useRef<EventSource | null>(null)
  const retryCountRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<ChatMessage | null>(null)
  const [lastNotification, setLastNotification] = useState<Notification | null>(null)

  const connect = useCallback(() => {
    if (!mountedRef.current) return
    if (esRef.current?.readyState === EventSource.OPEN || esRef.current?.readyState === EventSource.CONNECTING) return

    const token = globalThis?.localStorage?.getItem?.('token')
    if (!token?.length) return

    const es = new EventSource(getSSEUrl())
    esRef.current = es

    es.onopen = () => {
      if (!mountedRef.current) {
        es.close()
        return
      }
      retryCountRef.current = 0
      setIsConnected(true)
    }

    es.onerror = () => {
      setIsConnected(false)
      es.close()
      esRef.current = null
      if (!mountedRef.current) return
      scheduleReconnect()
    }

    es.onmessage = (event) => {
      try {
        const envelope: SSEEvent = JSON.parse(event.data)
        handleEvent(envelope)
      } catch {
        // Ignore malformed messages
      }
    }
  }, [])

  const scheduleReconnect = useCallback(() => {
    if (retryCountRef.current >= MAX_RETRIES) return
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)

    const delay = BASE_DELAY_MS * Math.pow(2, retryCountRef.current)
    retryCountRef.current += 1

    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null
      connect()
    }, delay)
  }, [connect])

  const handleEvent = useCallback((envelope: SSEEvent) => {
    const queryClient = getQueryClient()

    switch (envelope.type) {
      case 'new_message': {
        const msg = envelope.data as ChatMessage
        setLastMessage(msg)
        queryClient.invalidateQueries({
          queryKey: ['chat', 'conversation', msg.conversation_id, 'messages'],
        })
        queryClient.invalidateQueries({
          queryKey: ['chat', 'conversation'],
        })
        break
      }
      case 'read_receipt': {
        const receipt = envelope.data as { conversation_id: string; reader_id: string }
        queryClient.invalidateQueries({
          queryKey: ['chat', 'conversation', receipt.conversation_id, 'messages'],
        })
        queryClient.invalidateQueries({
          queryKey: ['chat', 'conversation'],
        })
        break
      }
      case 'notification': {
        const noti = envelope.data as Notification
        setLastNotification(noti)
        queryClient.invalidateQueries({ queryKey: ['notification'] })
        break
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      if (esRef.current) {
        esRef.current.close()
        esRef.current = null
      }
    }
  }, [connect])

  return { isConnected, lastMessage, lastNotification }
}

// ===== REST Mutations =====

export const useSendMessage = () =>
  useMutation({
    mutationFn: async (payload: SendMessagePayload) =>
      customFetchStandard<ChatMessage>('chat/send-message', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (msg) => {
      const queryClient = getQueryClient()
      queryClient.invalidateQueries({
        queryKey: ['chat', 'conversation', msg.conversation_id, 'messages'],
      })
      queryClient.invalidateQueries({
        queryKey: ['chat', 'conversation'],
      })
    },
  })

export const useMarkRead = () =>
  useMutation({
    mutationFn: async (params: { conversation_id: string }) =>
      customFetchStandard<{ message: string }>('chat/mark-read', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: (_, params) => {
      const queryClient = getQueryClient()
      queryClient.invalidateQueries({
        queryKey: ['chat', 'conversation', params.conversation_id, 'messages'],
      })
      queryClient.invalidateQueries({
        queryKey: ['chat', 'conversation'],
      })
    },
  })
