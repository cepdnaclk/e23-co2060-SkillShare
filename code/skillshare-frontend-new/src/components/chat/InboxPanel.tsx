import { formatDistanceToNow } from "date-fns";
import type { RecentChat } from "@/lib/chatApi";
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
      <div className="px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white tracking-wide">Messages</h3>
        <p className="text-[11px] text-white/50 mt-0.5">Your conversations</p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {isLoadingInbox ? (
          /* Skeleton */
          <div className="p-3 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-white/10 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 rounded bg-white/10 w-2/3" />
                  <div className="h-2.5 rounded bg-white/10 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : inbox.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-10 px-4 text-center">
            <MessageSquare className="w-8 h-8 text-white/20 mb-2" />
            <p className="text-white/40 text-xs leading-relaxed">
              No conversations yet.<br />Connect with mentors to start chatting!
            </p>
          </div>
        ) : (
          <ul className="p-2 space-y-0.5">
            {inbox.map((chat) => (
              <li key={chat.contactId}>
                <button
                  id={`inbox-item-${chat.contactId}`}
                  onClick={() => openChat(chat)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/8 transition-colors text-left group"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {chat.contactProfilePicture ? (
                      <img
                        src={chat.contactProfilePicture}
                        alt={chat.contactName}
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-orange-400 flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
                        {getInitials(chat.contactName)}
                      </div>
                    )}
                    {/* Unread dot */}
                    {chat.unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-violet-500 border-2 border-[#1a1a2e] flex items-center justify-center">
                        <span className="text-[8px] text-white font-bold leading-none">
                          {chat.unreadCount > 9 ? "9" : chat.unreadCount}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="text-[13px] font-medium text-white truncate">
                        {chat.contactName}
                      </span>
                      <span className="text-[10px] text-white/35 flex-shrink-0">
                        {formatTime(chat.lastMessageTime)}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] truncate mt-0.5 ${
                        chat.unreadCount > 0 ? "text-white/80 font-medium" : "text-white/45"
                      }`}
                    >
                      {chat.lastMessage}
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
