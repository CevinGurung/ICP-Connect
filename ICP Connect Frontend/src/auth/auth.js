const ACCESS_KEY = "icp_access_token";
const REFRESH_KEY = "icp_refresh_token";

// LEARNING NOTE: This stores our 'Visitor Pass' (Access Token) and 
// 'Subscription' (Refresh Token) in the browser's persistent memory (LocalStorage).
export function setTokens(accessToken, refreshToken) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

// LEARNING NOTE: A simple check. If we have an Access Token, we assume the user is logged in.
// If the token is actually expired, the Backend will let us know later (401 error).
export function isLoggedIn() {
  return Boolean(getAccessToken());
}

// LEARNING NOTE: JWT tokens are just base64-encoded strings. 
// This function 'decodes' the middle part of the token so we can read the 
// user's Name, Email, and Role directly on the Frontend.
export function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function getUserInfo() {
  const token = getAccessToken();
  if (!token) return null;
  return parseJwt(token);
}
