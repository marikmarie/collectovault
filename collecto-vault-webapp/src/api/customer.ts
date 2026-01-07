import api from "./index";

export const customerService = {
  getRedeemableOffers: (customerId?: string) =>
    api.post(`/customers/${customerId ?? "me"}/offers/redeemable`),

  getInvoices: (customerId?: string) =>
    api.post(`/customers/${customerId ?? "me"}/invoices`),

  getProfile: (customerId?: string) =>
    api.post(`/customers/${customerId ?? "me"}`),

  getTierBenefits: (customerId?: string, tier?: string) =>
    api.post(
      `/customers/${customerId}/tier-benefits${
        tier ? `?tier=${encodeURIComponent(tier)}` : ""
      }`
    ),

  getServicesById: (customerId?: string) =>
    api.post(`/customers/${customerId}/services`),


  getServices: (collectoId?: string, page?: number, limit?: number) => 
    api.post('/services', { collectoId, page, limit }),

};
