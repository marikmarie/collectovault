import api from "./index";

export const transactionService = {
  buyPoints: (customerId: string, data: any) =>
    api.post(`/transactions/${customerId}/buy-points`, data),
  redeemPoints: (customerId: string, data: any) =>
    api.post(`/transactions/${customerId}/redeem`, data),
  getTransactions: (customerId: string) =>
    api.get(`/transactions/${customerId}`),
};

export const invoiceService = {
  createInvoice: (payload: any) => api.post("/invoice", payload),
  getInvoices: () => api.get("/invoices"),

  payInvoice: (payload: {
    invoiceId?: string;
    reference?: string; // Used for /buyPoints logic
    paymentOption: string;
    phone?: string;
    vaultOTPToken?: string;
    collectoId?: string;
    clientId?: string;
  }) => api.post("/requestToPay", payload),
};
