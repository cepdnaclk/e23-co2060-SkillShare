// ============================================================
// COMPATIBILITY LAYER
// Re-exports the new modular chat API and types for legacy consumers
// to prevent breaking existing UI files.
// TODO: Migrate all UI consumers to use `src/api/*` directly.
// ============================================================

export * from "@/api/chat.api";

import type {
    RecentChatDto,
    ChatMessageResponse,
    Page,
    ChatMessageDto,
    TypingStatusDto,
} from "@/api/types";

// Legacy Type Aliases
export type RecentChat = RecentChatDto;
export type ChatHistoryMessage = ChatMessageResponse;
export type ChatPage = Page<ChatMessageResponse>;
export type { ChatMessageDto, TypingStatusDto };
