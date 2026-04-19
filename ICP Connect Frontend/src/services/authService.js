import api from "./api.js";

export async function sendOtp(email) {
  const res = await api.post("/auth/send-otp", { email });
  return res.data;
}

export async function register(payload) {
  // payload: { userName, email, password, phoneNumber }
  const res = await api.post("/auth/register", payload);
  return res.data; // { accessToken, refreshToken }
}

export async function login(payload) {
  // payload: { email, password }
  const res = await api.post("/auth/login", payload);
  return res.data; // { accessToken, refreshToken }
}

export async function logout(refreshToken) {
  // body: { refreshToken }
  const res = await api.post("/auth/logout", { refreshToken });
  return res.data;
}
