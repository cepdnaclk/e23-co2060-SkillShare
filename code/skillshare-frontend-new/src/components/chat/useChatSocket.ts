// ============================================================
// useChatSocket – Custom hook for STOMP/WebSocket integration
// ============================================================

import { useEffect, useRef, useCallback, useState } from "react";
import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs";
import { getToken } from "@/lib/auth";
import type { ChatMessage, SendMessagePayload } from "./types";

const WS_URL = import.meta.env.VITE_WS_URL ?? "http://localhost:8080/ws";

interface UseChatSocketOptions {
  currentUserId: string | null;
  onMessageReceived: (msg: ChatMessage) => void;
}

interface UseChatSocketReturn {
  sendMessage: (payload: SendMessagePayload) => void;
  connected: boolean;
}

export function useChatSocket({
  currentUserId,
  onMessageReceived,
}: UseChatSocketOptions): UseChatSocketReturn {
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);

  // Bug Fix #6: Use useState so components actually re-render when connection changes.
  // A ref does not trigger re-renders, so `connected` was always stale (always false).
  const [connected, setConnected] = useState(false);

  // Bug Fix #7: Wrap the callback in a ref so that the useEffect below does NOT
  // need to list `onMessageReceived` as a dependency.  Without this, every time
  // FloatingChatWidget re-renders (e.g. when isOpen changes) a new callback identity
  // is passed down, which causes the effect to tear down and re-create the entire
  // WebSocket connection – creating duplicate subscriptions and connection storms.
  const onMessageReceivedRef = useRef(onMessageReceived);
  useEffect(() => {
    onMessageReceivedRef.current = onMessageReceived;
  }, [onMessageReceived]);

  const sendMessage = useCallback((payload: SendMessagePayload) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: "/app/chat",
        body: JSON.stringify(payload),
      });
    } else {
      console.warn("[ChatSocket] Not connected – message not sent:", payload);
    }
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const token = getToken();

    const client = new Client({
      // SockJS factory — works behind proxies / firewalls
      webSocketFactory: () => new SockJS(WS_URL) as WebSocket,

      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },

      reconnectDelay: 5000,

      onConnect: () => {
        setConnected(true);
        console.log("[ChatSocket] Connected");

        // Bug Fix #1: The subscription destination MUST match what the backend
        // broadcasts to.  The backend ChatController does:
        //   String destination = "/user/" + receiverId + "/queue/messages";
        //   messagingTemplate.convertAndSend(destination, chatMessageDto);
        //
        // The old frontend code subscribed to /topic/messages/{id}, which does
        // not exist on the broker – so no message ever arrived.
        //
        // CORRECT topic: /user/{currentUserId}/queue/messages
        subscriptionRef.current = client.subscribe(
          `/user/${currentUserId}/queue/messages`,
          (frame: IMessage) => {
            try {
              const msg: ChatMessage = JSON.parse(frame.body);
              // Invoke through the ref so we always call the latest callback
              // without needing to re-subscribe.
              onMessageReceivedRef.current(msg);
            } catch (e) {
              console.error("[ChatSocket] Failed to parse message:", e);
            }
          }
        );
      },

      onStompError: (frame) => {
        console.error("[ChatSocket] STOMP error:", frame.headers["message"]);
        setConnected(false);
      },

      onDisconnect: () => {
        setConnected(false);
        console.log("[ChatSocket] Disconnected");
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      subscriptionRef.current?.unsubscribe();
      client.deactivate();
      setConnected(false);
    };
    // Only re-run when the user changes (i.e. login / logout).
    // onMessageReceived is intentionally excluded – it is handled via the ref above.
  }, [currentUserId]);

  return { sendMessage, connected };
}
