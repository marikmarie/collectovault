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

  /**
   * Fetch services. Accepts optional paging parameters to avoid very large responses.
   * @param collectoId string
   * @param page number (1-indexed)
   * @param limit number of items per page
   */
  getServices: (collectoId?: string, page?: number, limit?: number) => 
    api.post('/services', { collectoId, page, limit }),
  // getServices: (collectoId?: string) =>
  //   api.post(
  //     `/services${
  //       collectoId ? `?collectoId=${encodeURIComponent(collectoId)}` : ""
  //     }`
  //   ),
};
