import { formatDistanceToNow } from "date-fns";
import type { RecentChatDto as RecentChat } from "@/api/types";
import { useChat } from "@/context/ChatContext";
import { MessageSquare } from "lucide-react";

function getInitials(name: string) {
  return name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: false })
      .replace("less than a minute", "now")
      .replace("about ", "")
      .replace(" minutes", "m")
      .replace(" minute", "m")
      .replace(" hours", "h")
      .replace(" hour", "h")
      .replace(" days", "d")
      .replace(" day", "d");
  } catch {
    return "";
  }
}

interface InboxPanelProps {
  isLoadingInbox: boolean;
  inbox: RecentChat[];
}

export default function InboxPanel({ isLoadingInbox, inbox }: InboxPanelProps) {
  const { openChat } = useChat();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50 shrink-0">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">Messages</h3>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {isLoadingInbox ? (
          /* Skeleton */
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-secondary shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 rounded-full bg-secondary w-2/3" />
                  <div className="h-2.5 rounded-full bg-secondary w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : inbox.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">
              Select a conversation.
            </p>
          </div>
        ) : (
          <ul className="p-2 space-y-0.5">
            {inbox.map((chat) => (
              <li key={chat.contactId}>
                <button
                  id={`inbox-item-${chat.contactId}`}
                  onClick={() => openChat(chat)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/60 transition-colors text-left group"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {chat.contactProfilePicture ? (
                      <img
                        src={chat.contactProfilePicture}
                        alt={chat.contactName}
                        className="w-10 h-10 rounded-full object-cover border border-border/50"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-secondary border border-border/50 flex items-center justify-center text-xs font-semibold text-foreground">
                        {getInitials(chat.contactName)}
                      </div>
                    )}
                    {/* Unread dot */}
                    {chat.unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                        <span className="text-[9px] text-primary-foreground font-bold leading-none">
                          {chat.unreadCount > 9 ? "9" : chat.unreadCount}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className={`text-sm truncate pr-2 ${chat.unreadCount > 0 ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
                        {chat.contactName}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                        {formatTime(chat.lastMessageTime)}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${chat.unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                      {chat.lastMessageContent || "Started a conversation"}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
