import axios from "axios";

const API_BASE = (import.meta.env?.VITE_API_BASE_URL as string);

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// ========== RATING ENDPOINTS ==========

export interface RatingData {
  clientId: number;
  transactionId: number;
  orderRating: number;
  paymentRating: number;
  serviceRating: number;
  overallRating: number;
  comment?: string;
}

export const createRating = async (data: RatingData) => {
  const response = await api.post("/ratings", data);
  return response.data;
};

export const getRatingByTransaction = async (transactionId: number) => {
  try {
    const response = await api.get(`/ratings/transaction/${transactionId}`);
    return response.data;
  } catch (error) {
    return null;
  }
};

export const getCustomerAverageRatings = async (clientId: number) => {
  const response = await api.get(`/ratings/customer/${clientId}/average`);
  return response.data;
};

export const updateRating = async (
  ratingId: number,
  data: Partial<RatingData>
) => {
  const response = await api.patch(`/ratings/${ratingId}`, data);
  return response.data;
};

// ========== FEEDBACK ENDPOINTS ==========

export interface FeedbackData {
  clientId: number;
  feedbackType: 'order' | 'service' | 'app' | 'general';
  title: string;
  message: string;
  attachments?: string[];
}

export const createFeedback = async (data: FeedbackData) => {
  const response = await api.post("/feedback", data);
  return response.data;
};

export const getCustomerFeedback = async (
  clientId: number,
  limit = 20,
  offset = 0
) => {
  const response = await api.get(
    `/feedback/customer/${clientId}?limit=${limit}&offset=${offset}`
  );
  return response.data;
};

export const updateFeedback = async (
  feedbackId: number,
  data: Partial<FeedbackData>
) => {
  const response = await api.patch(`/feedback/${feedbackId}`, data);
  return response.data;
};

export const resolveFeedback = async (feedbackId: number) => {
  const response = await api.patch(`/feedback/${feedbackId}/resolve`);
  return response.data;
};

export const closeFeedback = async (feedbackId: number) => {
  const response = await api.patch(`/feedback/${feedbackId}/close`);
  return response.data;
};

// ========== CHAT ENDPOINTS ==========

export interface ChatMessageData {
  clientId: number;
  message: string;
  attachments?: string[];
}

export const sendChatMessage = async (data: ChatMessageData) => {
  const response = await api.post("/chat", {
    ...data,
    senderType: 'customer',
  });
  return response.data;
};

export const getConversation = async (
  clientId: number,
  limit = 50,
  offset = 0
) => {
  const response = await api.get(
    `/chat/customer/${clientId}?limit=${limit}&offset=${offset}`
  );
  return response.data;
};

export const getUnreadMessageCount = async (clientId: number) => {
  const response = await api.get(`/chat/customer/${clientId}/unread`);
  return response.data.unreadCount;
};

export const markChatMessageAsRead = async (messageId: number) => {
  const response = await api.patch(`/chat/${messageId}/read`);
  return response.data;
};

export const markAllChatMessagesAsRead = async (clientId: number) => {
  const response = await api.patch(`/chat/customer/${clientId}/read-all`);
  return response.data;
};

// ========== CONTACT ENDPOINTS ==========

export const setUserWhatsApp = async (
  clientId: number,
  whatsappNumber: string
) => {
  const response = await api.post("/contacts/whatsapp/user", {
    clientId,
    whatsappNumber,
  });
  return response.data;
};

export const getUserWhatsAppContact = async (clientId: number) => {
  try {
    const response = await api.get(`/contacts/whatsapp/user/${clientId}`);
    return response.data;
  } catch (error) {
    return null;
  }
};

export const getBusinessWhatsAppUrl = async () => {
  try {
    const response = await api.get("/contacts/whatsapp/business/url");
    return response.data.whatsappUrl;
  } catch (error) {
    return null;
  }
};

export const getUserWhatsAppUrl = async (clientId: number) => {
  try {
    const response = await api.get(
      `/contacts/whatsapp/user/${clientId}/url`
    );
    return response.data.whatsappUrl;
  } catch (error) {
    return null;
  }
};

export const getBusinessContacts = async () => {
  try {
    const response = await api.get("/contacts/business/all");
    return response.data;
  } catch (error) {
    return {};
  }
};
