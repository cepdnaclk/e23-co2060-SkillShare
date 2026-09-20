import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, X } from "lucide-react";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/context/AuthContext";
import InboxPanel from "./InboxPanel";
import ActiveChatPanel from "./ActiveChatPanel";

export default function FloatingChatWidget() {
  const { user } = useAuth();
  const {
    isOpen,
    view,
    inbox,
    totalUnread,
    isLoadingInbox,
    openWidget,
    closeWidget,
  } = useChat();

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4">
      {/* Floating Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "tween", duration: 0.2 }}
            className="w-[calc(100vw-3rem)] sm:w-[340px] h-[520px] max-h-[calc(100vh-8rem)] rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-background border border-border"
          >
            {/* Close button (top-right) */}
            <button
              id="chat-widget-close"
              onClick={closeWidget}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full text-muted-foreground hover:bg-secondary transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Sliding panels container */}
            <div className="relative flex-1 overflow-hidden">
              {/* Inbox panel */}
              <motion.div
                key="inbox"
                animate={{ x: view === "inbox" ? 0 : "-100%" }}
                transition={{ type: "tween", duration: 0.25 }}
                className="absolute inset-0 bg-background"
              >
                <InboxPanel isLoadingInbox={isLoadingInbox} inbox={inbox} />
              </motion.div>

              {/* Active chat panel */}
              <motion.div
                key="chat"
                animate={{ x: view === "chat" ? 0 : "100%" }}
                transition={{ type: "tween", duration: 0.25 }}
                className="absolute inset-0 bg-background"
              >
                <ActiveChatPanel />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button */}
      <button
        id="chat-fab-button"
        onClick={isOpen ? closeWidget : openWidget}
        className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageSquare className="w-6 h-6" />
            </motion.span>
          )}
        </AnimatePresence>
        
        {/* Unread dot */}
        {!isOpen && totalUnread > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 border-2 border-background flex items-center justify-center">
            <span className="text-[9px] text-white font-bold leading-none">
              {totalUnread > 9 ? "9" : totalUnread}
            </span>
          </span>
        )}
      </button>
    </div>
  );
}
