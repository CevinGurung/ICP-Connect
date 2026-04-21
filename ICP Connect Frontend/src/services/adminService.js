import api from "./api";

const BASE = "/api/admin";

export const getDashboard = () => api.get(`${BASE}/dashboard`).then(r => r.data);

export const getUsers = (role = "", search = "", page = 0) =>
  api.get(`${BASE}/users`, { params: { role, search, page } }).then(r => r.data);

export const updateUserRole = (userId, role) =>
  api.patch(`${BASE}/users/${userId}/role`, null, { params: { role } }).then(r => r.data);

export const deleteUser = (userId) =>
  api.delete(`${BASE}/users/${userId}`).then(r => r.data);

export const getPosts = (page = 0) =>
  api.get(`${BASE}/posts`, { params: { page } }).then(r => r.data);

export const deletePost = (postId) =>
  api.delete(`${BASE}/posts/${postId}`).then(r => r.data);

export const getReports = (status = "ALL", page = 0) =>
  api.get(`${BASE}/reports`, { params: { status, page } }).then(r => r.data);

export const resolveReport = (reportId, action) =>
  api.patch(`${BASE}/reports/${reportId}/resolve`, null, { params: { action } }).then(r => r.data);

export const deleteReportedPost = (reportId) =>
  api.delete(`${BASE}/reports/${reportId}/delete-post`).then(r => r.data);

export const getDonations = (page = 0) =>
  api.get(`${BASE}/donations`, { params: { page } }).then(r => r.data);

export const getActivity = () =>
  api.get(`${BASE}/activity`).then(r => r.data);

export const getAnalytics = () =>
  api.get(`${BASE}/analytics`).then(r => r.data);
