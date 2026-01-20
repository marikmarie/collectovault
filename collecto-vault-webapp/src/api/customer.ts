import api from "./index";

export const customerService = {
  // Get customer's current points balance and tier info
  getPointsAndTier: (vendorId?: string) =>
    api.get(`/pointRules/collecto/${vendorId || localStorage.getItem('collectoId') || '141122'}`),

  // Get tier rules/benefits
  getTierInfo: (vendorId?: string) =>
    api.get(`/tier/collecto/${vendorId || localStorage.getItem('collectoId') || '141122'}`),

  getRedeemableOffers: (customerId?: string) =>
    api.post(`/customers/${customerId ?? "me"}/offers/redeemable`),


  getTierBenefits: (customerId?: string, tier?: string) =>
    api.post(
      `/customers/${customerId}/tier-benefits${
        tier ? `?tier=${encodeURIComponent(tier)}` : ""
      }`
    ),

  getServicesById: (customerId?: string) =>
    api.post(`/customers/${customerId}/services`),

  getServices: (vaultOTPToken?: string, collectoId?: string, page?: number, limit?: number) => 
    api.post('/services', { vaultOTPToken,collectoId, page, limit }),

  // Create or upsert a customer on login
  createCustomer: (payload: { collecto_id: string; client_id: string; name?: string }) =>
    api.post('/customers', payload),
};
