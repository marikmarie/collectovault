// src/api/index.ts
import axios from "axios";

const API_BASE = (import.meta.env?.VITE_API_BASE_URL as string) ;

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});


export function setVaultOtpToken(token: string, expiresAt?: string) {
  if (!token || typeof token !== "string" || token.trim() === "") {
    throw new Error("setVaultOtpToken: token must be a non-empty string");
  }
  sessionStorage.setItem("vaultOtpToken", token);
  if (expiresAt) {
    const t = Date.parse(expiresAt);
    if (!Number.isFinite(t)) {
      throw new Error("setVaultOtpToken: expiresAt must be a valid date string");
    }
    sessionStorage.setItem("vaultOtpExpiresAt", new Date(t).toISOString());
  } else {
    sessionStorage.removeItem("vaultOtpExpiresAt");
  }
}

export function clearVaultOtpToken() {
  sessionStorage.removeItem("vaultOtpToken");
  sessionStorage.removeItem("vaultOtpExpiresAt");
}


export function hasVaultOtpToken(): boolean {
  const token = sessionStorage.getItem("vaultOtpToken");
  if (!token) return false;
  const expiry = sessionStorage.getItem("vaultOtpExpiresAt");
  if (!expiry) return true; 
  const exp = Date.parse(expiry);
  if (!Number.isFinite(exp)) {
    
    clearVaultOtpToken();
    return false;
  }
  if (Date.now() > exp) {
    clearVaultOtpToken();
    return false;
  }
  return true;
}


export function getVaultOtpToken(): string {
  const token = sessionStorage.getItem("vaultOtpToken");
  if (!token) throw new Error("Vault OTP token not found");
  const expiry = sessionStorage.getItem("vaultOtpExpiresAt");
  if (expiry) {
    const exp = Date.parse(expiry);
    if (!Number.isFinite(exp)) {
      clearVaultOtpToken();
      throw new Error("Vault OTP token expired (invalid expiry)");
    }
    if (Date.now() > exp) {
      clearVaultOtpToken();
      throw new Error("Vault OTP token expired");
    }
  }
  return token;
}
api.interceptors.request.use(
  (config) => {
    try {
       //console.log("🪪 hasVaultOtpToken:", hasVaultOtpToken());
      if (hasVaultOtpToken() && config.headers) {
         const vaultOtp = getVaultOtpToken();
        config.headers.Authorization = `Bearer ${vaultOtp}`;
      }
    } catch (err) {
      console.warn("vault token not attached to request:", err);
    }
    return config;
  },
  (err) => Promise.reject(err)
);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const responseData = err.response?.data ?? { message: err.message };

    if (err.response?.status === 401 || err.response?.status === 403) {
      clearVaultOtpToken();
    }

    console.error("API error:", responseData);
    throw responseData;
  }
);

export default api;
