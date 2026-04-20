import axios from "axios";
import { getAccessToken, clearTokens, getRefreshToken, setTokens } from "../auth/auth.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (accessToken) => {
  refreshSubscribers.map((cb) => cb(accessToken));
  refreshSubscribers = [];
};

// Response interceptor to handle unauthorized access and refresh tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const originalRequest = config;

    if (response && response.status === 401) {
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          // Attempt to refresh the token
          const refreshRes = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {
            refreshToken: refreshToken
          });

          const { accessToken: newAccess, refreshToken: newRefresh } = refreshRes.data;
          
          setTokens(newAccess, newRefresh);
          isRefreshing = false;
          onTokenRefreshed(newAccess);
        } catch (refreshError) {
          isRefreshing = false;
          clearTokens();
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      }

      // Return a promise that waits for the token to be refreshed
      return new Promise((resolve) => {
        subscribeTokenRefresh((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  }
);

export default api;
