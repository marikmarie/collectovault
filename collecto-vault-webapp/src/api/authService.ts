// src/api/authService.ts  (append / update)
import api, { setVaultOtpToken } from "./index";

export const authService = {
  startCollectoAuth: async (payload: {
    type: "business" | "client";
    collectoId?: string;
    id?: string;
    // uid?: string;
  }) => {
    const resp = await api.post("/auth", payload);
    return resp.data;
  },

  verifyCollectoOtp: async (payload: {
    id: string;
    type?: "business" | "client";
    vaultOTP: string;
    vaultOTPToken?: string;
  }) => {
    const resp = await api.post("/authVerify", payload);
    const data = resp.data;
    const userData = data.data.data;
    if (data?.token) {
      // Set session expiry to 30 minutes from now
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      setVaultOtpToken(data.data.vaultOTPToken, expiresAt);
    }
    
    if (userData) {
      const { id, collectoId, userName } = userData;

      // Store them as requested
      localStorage.setItem("clientId", id);
      localStorage.setItem("collectoId", collectoId.toString());
      localStorage.setItem("userName", userName);

    }

    return data;
  },
};
export default authService;
