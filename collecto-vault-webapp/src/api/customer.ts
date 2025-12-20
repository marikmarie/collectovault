import api from "./index";

export const customerService = {
  // Fetch redeemable offers for a customer (use 'me' or provide customerId)
  getRedeemableOffers: (customerId?: string) =>
    api.get(`/customers/${customerId ?? "me"}/offers/redeemable`),

  // Fetch invoices for a customer (use 'me' or provide customerId)
  getInvoices: (customerId?: string) =>
    api.get(`/customers/${customerId ?? "me"}/invoices`),

  // Fetch the customer profile (minimal data may be returned initially)
  getProfile: (customerId?: string) => api.get(`/customers/${customerId ?? "me"}`),

  // Fetch tier benefits for the customer's current tier or a specific tier
  // Backend may respond with { benefits: [...] } or an array
  getTierBenefits: (customerId?: string, tier?: string) =>
    api.get(`/customers/${customerId}/tier-benefits${tier ? `?tier=${encodeURIComponent(tier)}` : ""}`),

  // Fetch available services for the customer (or generally available services)
  getServices: (customerId?: string) =>
    api.get(`/customers/${customerId}/services`),
};
