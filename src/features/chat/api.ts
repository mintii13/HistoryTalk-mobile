import { authApi } from "@/features/auth/api";
import { reportPlatformLock } from "@/features/auth/platform-lock";
import { useAuthStore } from "@/features/auth/store";
import { ApiError, BASE_URL, apiClient, errorCodeOf, stripErrorCode } from "@/lib/api-client";

import type {
  ChatHistoryGroup,
  ChatMessageType,
  ChatSession,
  CreateSessionResponse,
  SendMessageResponse,
  SessionMessagesResponse,
} from "./types";

async function authedHeaders(extra?: HeadersInit) {
  const token = useAuthStore.getState().accessToken;
  return {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

function readSsePayload(chunk: string): string[] {
  return chunk
    .split(/\n\n+/)
    .flatMap((event) =>
      event
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.replace(/^data:\s?/, "").trim()),
    )
    .filter(Boolean);
}

/**
 * BE gui tung su kien JSON: {type:"text",data} | {type:"metadata",data:{...}} |
 * {type:"error",message} | {type:"done",remainingTokens} (giong web chat.service).
 * Chi "text" la noi dung tra loi; "error" la loi AI — khong duoc noi vao bong chat.
 */
function readTokenFromPayload(data: string): string {
  if (!data || data === "[DONE]") return "";

  let parsed: any;
  try {
    parsed = JSON.parse(data);
  } catch {
    return data;
  }
  if (typeof parsed === "string") return parsed;
  if (parsed?.success === false || parsed?.type === "error") {
    throw new Error(parsed.message ?? "Nhân vật tạm thời không trả lời được. Vui lòng thử lại.");
  }
  if (parsed?.type === "text") return typeof parsed.data === "string" ? parsed.data : "";
  if (parsed?.type) return ""; // metadata / done
  if (typeof parsed?.content === "string") return parsed.content;
  if (typeof parsed?.assistantMessage?.content === "string") return parsed.assistantMessage.content;
  return "";
}

function readTextFromSse(raw: string, onToken?: (token: string) => void) {
  let assistantText = "";
  const payloads = readSsePayload(raw);
  const values = payloads.length > 0 ? payloads : [raw];

  for (const data of values) {
    const token = readTokenFromPayload(data);
    if (!token) continue;
    assistantText += token;
    onToken?.(token);
  }

  return assistantText;
}

export const chatApi = {
  getHistory: () => apiClient<ChatHistoryGroup[]>('/chat/history'),

  createSession: (characterId: string, contextId: string) =>
    apiClient<CreateSessionResponse>("/chat/sessions", {
      method: "POST",
      body: JSON.stringify({ characterId, contextId }),
    }),

  getMessages: (sessionId: string) =>
    apiClient<SessionMessagesResponse>(`/chat/sessions/${sessionId}/messages`),

  sendMessage: (
    sessionId: string,
    content: string,
    messageType: ChatMessageType = "TEXT",
  ) =>
    apiClient<SendMessageResponse>("/chat/messages", {
      method: "POST",
      body: JSON.stringify({ sessionId, content, messageType }),
    }),

  // Giu fetch() thay vi axios: can res.body.getReader() de doc SSE tung
  // chunk khi no ve, axios/XHR tren RN khong expose ReadableStream nay.
  streamMessage: async (
    sessionId: string,
    content: string,
    onToken: (token: string) => void,
    messageType: ChatMessageType = "TEXT",
  ) => {
    const send = async () =>
      fetch(`${BASE_URL}/chat/messages/stream`, {
        method: "POST",
        headers: await authedHeaders(),
        body: JSON.stringify({ sessionId, content, messageType }),
      });

    let res = await send();
    // fetch() khong di qua apiClient nen tu refresh token khi het han (giong web).
    if (res.status === 401) {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        void useAuthStore.getState().logout("expired");
        throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      }
      try {
        const tokens = await authApi.refreshToken(refreshToken);
        useAuthStore.getState().updateTokens(tokens.accessToken, tokens.refreshToken);
      } catch {
        void useAuthStore.getState().logout("expired");
        throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      }
      res = await send();
    }

    if (!res.ok) {
      const raw = await res.text();
      let message = raw;
      try {
        message = JSON.parse(raw)?.message ?? raw;
      } catch {
        // body khong phai JSON
      }
      if (res.status === 403) reportPlatformLock(message);
      throw new ApiError(stripErrorCode(message) || "Không thể gửi tin nhắn", res.status, errorCodeOf(message));
    }

    const reader = res.body?.getReader();
    if (!reader) {
      return readTextFromSse(await res.text(), onToken);
    }

    const decoder = new TextDecoder();
    let assistantText = "";
    let buffered = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffered += decoder.decode(value, { stream: true });
      const completeEvents = buffered.split(/\n\n+/);
      buffered = completeEvents.pop() ?? "";

      assistantText += readTextFromSse(completeEvents.join("\n\n"), onToken);
    }

    assistantText += readTextFromSse(buffered, onToken);

    return assistantText;
  },

  getSessions: (params?: { characterId?: string; contextId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.characterId) qs.set("characterId", params.characterId);
    if (params?.contextId) qs.set("contextId", params.contextId);
    return apiClient<ChatSession[]>(`/chat/sessions?${qs.toString()}`);
  },

  deleteSession: (sessionId: string) =>
    apiClient<null>(`/chat/sessions/${sessionId}/soft-delete`, { method: "PATCH" }),
};
