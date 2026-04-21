import api from "./api";

export const createPost = async (formData) => {
  const response = await api.post("/api/posts/create", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

export const getFeed = async () => {
  const response = await api.get("/api/posts/feed");
  return response.data;
};

export const getPostById = async (id) => {
  const response = await api.get(`/api/posts/${id}`);
  return response.data;
};

export const updatePost = async (id, formData) => {
  const response = await api.put(`/api/posts/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

export const deletePost = async (postId) => {
  const response = await api.delete(`/api/posts/${postId}`);
  return response.data;
};

export const toggleLike = async (postId) => {
  const response = await api.post(`/api/posts/${postId}/like`);
  return response.data;
};

export const getPostLikes = async (postId, page = 0, size = 10) => {
  const response = await api.get(`/api/posts/${postId}/likes`, {
    params: { page, size }
  });
  return response.data;
};

export const getComments = async (postId, page = 0, size = 10) => {
  const response = await api.get(`/api/posts/${postId}/comments`, {
    params: { page, size }
  });
  return response.data;
};

export const addComment = async (postId, content) => {
  const response = await api.post(`/api/posts/${postId}/comments`, { content });
  return response.data;
};

export const updateComment = async (commentId, content) => {
  const response = await api.put(`/api/comments/${commentId}`, { content });
  return response.data;
};

export const deleteComment = async (commentId) => {
  const response = await api.delete(`/api/comments/${commentId}`);
  return response.data;
};

export const sharePost = async (postId) => {
  const response = await api.post(`/api/posts/${postId}/share`);
  return response.data;
};

export const reportPost = async (postId, reason = "Inappropriate content") => {
  const response = await api.post(`/api/posts/${postId}/report`, null, {
    params: { reason }
  });
  return response.data;
};

const postService = {
  createPost,
  getFeed,
  getPostById,
  updatePost,
  deletePost,
  toggleLike,
  getPostLikes,
  getComments,
  addComment,
  updateComment,
  deleteComment,
  sharePost,
  reportPost
};

export default postService;
