"use client"

import { memo, useCallback, useMemo, useRef, useState, useEffect } from "react"
import { useGetMe, useGetAccount } from "@/core/account/account"
import {
  Conversation,
  ChatMessage,
  useListConversations,
  useListMessages,
} from "@/core/chat/chat"
import { useSendMessage, useMarkRead as useChatMarkRead } from "@/core/chat/use-chat-socket"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { MessageCircle, Send, Check, CheckCheck, ArrowLeft, Loader2 } from "lucide-react"

export default function ChatPage() {
  const { data: me } = useGetMe()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [showMobileMessages, setShowMobileMessages] = useState(false)

  const handleSelectConversation = useCallback((id: string) => {
    setSelectedConversationId(id)
    setShowMobileMessages(true)
  }, [])

  const handleBackToList = useCallback(() => {
    setShowMobileMessages(false)
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground">
          Chat with vendors and customers
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="flex h-[600px]">
          {/* Left Panel - Conversation List */}
          <div
            className={cn(
              "w-full md:w-80 md:border-r flex-shrink-0 flex flex-col",
              showMobileMessages ? "hidden md:flex" : "flex"
            )}
          >
            <div className="p-4 border-b">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Conversations
              </h2>
            </div>
            <ConversationList
              selectedId={selectedConversationId}
              currentUserId={me?.id ?? ""}
              onSelect={handleSelectConversation}
            />
          </div>

          {/* Right Panel - Message Area */}
          <div
            className={cn(
              "flex-1 flex flex-col min-w-0",
              showMobileMessages ? "flex" : "hidden md:flex"
            )}
          >
            {selectedConversationId && me ? (
              <MessagePanel
                key={selectedConversationId}
                conversationId={selectedConversationId}
                currentUserId={me.id}
                onBack={handleBackToList}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                  <MessageCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">
                  Select a conversation
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Choose a conversation from the list to start chatting
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

// ===== Conversation List (isolated from message panel re-renders) =====

const ConversationList = memo(function ConversationList({
  selectedId,
  currentUserId,
  onSelect,
}: {
  selectedId: string | null
  currentUserId: string
  onSelect: (id: string) => void
}) {
  const {
    data: conversationsData,
    isLoading,
  } = useListConversations({ limit: 50 })

  const conversations = useMemo(
    () => conversationsData?.pages.flatMap((page) => page.data) ?? [],
    [conversationsData]
  )

  if (isLoading) return <ConversationListSkeleton />

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
          <MessageCircle className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No conversations yet</p>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="divide-y">
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isActive={conversation.id === selectedId}
            currentUserId={currentUserId}
            onClick={() => onSelect(conversation.id)}
          />
        ))}
      </div>
    </ScrollArea>
  )
})

// ===== Conversation Item =====

const ConversationItem = memo(function ConversationItem({
  conversation,
  isActive,
  currentUserId,
  onClick,
}: {
  conversation: Conversation
  isActive: boolean
  currentUserId: string
  onClick: () => void
}) {
  const isCustomer = conversation.buyer_id === currentUserId
  const partnerId = isCustomer ? conversation.seller_id : conversation.buyer_id
  const { data: partner } = useGetAccount(partnerId)
  const partnerName = partner?.name || partner?.username || (isCustomer ? "Seller" : "Buyer")

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50",
        isActive && "bg-muted"
      )}
    >
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarFallback>{partnerName.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium truncate">
            {partnerName}
          </p>
          {conversation.last_message_at && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {formatRelativeTime(conversation.last_message_at)}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {isCustomer ? "Seller" : "Buyer"}
        </p>
      </div>
    </button>
  )
})

// ===== Message Panel (fully self-contained, owns its own data) =====

function MessagePanel({
  conversationId,
  currentUserId,
  onBack,
}: {
  conversationId: string
  currentUserId: string
  onBack: () => void
}) {
  const [inputValue, setInputValue] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevMessageCountRef = useRef(0)
  const sendMessageMutation = useSendMessage()
  const markReadMutation = useChatMarkRead()

  // Resolve partner name from conversations cache
  const { data: convsData } = useListConversations({ limit: 50 })
  const conv = useMemo(
    () => convsData?.pages.flatMap((p) => p.data).find((c) => c.id === conversationId),
    [convsData, conversationId]
  )
  const partnerId = conv
    ? conv.buyer_id === currentUserId ? conv.seller_id : conv.buyer_id
    : ""
  const { data: partner } = useGetAccount(partnerId)
  const partnerName = partner?.name || partner?.username || "Chat"

  const {
    data: messagesData,
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListMessages(conversationId, { limit: 50 })

  const messages = useMemo(() => {
    // Pages come in DESC order (newest first) from the API.
    // Reverse pages so older pages come first, then reverse each page's items.
    const pages = messagesData?.pages ?? []
    const allMessages: ChatMessage[] = []
    for (let i = pages.length - 1; i >= 0; i--) {
      const pageData = pages[i].data
      for (let j = pageData.length - 1; j >= 0; j--) {
        allMessages.push(pageData[j])
      }
    }
    return allMessages
  }, [messagesData])

  // Mark as read on mount (once per conversation)
  useEffect(() => {
    markReadMutation.mutate({ conversation_id: conversationId })
  }, [conversationId])

  // Auto-scroll within the messages container only when new messages arrive
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
    prevMessageCountRef.current = messages.length
  }, [messages.length])

  const handleSend = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    sendMessageMutation.mutate({
      conversation_id: conversationId,
      type: "Text",
      content: trimmed,
    })
    setInputValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-8 w-8"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-9 w-9">
          <AvatarFallback>{partnerName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            {partnerName}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {messagesLoading ? (
          <MessagesSkeleton />
        ) : (
          <div className="space-y-1">
            {hasNextPage && (
              <div className="flex justify-center pb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? "Loading..." : "Load older messages"}
                </Button>
              </div>
            )}

            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No messages yet. Send a message to start the conversation.
                </p>
              </div>
            )}

            {messages.map((message, index) => {
              const isSent = message.sender_id === currentUserId
              const showDate = shouldShowDate(message, messages[index - 1] ?? null)
              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="flex items-center justify-center py-3">
                      <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {formatMessageDate(message.date_created)}
                      </span>
                    </div>
                  )}
                  <MessageBubble message={message} isSent={isSent} />
                </div>
              )
            })}

          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim() || sendMessageMutation.isPending}
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </>
  )
}

// ===== Message Bubble =====

const MessageBubble = memo(function MessageBubble({
  message,
  isSent,
}: {
  message: ChatMessage
  isSent: boolean
}) {
  return (
    <div className={cn("flex mb-1", isSent ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2",
          isSent
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted rounded-bl-md"
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
        <div
          className={cn(
            "flex items-center gap-1 mt-0.5",
            isSent ? "justify-end" : "justify-start"
          )}
        >
          <span
            className={cn(
              "text-[10px]",
              isSent ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          >
            {formatTime(message.date_created)}
          </span>
          {isSent && (
            <span className="text-primary-foreground/70">
              {message.status === "Read" ? (
                <CheckCheck className="h-3 w-3" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
})

// ===== Skeletons =====

function ConversationListSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  )
}

function MessagesSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
          <Skeleton className={cn("h-10 rounded-2xl", i % 2 === 0 ? "w-48" : "w-36")} />
        </div>
      ))}
    </div>
  )
}

// ===== Utilities =====

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "now"
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatMessageDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) return "Today"
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday"
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
}

function shouldShowDate(current: ChatMessage, previous: ChatMessage | null): boolean {
  if (!previous) return true
  return new Date(current.date_created).toDateString() !== new Date(previous.date_created).toDateString()
}
