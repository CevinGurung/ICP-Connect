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

// ============ WEBSOCKET (STOMP) ============

let stompClient = null;

export const connectWebSocket = (onConnected, onError) => {
  const token = getAccessToken();

  stompClient = new Client({
    webSocketFactory: () => new SockJS(`${API_BASE}/ws`),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 5000,
    onConnect: () => {
      if (onConnected) onConnected();
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
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
};
