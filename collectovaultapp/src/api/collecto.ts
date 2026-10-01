import api from './index';
import storage from '@/src/utils/storage';



export const invoiceService = {
  // Get customer invoices - matches web app pattern using /invoiceDetails POST endpoint
  createInvoice: (payload: any) => api.post("/invoice", payload),
  

  getInvoices: (payload: {
    vaultOTPToken?: string;
    clientId?: string;
    collectoId?: string;
    invoiceId?: string | null;
  }) => api.post('/invoiceDetails', payload),

  // Get invoice details
  getInvoiceDetails: (invoiceId: string) =>
    api.get(`/invoices/${invoiceId}`),

  // Pay an invoice
  payInvoice: (payload: any) =>
    api.post('/requestToPay', payload),
};

export type CardCollection = {
  id: string;
  amount: string;
  currency: 'UGX' | 'USD';
  description: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | string;
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
  }) => api.post<{ data: CardCollection }>('/pegasus/card-collections', payload),

  status: (id: string, refresh = false) =>
    api.get<{ data: CardCollection }>(`/pegasus/card-collections/${encodeURIComponent(id)}`, {
      params: refresh ? { refresh: true } : undefined,
    }),

  complete: (id: string, payload: Record<string, unknown>) =>
    api.post(`/pegasus/card-collections/${encodeURIComponent(id)}/complete`, payload),
};
