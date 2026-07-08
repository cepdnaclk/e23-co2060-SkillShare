// ============================================================
// ActiveChatView – Level 2: Full message thread + input footer
// ============================================================

import React, { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import type { ChatContact, ChatMessage, SendMessagePayload } from "./types";
import { chatApi } from "./chatApi";
import { ChatAvatar } from "./ChatAvatar";

interface ActiveChatViewProps {
  contact: ChatContact;
  currentUserId: string;
  onBack: () => void;
  /** Called by parent to push new incoming messages from the WebSocket */
  incomingMessage: ChatMessage | null;
  /** Parent-level send function that also publishes via WebSocket */
  onSend: (payload: SendMessagePayload) => void;
}

function formatMessageTime(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export const ActiveChatView: React.FC<ActiveChatViewProps> = ({
  contact,
  currentUserId,
  onBack,
  incomingMessage,
  onSend,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Scroll to bottom whenever messages update ──
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // ── Fetch history & mark as read on mount / contact change ──
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setLoading(true);
      try {
        const history = await chatApi.getChatHistory(contact.id);
        if (!cancelled) {
          setMessages(history);
        }
      } catch (err) {
        console.error("[ActiveChatView] Failed to fetch history:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }

      // Fire-and-forget mark as read
      chatApi.markAsRead(contact.id).catch(() => {});
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [contact.id]);

  // ── Focus input on open ──
  useEffect(() => {
    if (!loading) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [loading]);

  // ── Scroll when messages update ──
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ── Receive incoming WebSocket messages ──
  useEffect(() => {
    if (
      incomingMessage &&
      (incomingMessage.senderId === contact.id ||
        incomingMessage.receiverId === contact.id)
    ) {
      setMessages((prev) => {
        // Deduplicate by id
        if (prev.some((m) => m.id === incomingMessage.id)) return prev;
        return [...prev, incomingMessage];
      });
    }
  }, [incomingMessage, contact.id]);

  // ── Handle send ──
  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content || isSending) return;

    setIsSending(true);
    setInputValue("");

    const payload: SendMessagePayload = {
      senderId: currentUserId,
      receiverId: contact.id,
      content,
    };

    // Optimistic append to local state
    const optimisticMsg: ChatMessage = {
      id: `optimistic-${Date.now()}`,
      senderId: currentUserId,
      receiverId: contact.id,
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    // Publish via WebSocket
    onSend(payload);

    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-3 py-3 border-b border-gray-700/60 flex-shrink-0">
        {/* Back button */}
        <button
          id="chat-back-button"
          onClick={onBack}
          className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-200 flex-shrink-0"
          title="Back to inbox"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Contact info */}
        <ChatAvatar
          name={contact.name}
          avatarUrl={contact.avatarUrl}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate leading-tight">
            {contact.name}
          </p>
          <p className="text-[11px] text-emerald-400 leading-tight">Online</p>
        </div>
      </div>

      {/* ── Message Area ── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 custom-scroll">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-orange-500/20 flex items-center justify-center">
              <ChatAvatar name={contact.name} avatarUrl={contact.avatarUrl} size="sm" />
            </div>
            <p className="text-gray-400 text-sm">
              Say hi to <span className="text-violet-400 font-medium">{contact.name}</span>!
            </p>
          </div>
        )}

        {!loading &&
          messages.map((msg) => {
            const isOwn = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}
              >
                {/* Incoming: show avatar */}
                {!isOwn && (
                  <div className="mr-2 flex-shrink-0 self-end">
                    <ChatAvatar
                      name={contact.name}
                      avatarUrl={contact.avatarUrl}
                      size="sm"
                    />
                  </div>
                )}

                <div
                  className={`max-w-[75%] flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                      isOwn
                        ? "bg-gradient-to-r from-violet-500 to-orange-500 text-white rounded-br-sm"
                        : "bg-gray-800 text-gray-100 rounded-bl-sm border border-gray-700/50"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {/* Timestamp */}
                  <span className="text-[10px] text-gray-600 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {formatMessageTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            );
          })}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Footer Input ── */}
      <div className="flex-shrink-0 px-3 py-3 border-t border-gray-700/60">
        <div className="flex items-center gap-2 bg-gray-800 rounded-2xl px-3 py-1.5 border border-gray-700/60 focus-within:border-violet-500/60 transition-colors duration-200">
          <input
            id="chat-message-input"
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            maxLength={1000}
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none py-1"
          />
          <button
            id="chat-send-button"
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending || loading}
            className={`p-1.5 rounded-full transition-all duration-200 flex-shrink-0 ${
              inputValue.trim() && !isSending
                ? "bg-gradient-to-r from-violet-500 to-orange-500 text-white hover:shadow-lg hover:shadow-violet-500/30 hover:scale-105"
                : "text-gray-600 cursor-not-allowed"
            }`}
            title="Send message"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
