import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import { ArrowLeft, Send } from "lucide-react";
import { format } from "date-fns";
import type { ChatMessageResponse as ChatHistoryMessage } from "@/api/types";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/context/AuthContext";
import { chatSocketService } from "@/services/chatSocketService";

function getInitials(name: string) {
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "?"
  );
}

function formatMsgTime(iso: string): string {
  try {
    return format(new Date(iso), "h:mm a");
  } catch {
    return "";
  }
}

// Typing debounce delay in ms
const TYPING_DEBOUNCE = 1000;

export default function ActiveChatPanel() {
  const { activeConversation, backToInbox, sendMessage } = useChat();
  const { user } = useAuth();

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages, activeConversation?.isTyping]);

  // Focus input when panel opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue("");
    inputRef.current?.focus();
  }, [inputValue, sendMessage]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    // Send "isTyping: true" immediately
    if (user && activeConversation) {
      chatSocketService.sendTyping({
        senderId: user.id,
        receiverId: activeConversation.contactId,
        isTyping: true,
      });

      // Debounce "isTyping: false"
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (user && activeConversation) {
          chatSocketService.sendTyping({
            senderId: user.id,
            receiverId: activeConversation.contactId,
            isTyping: false,
          });
        }
      }, TYPING_DEBOUNCE);
    }
  };

  if (!activeConversation) return null;

  const { contactName, contactPicture, messages, isLoadingHistory, isTyping } =
    activeConversation;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-3 border-b border-border shrink-0 bg-background">
        <button
          id="chat-back-btn"
          onClick={backToInbox}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
          aria-label="Back to inbox"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Contact avatar */}
        {contactPicture ? (
          <img
            src={contactPicture}
            alt={contactName}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-border flex-shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
            {getInitials(contactName)}
          </div>
        )}

        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-foreground truncate leading-tight">
            {contactName}
          </p>
          {isTyping && (
            <p className="text-[10px] text-primary leading-tight animate-pulse">
              typing…
            </p>
          )}
        </div>
      </div>

      {/* Message area - Added overflow-x-hidden here */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-3 space-y-1.5 min-h-0 bg-background">
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary/30 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-xs text-center">
              No messages yet.
              <br />
              Say hello! 👋
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg: ChatHistoryMessage) => {
              const isOutgoing = msg.sender.id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex w-full ${isOutgoing ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-[75%]">
                    {/* Added break-words and whitespace-pre-wrap to force text wrapping */}
                    <div
                      className={`px-3 py-2 rounded-2xl text-[12px] leading-relaxed shadow-sm break-words whitespace-pre-wrap ${
                        isOutgoing
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <p
                      className={`text-[9px] mt-0.5 text-muted-foreground ${
                        isOutgoing ? "text-right" : "text-left"
                      }`}
                    >
                      {formatMsgTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator bubble */}
            {isTyping && (
              <div className="flex justify-start w-full">
                <div className="bg-muted px-3 py-2 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input footer */}
      <div className="px-3 pb-3 pt-2 border-t border-border shrink-0 bg-background">
        <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2 border border-border focus-within:border-primary/50 transition-colors">
          <input
            ref={inputRef}
            id="chat-message-input"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            className="flex-1 min-w-0 bg-transparent text-[12px] text-foreground placeholder-muted-foreground outline-none"
            autoComplete="off"
          />
          <button
            id="chat-send-btn"
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex-shrink-0"
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
