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

    // If it's a 401 and we haven't already retried this request
    if (response && response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        clearTokens();
        // Skip redirect if we're already on login/register to avoid loops
        if (!window.location.pathname.match(/^\/(login|register)/)) {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshRes = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {
          refreshToken: refreshToken
        });

        const { accessToken: newAccess, refreshToken: newRefresh } = refreshRes.data;
        setTokens(newAccess, newRefresh);
        isRefreshing = false;
        onTokenRefreshed(newAccess);
        
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        onTokenRefreshed(null); // Signal failure to subscribers
        clearTokens();
        if (!window.location.pathname.match(/^\/(login|register)/)) {
          window.location.href = "/login?expired=true";
        }
        return Promise.reject(refreshError);
      }
    }

    // Add a flag to skip toast for 401s that are just redirects to login
    if (response && response.status === 401) {
      error.isHandled = true;
    }

    return Promise.reject(error);
  }
);

export default api;
