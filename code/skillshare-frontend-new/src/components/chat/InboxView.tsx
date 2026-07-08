// ============================================================
// InboxView – Level 1: Scrollable list of recent conversations
// ============================================================

import React, { useEffect, useRef, useState, useCallback } from "react";
import { MessageSquare, RefreshCw } from "lucide-react";
import type { ChatContact } from "./types";
import { chatApi } from "./chatApi";
import { ChatAvatar } from "./ChatAvatar";

interface InboxViewProps {
  onSelectContact: (contact: ChatContact) => void;
  /**
   * Contacts the parent already knows about (e.g. recently sent a message to).
   * Displayed instantly so the inbox never shows "No conversations yet" while
   * the server fetch is in flight.  The fetch result is merged on top and
   * deduplicates by contact id.
   */
  initialContacts?: ChatContact[];
  /**
   * Fired after every successful server fetch so the parent can keep its
   * cache in sync with the latest server data.
   */
  onContactsLoaded?: (contacts: ChatContact[]) => void;
}

function formatTime(isoOrFormatted: string): string {
  try {
    const date = new Date(isoOrFormatted);
    if (isNaN(date.getTime())) return isoOrFormatted;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d`;
  } catch {
    return isoOrFormatted;
  }
}

export const InboxView: React.FC<InboxViewProps> = ({
  onSelectContact,
  initialContacts,
  onContactsLoaded,
}) => {
  // Seed with whatever the parent already knows; avoids a blank flash.
  const [contacts, setContacts] = useState<ChatContact[]>(initialContacts ?? []);

  // Only show the skeleton when we have nothing at all to display yet.
  // If initialContacts was provided we show them immediately and
  // silently refresh in the background.
  const [loading, setLoading] = useState<boolean>(
    !initialContacts || initialContacts.length === 0
  );
  const [error, setError] = useState<string | null>(null);

  // Keep a ref to onContactsLoaded so the fetch can call the latest version
  // without needing it as a dependency of fetchRecent.
  const onContactsLoadedRef = useRef(onContactsLoaded);
  useEffect(() => {
    onContactsLoadedRef.current = onContactsLoaded;
  }, [onContactsLoaded]);

  const fetchRecent = useCallback(async (showSkeleton = false) => {
    if (showSkeleton) setLoading(true);
    setError(null);
    try {
      const fresh = await chatApi.getRecentConversations();

      // Merge: server data wins for contacts it returns; any cached contacts
      // NOT in the server response are appended at the end so the user can
      // still see and click them (the server might be slow to flush).
      setContacts((prev) => {
        const serverIds = new Set(fresh.map((c) => c.id));
        const localOnly = prev.filter((c) => c.id !== "" && !serverIds.has(c.id));
        const merged = [...fresh, ...localOnly];
        // Bubble up the fully merged list to the parent cache
        onContactsLoadedRef.current?.(merged);
        return merged;
      });
    } catch (err) {
      console.error("[InboxView] Failed to fetch recent conversations:", err);
      // Only show the error banner if we have nothing else to display
      setContacts((prev) => {
        if (prev.length === 0) setError("Failed to load conversations.");
        return prev;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Always fetch on mount; the skeleton only shows when there's nothing cached.
  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  // Clicking the refresh button always shows the skeleton so the user gets
  // clear feedback that something is happening.
  const handleManualRefresh = useCallback(() => {
    setContacts([]);
    setError(null);
    fetchRecent(true);
  }, [fetchRecent]);

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/60">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-violet-400" />
          <h2 className="text-white font-semibold text-base tracking-tight">
            Messages
          </h2>
        </div>
        <button
          id="chat-inbox-refresh"
          onClick={handleManualRefresh}
          disabled={loading}
          className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-200 disabled:opacity-40"
          title="Refresh conversations"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto custom-scroll">
        {/* Loading skeleton – only shown when there's nothing cached yet */}
        {loading && contacts.length === 0 && (
          <div className="space-y-1 p-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gray-700 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-700 rounded animate-pulse w-32" />
                  <div className="h-2.5 bg-gray-700/60 rounded animate-pulse w-48" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state – only shown when we have nothing else to display */}
        {!loading && error && contacts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
            <p className="text-gray-400 text-sm">{error}</p>
            <button
              onClick={handleManualRefresh}
              className="text-violet-400 text-xs underline hover:text-violet-300 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state – only shown when loading finished AND nothing cached */}
        {!loading && !error && contacts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-gray-600" />
            </div>
            <p className="text-gray-400 text-sm">No conversations yet.</p>
            <p className="text-gray-600 text-xs">
              Start chatting by visiting a user's profile.
            </p>
          </div>
        )}

        {/* Conversation list */}
        {contacts.length > 0 && (
          <ul className="p-2 space-y-0.5">
            {contacts.map((contact) => (
              <li key={contact.id}>
                <button
                  id={`chat-contact-${contact.id}`}
                  onClick={() => onSelectContact(contact)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-800/80 active:bg-gray-700/60 transition-all duration-200 text-left group"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <ChatAvatar
                      name={contact.name}
                      avatarUrl={contact.avatarUrl}
                      size="md"
                    />
                    {/* Unread dot on avatar */}
                    {contact.unreadCount && contact.unreadCount > 0 ? (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-violet-500 rounded-full border-2 border-gray-900 flex items-center justify-center text-[9px] text-white font-bold">
                        {contact.unreadCount > 9 ? "9+" : contact.unreadCount}
                      </span>
                    ) : null}
                  </div>

                  {/* Text content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-sm font-medium truncate transition-colors ${
                          contact.unreadCount && contact.unreadCount > 0
                            ? "text-white"
                            : "text-gray-200 group-hover:text-white"
                        }`}
                      >
                        {contact.name}
                      </span>
                      <span className="text-[11px] text-gray-500 flex-shrink-0">
                        {formatTime(contact.lastMessageTime)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 truncate mt-0.5 leading-snug">
                      {contact.lastMessage}
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
};
