import api from "./index";



export const transactionService = {
  buyPoints: (customerId: string, data: any) =>
    api.post(`/transactions/${customerId}/buy-points`, data),
  redeemPoints: (customerId: string, data: any) =>
    api.post(`/transactions/${customerId}/redeem`, data),
  
  getTransactions: (customerId: string, limit: number = 50, offset: number = 0) =>
    api.post(`/transactions`, { customerId, limit, offset }),
};

export const invoiceService = {
  createInvoice: (payload: any) => api.post("/invoice", payload),

  getInvoices: (payload: {
    vaultOTPToken?: string;
    clientId?: string;
    collectoId?: string;
    invoiceId?: string | null;
  }) => api.post("/invoiceDetails", payload),

  // Re-use requestToPay for multiple payment flows
  payInvoice: (payload: {
    invoiceId?: string;
    reference?: string;
    paymentOption: string;
    phone?: string;
    vaultOTPToken?: string;
    collectoId?: string;
    clientId?: string;
    staffId?: string;
    points?: {
      points_used?: number;
      discount_amount?: number;
    };
  }) => api.post("/requestToPay", payload),

  requestPayment: (payload: {
    vaultOTPToken?: string;
    collectoId?: string;
    clientId?: string;
    phone?: string;
    amount?: number;
    paymentOption?: string;
    reference?: string;
    meta?: Record<string, any>;
  }) => api.post("/requestToPay", payload),

  clientAddCash: (payload: {
    vaultOTPToken?: string;
    collectoId?: string;
    clientId?: string;
    phone?: string;
    amount?: number;
    paymentOption?: string;
    reference?: string;
    meta?: Record<string, any>;
  }) => api.post("/requestToPay", payload),


  verifyPhone: (payload: {
    vaultOTPToken?: string;
    collectoId?: string;
    clientId?: string;
    phoneNumber: string;
  }) => api.post("/verifyPhoneNumber", payload),
};
