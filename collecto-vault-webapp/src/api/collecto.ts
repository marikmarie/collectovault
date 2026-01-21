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
  
  payInvoice: (payload: {
    invoiceId?: string;
    reference?: string;
    paymentOption: string;
    phone?: string;
    vaultOTPToken?: string;
    collectoId?: string;
    clientId?: string;
  }) => api.post("/requestToPay", payload),
};
