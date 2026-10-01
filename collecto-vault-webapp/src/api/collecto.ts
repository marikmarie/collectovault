import api from "./index";



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
    clientAddCash?: {
      charge: number;
      charge_client: number;
    };

  }) => api.post("/requestToPay", payload),


  verifyPhone: (payload: {
    vaultOTPToken?: string;
    collectoId?: string;
    clientId?: string;
    phoneNumber: string;
  }) => api.post("/verifyPhoneNumber", payload),
};

export type CardCollection = {
  id: string;
  amount: string;
  currency: "UGX" | "USD";
  description: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | string;
  reason?: string | null;
  provider_transaction_id?: string | null;
  checkout_url: string;
};

export const cardPaymentService = {
  start: (payload: {
    vaultOTPToken?: string;
    collectoId: string;
    clientId: string;
    amount: number;
    description: string;
    customerName?: string;
    customerEmail?: string;
  }) => api.post<{ data: CardCollection }>("/pegasus/card-collections", payload),

  status: (id: string, refresh = false) =>
    api.get<{ data: CardCollection }>(`/pegasus/card-collections/${encodeURIComponent(id)}`, {
      params: refresh ? { refresh: true } : undefined,
    }),

  complete: (id: string, payload: Record<string, unknown>) =>
    api.post(`/pegasus/card-collections/${encodeURIComponent(id)}/complete`, payload),
};
