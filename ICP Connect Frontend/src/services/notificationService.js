import api from "./api";

export const getNotifications = async (page = 0, size = 20) => {
  const response = await api.get("/api/notifications", { params: { page, size } });
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await api.get("/api/notifications/unread-count");
  return response.data.count;
};

export const markAsRead = async (id) => {
  const response = await api.put(`/api/notifications/${id}/read`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await api.put("/api/notifications/read-all");
  return response.data;
};
