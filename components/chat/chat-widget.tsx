"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useChatContext } from "./chat-context"
import { useGetMe, useGetAccount } from "@/core/account/account"
import { ChatMessage, useListMessages } from "@/core/chat/chat"
import { useEventStream, useSendMessage, useMarkRead as useChatMarkRead } from "@/core/chat/use-chat-socket"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  MessageCircle,
  Send,
  X,
  ChevronDown,
  Check,
  CheckCheck,
  Loader2,
} from "lucide-react"

export function ChatWidget() {
  const { data: me } = useGetMe()
  const { state, closeChat, toggleChat } = useChatContext()

  // Don't render anything if user is not logged in
  if (!me) return null

  return (
    <>
      {/* Floating toggle button - visible when widget is closed */}
      {!state.isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95 sm:bottom-8 sm:right-8"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      <div
        className={cn(
          "fixed bottom-0 right-0 z-50 transition-all duration-300 ease-in-out sm:bottom-6 sm:right-6",
          state.isOpen
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        )}
      >
        <Card className="flex flex-col w-screen h-[100dvh] sm:w-[400px] sm:h-[500px] sm:rounded-xl shadow-2xl overflow-hidden border">
          {state.conversationId && state.vendorId ? (
            <ChatPanelContent
              conversationId={state.conversationId}
              vendorId={state.vendorId}
              currentUserId={me.id}
              onMinimize={toggleChat}
              onClose={closeChat}
            />
          ) : state.vendorId ? (
            <ChatPanelLoading
              vendorId={state.vendorId}
              onMinimize={toggleChat}
              onClose={closeChat}
            />
          ) : (
            <ChatPanelEmpty
              onMinimize={toggleChat}
              onClose={closeChat}
            />
          )}
        </Card>
      </div>
    </>
  )
}

// ===== Header =====

function ChatHeader({
  vendorName,
  vendorAvatar,
  isConnected,
  onMinimize,
  onClose,
}: {
  vendorName: string
  vendorAvatar?: string | null
  isConnected?: boolean
  onMinimize: () => void
  onClose: () => void
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30 flex-shrink-0">
      <Avatar className="h-8 w-8">
        <AvatarImage src={vendorAvatar ?? undefined} />
        <AvatarFallback className="text-xs">
          {vendorName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{vendorName}</p>
        {isConnected !== undefined && (
          <div className="flex items-center gap-1">
            <span
              className={cn(
                "inline-block h-1.5 w-1.5 rounded-full",
                isConnected ? "bg-green-500" : "bg-muted-foreground"
              )}
            />
            <span className="text-[10px] text-muted-foreground">
              {isConnected ? "Connected" : "Connecting..."}
            </span>
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 flex-shrink-0"
        onClick={onMinimize}
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 flex-shrink-0"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

// ===== Active chat panel =====

function ChatPanelContent({
  conversationId,
  vendorId,
  currentUserId,
  onMinimize,
  onClose,
}: {
  conversationId: string
  vendorId: string
  currentUserId: string
  onMinimize: () => void
  onClose: () => void
}) {
  const { data: vendor } = useGetAccount(vendorId)
  const { isConnected, lastMessage } = useEventStream()
  const sendMessageMutation = useSendMessage()
  const markReadMutation = useChatMarkRead()
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    data: messagesData,
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListMessages(conversationId, { limit: 50 })

  const messages = useMemo(() => {
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

  const vendorName =
    vendor?.name || vendor?.username || `Vendor #${vendorId.slice(0, 8)}`

  // Mark as read when opened
  useEffect(() => {
    markReadMutation.mutate({ conversation_id: conversationId })
  }, [conversationId])

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, lastMessage])

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
      <ChatHeader
        vendorName={vendorName}
        vendorAvatar={vendor?.avatar_url}
        isConnected={isConnected}
        onMinimize={onMinimize}
        onClose={onClose}
      />

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        {messagesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-1">
            {hasNextPage && (
              <div className="flex justify-center pb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? "Loading..." : "Load older"}
                </Button>
              </div>
            )}

            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-xs text-muted-foreground">
                  Send a message to start the conversation.
                </p>
              </div>
            )}

            {messages.map((message, index) => {
              const isSent = message.sender_id === currentUserId
              const showDate = shouldShowDate(
                message,
                messages[index - 1] ?? null
              )

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="flex items-center justify-center py-2">
                      <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {formatMessageDate(message.date_created)}
                      </span>
                    </div>
                  )}
                  <MessageBubble message={message} isSent={isSent} />
                </div>
              )
            })}

            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t flex-shrink-0">
        <div className="flex items-center gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 h-9 text-sm"
          />
          <Button
            size="icon"
            className="h-9 w-9 flex-shrink-0"
            onClick={handleSend}
            disabled={!inputValue.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  )
}

// ===== Loading state (conversation being created) =====

function ChatPanelLoading({
  vendorId,
  onMinimize,
  onClose,
}: {
  vendorId: string
  onMinimize: () => void
  onClose: () => void
}) {
  const { data: vendor } = useGetAccount(vendorId)
  const vendorName =
    vendor?.name || vendor?.username || `Vendor #${vendorId.slice(0, 8)}`

  return (
    <>
      <ChatHeader
        vendorName={vendorName}
        vendorAvatar={vendor?.avatar_url}
        onMinimize={onMinimize}
        onClose={onClose}
      />
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Starting conversation...
          </p>
        </div>
      </div>
    </>
  )
}

// ===== Empty state (no vendor selected) =====

function ChatPanelEmpty({
  onMinimize,
  onClose,
}: {
  onMinimize: () => void
  onClose: () => void
}) {
  return (
    <>
      <ChatHeader
        vendorName="Chat"
        onMinimize={onMinimize}
        onClose={onClose}
      />
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
          <MessageCircle className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Click &quot;Chat with Seller&quot; on any product or store to start a
          conversation.
        </p>
      </div>
    </>
  )
}

// ===== Message Bubble =====

function MessageBubble({
  message,
  isSent,
}: {
  message: ChatMessage
  isSent: boolean
}) {
  return (
    <div
      className={cn(
        "flex mb-1",
        isSent ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-1.5",
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
              isSent
                ? "text-primary-foreground/70"
                : "text-muted-foreground"
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
}

// ===== Utilities =====

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatMessageDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()

  if (isToday) return "Today"
  if (isYesterday) return "Yesterday"
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

function shouldShowDate(
  current: ChatMessage,
  previous: ChatMessage | null
): boolean {
  if (!previous) return true
  const currentDate = new Date(current.date_created).toDateString()
  const previousDate = new Date(previous.date_created).toDateString()
  return currentDate !== previousDate
}
