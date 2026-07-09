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

  // Only render for authenticated users
  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
      {/* ── Floating Panel ──────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="w-80 h-[480px] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{
              background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow:
                "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            {/* Close button (top-right) */}
            <button
              id="chat-widget-close"
              onClick={closeWidget}
              className="absolute top-3 right-3 z-10 p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Sliding panels container */}
            <div className="relative flex-1 overflow-hidden">
              {/* Inbox panel */}
              <motion.div
                key="inbox"
                animate={{ x: view === "inbox" ? 0 : "-100%" }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
                className="absolute inset-0"
              >
                <InboxPanel isLoadingInbox={isLoadingInbox} inbox={inbox} />
              </motion.div>

              {/* Active chat panel */}
              <motion.div
                key="chat"
                animate={{ x: view === "chat" ? 0 : "100%" }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
                className="absolute inset-0"
              >
                <ActiveChatPanel />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Trigger Button ─────────────────────────────── */}
      <motion.button
        id="chat-fab-button"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={isOpen ? closeWidget : openWidget}
        className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #9333ea 40%, #f97316 100%)",
          boxShadow: "0 8px 32px rgba(124,58,237,0.45), 0 2px 8px rgba(0,0,0,0.3)",
        }}
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
              <X className="w-6 h-6 text-white" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageSquare className="w-6 h-6 text-white" />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Unread notification dot */}
        {!isOpen && totalUnread > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 border-2 border-white text-[9px] font-bold text-white flex items-center justify-center leading-none"
          >
            {totalUnread > 99 ? "99+" : totalUnread}
          </motion.span>
        )}

        {/* Pulse ring when unread and closed */}
        {!isOpen && totalUnread > 0 && (
          <span className="absolute inset-0 rounded-full animate-ping bg-violet-500/30 pointer-events-none" />
        )}
      </motion.button>
    </div>
  );
}
