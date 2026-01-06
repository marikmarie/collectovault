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
      const expiresAt = new Date(Date.now() + 5 *60*1000).toISOString();

      setVaultOtpToken(data.data.vaultOTPToken, expiresAt); 
    }
   
    return data;
  },


//   logout: async () => {
//     try {
//       await api.post("/api/auth/logout");
//     } catch (err) {}
//     setAuthToken(null);
//     return { message: "Logged out" };
//   },

//   me: async () => {
//     const resp = await api.get("/api/auth/me");
//     return resp.data;
//   },
};

export default authService;


