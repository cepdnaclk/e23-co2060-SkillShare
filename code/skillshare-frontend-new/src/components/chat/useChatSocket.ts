// ============================================================
// useChatSocket – Custom hook for STOMP/WebSocket integration
// ============================================================

import { useEffect, useRef, useCallback } from "react";
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
  const connectedRef = useRef(false);

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
        connectedRef.current = true;
        console.log("[ChatSocket] Connected");

        // Subscribe to the user's personal queue
        subscriptionRef.current = client.subscribe(
          `/topic/messages/${currentUserId}`,
          (frame: IMessage) => {
            try {
              const msg: ChatMessage = JSON.parse(frame.body);
              onMessageReceived(msg);
            } catch (e) {
              console.error("[ChatSocket] Failed to parse message:", e);
            }
          }
        );
      },

      onStompError: (frame) => {
        console.error("[ChatSocket] STOMP error:", frame.headers["message"]);
        connectedRef.current = false;
      },

      onDisconnect: () => {
        connectedRef.current = false;
        console.log("[ChatSocket] Disconnected");
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      subscriptionRef.current?.unsubscribe();
      client.deactivate();
      connectedRef.current = false;
    };
  }, [currentUserId, onMessageReceived]);

  return { sendMessage, connected: connectedRef.current };
}
