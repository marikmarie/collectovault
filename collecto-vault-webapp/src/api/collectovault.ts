// srcService.ts
import api from "./index";

export const collectovault = {
  getMyServices: () => api.get(`/services`),


  //point rules
  getPointRules: (vendorId: string) =>
    api.get(`/pointRules/collecto/${vendorId}/`),

  getPointRulesById: (id: string, ) =>
    api.get(`/pointRules/${id}/`),
  savePointRule: (vendorId: string, data: any) =>
    api.post(`/pointRules/${vendorId}`, data),
  deletePointRule: (vendorId: string, ruleId: number) =>
    api.delete(`/pointRules/${vendorId}/pointRules/${ruleId}`),

  //tier rules
  getTierRules: (vendorId: string) =>
    api.get(`/tier/collecto/${vendorId}`),
  getTierRuleById: (id: string) =>
    api.get(`/tier/${id}/`),
  saveTierRule: (vendorId: string, data: any) =>
    api.post(`/tier/${vendorId}`, data),


  //point packages
  getPackages: (vendorId: number) =>
    api.get(`/vaultPackages/collecto/${vendorId}`),
  getPackageById: (id: string) =>
    api.get(`/vaultPackages/${id}/`),
  savePackages: (vendorId: string, data: any) =>
    api.post(`/vaultPackages/${vendorId}/tier-rules`, data),


};
