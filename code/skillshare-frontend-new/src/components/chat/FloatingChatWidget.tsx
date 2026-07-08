// ============================================================
// FloatingChatWidget – The orchestrator component
// Renders: FAB → Widget Container → InboxView ↔ ActiveChatView
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from "react";
import { MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/context/AuthContext";
import { chatApi } from "./chatApi";
import { useChatSocket } from "./useChatSocket";
import { InboxView } from "./InboxView";
import { ActiveChatView } from "./ActiveChatView";
import type { ChatContact, ChatMessage, ChatView, SendMessagePayload } from "./types";

// ── Animation variants ──────────────────────────────────────
const widgetVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    y: 20,
    transition: { duration: 0.18 },
  },
};

const inboxVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
  center: { x: 0, opacity: 1, transition: { duration: 0.28, ease: "easeOut" } },
  exit: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
    transition: { duration: 0.22, ease: "easeIn" },
  }),
};

// ── Main Component ───────────────────────────────────────────
export const FloatingChatWidget: React.FC = () => {
  const { user, token } = useAuth();

  // ── Widget open/close ──
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<ChatView>("inbox");
  const [slideDirection, setSlideDirection] = useState(1); // 1 = left, -1 = right

  // ── Selected conversation ──
  const [activeContact, setActiveContact] = useState<ChatContact | null>(null);

  // ── Unread badge count ──
  const [unreadCount, setUnreadCount] = useState(0);

  // ── Incoming WS messages queue ──
  const [latestIncoming, setLatestIncoming] = useState<ChatMessage | null>(null);

  // ── Ref to hold the unread count fetch interval ──
  const unreadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch initial unread count ──
  useEffect(() => {
    if (!token || !user) return;

    const fetchUnread = async () => {
      try {
        const count = await chatApi.getUnreadCount();
        setUnreadCount(count);
      } catch {
        // silent – don't interrupt the UI
      }
    };

    fetchUnread();

    // Poll every 30s when widget is closed
    unreadIntervalRef.current = setInterval(fetchUnread, 30_000);

    return () => {
      if (unreadIntervalRef.current) clearInterval(unreadIntervalRef.current);
    };
  }, [token, user]);

  // ── Handle incoming WebSocket message ──
  const handleIncomingMessage = useCallback((msg: ChatMessage) => {
    setLatestIncoming(msg);

    // Bump unread count only if the widget is closed or we're in inbox
    setUnreadCount((prev) => {
      if (!isOpen) return prev + 1;
      return prev; // If we're in active view, mark-read fires separately
    });
  }, [isOpen]);

  // ── WebSocket hook ──
  const { sendMessage } = useChatSocket({
    currentUserId: user?.id ?? null,
    onMessageReceived: handleIncomingMessage,
  });

  // ── Navigation handlers ──
  const openInbox = useCallback(() => {
    setSlideDirection(-1);
    setView("inbox");
    setActiveContact(null);
  }, []);

  const openChat = useCallback((contact: ChatContact) => {
    setActiveContact(contact);
    setSlideDirection(1);
    setView("active");
    // When entering chat, clear unread for that contact
    setUnreadCount((prev) => Math.max(0, prev - (contact.unreadCount ?? 0)));
  }, []);

  // ── Toggle widget ──
  const toggleWidget = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) {
        // When opening, reset to inbox
        setView("inbox");
        setActiveContact(null);
      } else {
        // When closing, reset unread (user presumably saw the widget)
        // Optionally reset unread here or leave it to next poll
      }
      return !prev;
    });
  }, []);

  // ── Send message handler (WebSocket publish) ──
  const handleSend = useCallback(
    (payload: SendMessagePayload) => {
      sendMessage(payload);
    },
    [sendMessage]
  );

  // Don't render if user is not authenticated
  if (!user || !token) return null;

  return (
    <>
      {/* ─────────────── Chat Widget ─────────────── */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="chat-widget"
            variants={widgetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed bottom-24 right-6 z-[9998] w-80 h-[500px] rounded-2xl overflow-hidden shadow-2xl shadow-violet-500/20 border border-gray-700/50 flex flex-col"
            style={{ willChange: "transform, opacity" }}
            role="dialog"
            aria-label="Skill-Connect Chat"
          >
            {/* Animated view switcher */}
            <div className="relative flex-1 overflow-hidden">
              <AnimatePresence custom={slideDirection} mode="wait">
                {view === "inbox" ? (
                  <motion.div
                    key="inbox"
                    custom={slideDirection}
                    variants={inboxVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="absolute inset-0"
                  >
                    <InboxView onSelectContact={openChat} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="active"
                    custom={slideDirection}
                    variants={inboxVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="absolute inset-0"
                  >
                    {activeContact && (
                      <ActiveChatView
                        contact={activeContact}
                        currentUserId={user.id}
                        onBack={openInbox}
                        incomingMessage={latestIncoming}
                        onSend={handleSend}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────── FAB ─────────────── */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <motion.button
          id="chat-fab-button"
          onClick={toggleWidget}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl shadow-violet-500/40 outline-none focus-visible:ring-4 focus-visible:ring-violet-500/50 transition-all duration-300 ${
            isOpen
              ? "bg-gray-800 border border-gray-600"
              : "bg-gradient-to-br from-violet-500 to-orange-500"
          }`}
          aria-label={isOpen ? "Close chat" : "Open chat"}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close-icon"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <X className="w-6 h-6 text-gray-200" />
              </motion.div>
            ) : (
              <motion.div
                key="open-icon"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <MessageCircle className="w-6 h-6 text-white" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Unread notification badge ── */}
          <AnimatePresence>
            {!isOpen && unreadCount > 0 && (
              <motion.span
                key="unread-badge"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 rounded-full border-2 border-gray-900 flex items-center justify-center text-[10px] text-white font-bold leading-none"
                aria-label={`${unreadCount} unread messages`}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>

          {/* ── Pulse ring when there are unread messages ── */}
          {!isOpen && unreadCount > 0 && (
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-orange-500 animate-ping opacity-20 pointer-events-none" />
          )}
        </motion.button>
      </div>
    </>
  );
};

export default FloatingChatWidget;
