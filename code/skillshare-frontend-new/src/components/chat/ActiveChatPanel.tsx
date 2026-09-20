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
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 shrink-0">
        <button
          id="chat-back-btn"
          onClick={backToInbox}
          className="p-1.5 -ml-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground shrink-0"
          aria-label="Back to inbox"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Contact avatar */}
        <div className="relative shrink-0">
          {contactPicture ? (
            <img
              src={contactPicture}
              alt={contactName}
              className="w-8 h-8 rounded-full object-cover border border-border/50"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-secondary border border-border/50 flex items-center justify-center text-xs font-semibold text-foreground">
              {getInitials(contactName)}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate leading-tight">
            {contactName}
          </p>
          {isTyping && (
            <p className="text-[10px] text-muted-foreground leading-tight">
              typing...
            </p>
          )}
        </div>
      </div>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 space-y-3 min-h-0 custom-scrollbar">
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-xs text-center">
              No messages yet.<br />Say hello!
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg: ChatHistoryMessage, index: number) => {
              const isOutgoing = (msg.senderId || msg.sender?.id) === user?.id;
              
              // Only show timestamp if it's the last message in a cluster or more than 5 mins apart
              const nextMsg = messages[index + 1];
              const showTime = !nextMsg || next(msg.senderId || msg.sender?.id) !== (msg.senderId || msg.sender?.id) || 
                (new Date(nextMsg.timestamp).getTime() - new Date(msg.timestamp).getTime() > 300000);

              return (
                <div
                  key={msg.id}
                  className={`flex w-full ${isOutgoing ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-[80%] flex flex-col">
                    <div
                      className={`px-3.5 py-2 text-[13px] leading-relaxed shadow-sm break-words whitespace-pre-wrap ${
                        isOutgoing
                          ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                          : "bg-secondary text-foreground rounded-2xl rounded-tl-sm border border-border/50"
                      }`}
                    >
                      {msg.content}
                    </div>
                    {showTime && (
                      <p
                        className={`text-[9px] mt-1 text-muted-foreground ${
                          isOutgoing ? "text-right mr-1" : "text-left ml-1"
                        }`}
                      >
                        {formatMsgTime(msg.timestamp)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing indicator bubble */}
            {isTyping && (
              <div className="flex justify-start w-full">
                <div className="bg-secondary border border-border/50 px-3 py-2.5 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-1" />
          </>
        )}
      </div>

      {/* Composer */}
      <div className="p-3 border-t border-border/50 shrink-0 bg-background">
        <div className="flex items-end gap-2 relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-secondary text-foreground text-sm rounded-xl px-4 py-2.5 min-h-[40px] max-h-[120px] focus:outline-none focus:ring-1 focus:ring-primary/30 border border-transparent focus:border-border transition-all placeholder:text-muted-foreground/60"
          />
          <Button
            size="icon"
            onClick={handleSend} aria-label="Send message"
            disabled={!inputValue.trim()}
            className="shrink-0 h-10 w-10 rounded-xl"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
