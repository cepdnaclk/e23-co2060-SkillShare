import { Client, type IMessage } from "@stomp/stompjs";
import type { ChatMessageDto, TypingStatusDto } from "@/lib/chatApi";

const WS_URL = `${import.meta.env.VITE_API_URL.replace(/^http/, "ws")}/ws`;

type MessageHandler = (msg: ChatMessageDto) => void;
type TypingHandler = (status: TypingStatusDto) => void;

class ChatSocketService {
  private client: Client | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private typingHandlers: Set<TypingHandler> = new Set();
  private connected = false;

  connect(token: string): void {
    if (this.client?.active) return;

    this.client = new Client({
      brokerURL: WS_URL,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      debug: (str) => {
        console.warn(`[STOMP Debug] ${str}`);
      },
      onConnect: () => {
        this.connected = true;
        console.log("[ChatSocket] Connected to STOMP broker.");

        this.client!.subscribe("/user/queue/messages", (frame: IMessage) => {
          try {
            console.warn("🔔 [ChatSocket] RAW MESSAGE RECEIVED:", frame.body);
            const msg: ChatMessageDto = JSON.parse(frame.body);
            console.warn("🔔 [ChatSocket] PARSED MESSAGE:", msg);
            this.messageHandlers.forEach((h) => h(msg));
          } catch (e) {
            console.warn("[ChatSocket] Failed to parse incoming message", frame.body, e);
          }
        });

        this.client!.subscribe("/user/queue/typing", (frame: IMessage) => {
          try {
            const status: TypingStatusDto = JSON.parse(frame.body);
            this.typingHandlers.forEach((h) => h(status));
          } catch {
            console.warn("[ChatSocket] Failed to parse typing status", frame.body);
          }
        });
      },
      onDisconnect: () => {
        this.connected = false;
        console.log("[ChatSocket] Disconnected.");
      },
      onStompError: (frame) => {
        console.error("[ChatSocket] STOMP error:", frame.headers["message"]);
      },
    });

    this.client.activate();
  }

  disconnect(): void {
    if (this.client?.active) {
      this.client.deactivate();
    }
    this.client = null;
    this.connected = false;
  }

  sendMessage(dto: ChatMessageDto): void {
    if (!this.client?.active) {
      console.warn("[ChatSocket] Cannot send — not connected.");
      return;
    }
    this.client.publish({
      destination: "/app/chat",
      body: JSON.stringify(dto),
    });
  }

  sendTyping(dto: TypingStatusDto): void {
    if (!this.client?.active) return;
    this.client.publish({
      destination: "/app/chat/typing",
      body: JSON.stringify(dto),
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onTyping(handler: TypingHandler): () => void {
    this.typingHandlers.add(handler);
    return () => this.typingHandlers.delete(handler);
  }
}

export const chatSocketService = new ChatSocketService();
