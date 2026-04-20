import api from "./api";

export const getUserProfile = async (userId) => {
  const response = await api.get(`/api/users/${userId}/profile`);
  return response.data;
};

export const toggleFollow = async (userId) => {
  const response = await api.post(`/api/users/${userId}/follow`);
  return response.data;
};

export const updateProfile = async (profileData, profilePic, removeProfilePic = false) => {
  const formData = new FormData();
  formData.append("fullName", profileData.fullName);
  formData.append("bio", profileData.bio || "");
  formData.append("program", profileData.program || "");
  formData.append("year", profileData.year || "");
  formData.append("section", profileData.section || "");
  formData.append("removeProfilePic", removeProfilePic);
  
  if (profilePic) {
    formData.append("profilePic", profilePic);
  }

  const response = await api.put(`/api/users/profile`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

export const getFollowers = async (userId) => {
  const response = await api.get(`/api/users/${userId}/followers`);
  return response.data;
};

export const getFollowing = async (userId) => {
  const response = await api.get(`/api/users/${userId}/following`);
  return response.data;
};

export const getUserPosts = async (userId) => {
  const response = await api.get(`/api/posts/user/${userId}`);
  return response.data;
};

export const getRecommendations = async (page = 0, size = 9) => {
  const response = await api.get(`/api/users/recommendations?page=${page}&size=${size}`);
  return response.data;
};

export const getMutualConnections = async () => {
  const response = await api.get("/api/users/connections");
  return response.data;
};
