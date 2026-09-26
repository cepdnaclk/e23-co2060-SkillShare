import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import type { ChatMessageDto, ChatMessageResponse, RecentChatDto } from "@/api/types";
import { ChatProvider, useChat } from "./ChatContext";

const mocks = vi.hoisted(() => ({
  user: { id: "sender" },
  getHistory: vi.fn(), getRecentChats: vi.fn(), getUnreadCount: vi.fn(), markAsRead: vi.fn(),
  onMessage: vi.fn(), sendMessage: vi.fn(),
}));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: mocks.user, token: "test" }) }));
vi.mock("@/api/chat.api", () => ({ chatApi: mocks }));
vi.mock("@/services/chatSocketService", () => ({ chatSocketService: {
  connect: vi.fn(), disconnect: vi.fn(), onMessage: mocks.onMessage,
  onTyping: () => () => {}, sendMessage: mocks.sendMessage,
} }));

const contact: RecentChatDto = {
  contactId: "receiver", contactName: "Receiver", contactProfilePicture: "",
  lastMessage: "", lastMessageTime: "2026-09-26T02:37:00Z", unreadCount: 0,
};
const saved: ChatMessageResponse = {
  id: "saved-id", senderId: "sender", receiverId: "receiver", content: "Hello",
  timestamp: "2026-09-26T02:37:00Z", isRead: false,
};
let receive: (dto: ChatMessageDto) => void;
const wrapper = ({ children }: { children: ReactNode }) => <ChatProvider>{children}</ChatProvider>;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getRecentChats.mockResolvedValue([contact]);
  mocks.getUnreadCount.mockResolvedValue(0);
  mocks.markAsRead.mockResolvedValue(undefined);
  mocks.getHistory.mockResolvedValue({ content: [] });
  mocks.onMessage.mockImplementation((handler: typeof receive) => { receive = handler; return () => {}; });
  vi.stubGlobal("crypto", { randomUUID: () => "optimistic-id" });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("chat timestamp lifecycle", () => {
  it("replaces optimistic time with saved time and preserves it after history reload and remount", async () => {
    const first = renderHook(useChat, { wrapper });
    await act(async () => { first.result.current.openChat(contact); });
    await waitFor(() => expect(first.result.current.activeConversation?.isLoadingHistory).toBe(false));
    act(() => first.result.current.sendMessage("Hello"));
    expect(first.result.current.activeConversation?.messages[0].timestamp).toMatch(/Z$/);
    expect(mocks.sendMessage).toHaveBeenCalledWith(expect.objectContaining({ clientMessageId: "optimistic-id" }));
    await act(async () => { receive({ ...saved, clientMessageId: "optimistic-id" }); });
    expect(first.result.current.activeConversation?.messages).toEqual([saved]);
    // Duplicate acknowledgements must not duplicate the message.
    await act(async () => { receive({ ...saved, clientMessageId: "optimistic-id" }); });
    expect(first.result.current.activeConversation?.messages).toEqual([saved]);
    mocks.getHistory.mockResolvedValue({ content: [saved] });
    await act(async () => { first.result.current.openChat(contact); });
    expect(first.result.current.activeConversation?.messages).toEqual([saved]);
    first.unmount();
    const refreshed = renderHook(useChat, { wrapper });
    await act(async () => { refreshed.result.current.openChat(contact); });
    expect(refreshed.result.current.activeConversation?.messages).toEqual([saved]);
    const time = new Date(refreshed.result.current.activeConversation!.messages[0].timestamp);
    expect(time.toLocaleTimeString("en-US", { timeZone: "Asia/Colombo", hour: "numeric", minute: "2-digit" })).toBe("8:07 AM");
    expect(time.toLocaleTimeString("en-US", { timeZone: "UTC", hour: "numeric", minute: "2-digit" })).toBe("2:37 AM");
  });

  it("uses the server instant for received WebSocket messages", async () => {
    const { result } = renderHook(useChat, { wrapper });
    await act(async () => { result.current.openChat(contact); });
    await act(async () => { receive({ ...saved, senderId: "receiver", receiverId: "sender" }); });
    expect(result.current.activeConversation?.messages[0].timestamp).toBe(saved.timestamp);
    expect(result.current.activeConversation?.messages[0].id).toBe(saved.id);
  });
});
