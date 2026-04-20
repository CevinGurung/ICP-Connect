import api from "./api";

const postService = {
  createPost: async (formData) => {
    // Note: axios handles the Boundary and Content-Type for FormData automatically
    const response = await api.post("/api/posts/create", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  },

  getFeed: async () => {
    const response = await api.get("/api/posts/feed");
    return response.data;
  },

  getPostById: async (id) => {
    const response = await api.get(`/api/posts/${id}`);
    return response.data;
  },

  updatePost: async (id, formData) => {
    // Note: axios handles the Boundary and Content-Type for FormData automatically
    const response = await api.put(`/api/posts/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  },

  deletePost: async (postId) => {
    const response = await api.delete(`/api/posts/${postId}`);
    return response.data;
  },
  
  likePost: async (postId) => {
    const response = await api.post(`/api/posts/${postId}/like`);
    return response.data;
  },

  getPostLikes: async (postId, page = 0, size = 10) => {
    const response = await api.get(`/api/posts/${postId}/likes`, {
      params: { page, size }
    });
    return response.data;
  },

  // Comment Endpoints
  getComments: async (postId, page = 0, size = 10) => {
    const response = await api.get(`/api/posts/${postId}/comments`, {
      params: { page, size }
    });
    return response.data;
  },

  addComment: async (postId, content) => {
    const response = await api.post(`/api/posts/${postId}/comments`, { content });
    return response.data;
  },

  updateComment: async (commentId, content) => {
    const response = await api.put(`/api/comments/${commentId}`, { content });
    return response.data;
  },

  deleteComment: async (commentId) => {
    const response = await api.delete(`/api/comments/${commentId}`);
    return response.data;
  }
};

export default postService;
