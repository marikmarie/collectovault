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

  /**
   * Set username for a customer after first login
   * @param clientId - The client ID (obtained during first auth)
   * @param username - The desired username
   * @param collectoId - Optional, the collecto ID
   */
  setUsername: async (payload: {
    clientId: string;
    username: string;
    collectoId?: string;
  }) => {
    try {
      const resp = await api.post("/set-username", payload);
      if (resp.data.success) {
        // Store the username in localStorage
        localStorage.setItem("userName", payload.username);
      }
      return resp.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to set username");
    }
  },

  /**
   * Get client ID by username (for login with username)
   * @param username - The username to look up
   */
  getClientIdByUsername: async (username: string) => {
    try {
      const resp = await api.post("/get-by-username", { username });
      if (resp.data.success) {
        return resp.data.data;
      }
      throw new Error("Username not found");
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Username not found");
    }
  },

  /**
   * Login using username instead of client ID
   * First fetches the client ID from the username, then proceeds with regular auth flow
   */
  loginByUsername: async (payload: {
    username: string;
    type: "business" | "client";
  }) => {
    try {
      // Step 1: Get client ID by username
      const userInfo = await authService.getClientIdByUsername(payload.username);
      
      // Step 2: Start auth with the retrieved client ID
      const authPayload = {
        type: payload.type,
        id: userInfo.clientId,
        collectoId: userInfo.collectoId,
      };

      const resp = await authService.startCollectoAuth(authPayload);
      return resp;
    } catch (error: any) {
      throw new Error(error.message || "Login by username failed");
    }
  },

  /**
   * Check if username is available
   */
  checkUsernameAvailability: async (username: string) => {
    try {
      await authService.getClientIdByUsername(username);
      // If we get here, username exists (not available)
      return { available: false, message: "Username already taken" };
    } catch {
      // Username doesn't exist (available)
      return { available: true, message: "Username is available" };
    }
  },
};
export default authService;
