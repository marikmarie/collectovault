import api from "./index";

export const customerService = {
  // Fetch redeemable offers for a customer (use 'me' or provide customerId)
  getRedeemableOffers: (customerId?: string) =>
    api.get(`/customers/${customerId ?? "me"}/offers/redeemable`),

  // Fetch invoices for a customer (use 'me' or provide customerId)
  getInvoices: (customerId?: string) =>
    api.get(`/customers/${customerId ?? "me"}/invoices`),
};
