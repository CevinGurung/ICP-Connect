import api from "./api";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs";
import { getAccessToken } from "../auth/auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8848";

// ============ REST API ============

export const getOrCreateDM = async (targetUserId) => {
  const res = await api.post(`/api/chat/dm/${targetUserId}`);
  return res.data;
};

export const createGroup = async (name, memberIds) => {
  const res = await api.post("/api/chat/group", { name, memberIds });
  return res.data;
};

export const getConversations = async () => {
  const res = await api.get("/api/chat");
  return res.data;
};

export const getMessages = async (conversationId, page = 0, size = 20) => {
  const res = await api.get(`/api/chat/${conversationId}/messages`, { params: { page, size } });
  return res.data;
};

export const sendMessageREST = async (conversationId, content) => {
  const res = await api.post(`/api/chat/${conversationId}/message`, { content, messageType: "TEXT" });
  return res.data;
};

export const uploadChatImage = async (conversationId, file) => {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post(`/api/chat/${conversationId}/image`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// ============ WEBSOCKET (STOMP) — Singleton ============

let stompClient = null;
let connectionRefCount = 0;
let connectedCallbacks = [];

export const connectWebSocket = (onConnected, onError) => {
  connectionRefCount++;

  // If already connected, fire callback immediately
  if (stompClient && stompClient.connected) {
    if (onConnected) onConnected();
    return;
  }

  // If connecting (client exists but not yet connected), queue callback
  if (stompClient && !stompClient.connected) {
    if (onConnected) connectedCallbacks.push(onConnected);
    return;
  }

  // First connection — create the client
  const token = getAccessToken();
  if (onConnected) connectedCallbacks.push(onConnected);

  stompClient = new Client({
    webSocketFactory: () => new SockJS(`${API_BASE}/ws`),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 5000,
    onConnect: () => {
      // Fire all queued callbacks
      connectedCallbacks.forEach(cb => cb());
      connectedCallbacks = [];
    },
    onStompError: (frame) => {
      console.error("STOMP error:", frame);
      if (onError) onError(frame);
    },
  });

  stompClient.activate();
};

export const subscribeToConversation = (conversationId, onMessage) => {
  if (!stompClient || !stompClient.connected) return null;

  return stompClient.subscribe(`/topic/conversation/${conversationId}`, (message) => {
    const parsed = JSON.parse(message.body);
    onMessage(parsed);
  });
};

export const sendMessageWS = (conversationId, content, messageType = "TEXT") => {
  if (!stompClient || !stompClient.connected) return;

  stompClient.publish({
    destination: `/app/chat/${conversationId}`,
    body: JSON.stringify({ content, messageType }),
  });
};

export const disconnectWebSocket = () => {
  connectionRefCount--;

  // Only truly disconnect when no more consumers
  if (connectionRefCount <= 0) {
    connectionRefCount = 0;
    if (stompClient) {
      stompClient.deactivate();
      stompClient = null;
    }
    connectedCallbacks = [];
  }
};

/** Force disconnect (used for logout) */
export const forceDisconnectWebSocket = () => {
  connectionRefCount = 0;
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
  connectedCallbacks = [];
};

export const subscribeToNotifications = (onNotification) => {
  if (!stompClient || !stompClient.connected) return null;

  return stompClient.subscribe("/user/queue/notifications", (message) => {
    const parsed = JSON.parse(message.body);
    onNotification(parsed);
  });
};

export const getStompClient = () => stompClient;
