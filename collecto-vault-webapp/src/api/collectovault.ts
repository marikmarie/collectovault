// src/api/vendorService.ts
import api from "./index";

export const collectovault = {
  getMyServices: () => api.get(`/api/vendor/services`),


  //point rules
  getPointRules: (vendorId: string) =>
    api.get(`/api/vendor/${vendorId}/point-rules`),
  savePointRule: (vendorId: string, data: any) =>
    api.post(`/api/vendor/${vendorId}/point-rules`, data),

  //tier rules
  getTierRules: (vendorId: string) =>
    api.get(`/api/vendor/${vendorId}/tier-rules`),
  saveTierRule: (vendorId: string, data: any) =>
    api.post(`/api/vendor/${vendorId}/tier-rules`, data),


  //point packages
  getPackages: (vendorId: number) =>
    api.get(`/api/vendor/${vendorId}/packages`),

  savePackages: (vendorId: string, data: any) =>
    api.post(`/api/vendor/${vendorId}/tier-rules`, data),


};
