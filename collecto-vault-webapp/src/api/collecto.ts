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
  
// invoiceService.ts
payInvoice: (payload: {
  invoiceId?: string;
  reference?: string;
  paymentOption: string;
  phone?: string;
  vaultOTPToken?: string;
  collectoId?: string;
  clientId?: string;
  points?: { // Named the points object correctly
    points_used?: number;
    discount_amount?: number;
  };
}) => api.post("/requestToPay", payload),

};
