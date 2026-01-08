// src/api/authService.ts  (append / update)
import api, { setVaultOtpToken } from "./index";

export const authService = {

  startCollectoAuth: async (payload: {
    type: "business" | "client" | "staff";
    collectoId?: string;
    id?: string;
   // uid?: string;
   }) => {
    const resp = await api.post("/auth", payload);
    return resp.data;
  },

  
 verifyCollectoOtp: async (payload: {
    id: string;
    vaultOTP: string;
    vaultOTPToken?: string;

  }) => {
    const resp = await api.post("/authVerify", payload);
    const data = resp.data;
    if (data?.token) {
      // Set session expiry to 30 minutes from now
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      setVaultOtpToken(data.data.vaultOTPToken, expiresAt); 
    }
   
    return data;
  },

};
export default authService;


