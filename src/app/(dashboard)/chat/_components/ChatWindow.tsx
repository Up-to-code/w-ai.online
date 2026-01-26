"use client"

import { useEffect } from "react"
import { useUserMutation } from "@/hooks/useUserMutation"
import { api } from "@convex/_generated/api"
import { MessageList } from "./MessageList"
import { ConversationHeader } from "./ConversationHeader"
import { ChatInput } from "./ChatInput"
import { logger } from "@/lib/logger"

interface ChatWindowProps {
  chatId: string
}

export function ChatWindow({ chatId }: ChatWindowProps) {
  const markAsRead = useUserMutation(api.chat.markAsRead)

  // Instant Read Effect
  useEffect(() => {
    if (chatId) {
      markAsRead({ chatId: chatId as any }).catch((e) => logger.error("markAsRead failed", e))
    }
  }, [chatId, markAsRead])

  return (
    <div className="flex flex-col h-full bg-[#efeae2] dark:bg-[#0b141a] relative">
      {/* Header */}
      <ConversationHeader chatId={chatId} />

      {/* Messages */}
      <MessageList chatId={chatId} />

      {/* Input Area */}
      <ChatInput chatId={chatId} />
    </div>
  )
}
