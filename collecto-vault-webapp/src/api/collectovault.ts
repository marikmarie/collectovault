// srcService.ts
import api from "./index";

export const collectovault = {
  getMyServices: () => api.get(`/services`),


  //point rules
  getPointRules: (vendorId: string) =>
    api.get(`/pointRules/${vendorId}/`),
  savePointRule: (vendorId: string, data: any) =>
    api.post(`/pointRules/${vendorId}`, data),
  deletePointRule: (vendorId: string, ruleId: number) =>
    api.delete(`/pointRules/${vendorId}/pointRules/${ruleId}`),

  //tier rules
  getTierRules: (vendorId: string) =>
    api.get(`/tier/${vendorId}`),
  saveTierRule: (vendorId: string, data: any) =>
    api.post(`/tier/${vendorId}`, data),


  //point packages
  getPackages: (vendorId: number) =>
    api.get(`/vaultPackages/${vendorId}`),

  savePackages: (vendorId: string, data: any) =>
    api.post(`/vaultPackages/${vendorId}/tier-rules`, data),


};
