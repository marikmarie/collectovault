// collectovault.ts
import api from "./index";

export const collectovault = {
  //point rules
  getPointRules: (vendorId: string) => api.get(`/pointRules/${vendorId}/`),
  getPointRulesById: (id: string) => api.get(`/pointRules/${id}/`),

  savePointRule: (vendorId: string, data: any) =>
    api.post(`/pointRules/${vendorId}`, data),
  deletePointRule: (vendorId: string, ruleId: number) =>
    api.delete(`/pointRules/${vendorId}/pointRules/${ruleId}`),
  editletePointRule: (vendorId: string, ruleId: number) =>
    api.delete(`/pointRules/${vendorId}/pointRules/${ruleId}`),

  //tier rules
  getTierRules: (vendorId: string) => api.get(`/tier/${vendorId}`),
  getTierRuleById: (id: string) => api.get(`/tier/${id}/`),
  saveTierRule: (vendorId: string, data: any) =>
    api.post(`/tier/${vendorId}`, data),
  deleteTierRules: (vendorId: string, ruleId: number) =>
    api.delete(`/tier/${vendorId}/tier/${ruleId}`),
  editleteTierRules: (vendorId: string, ruleId: number) =>
    api.delete(`/tier/${vendorId}/tier/${ruleId}`),

  //point packages
  getPackages: (vendorId: string) => api.get(`/vaultPackages/${vendorId}`),
  getPackageById: (id: string) => api.get(`/vaultPackages/${id}/`),
  savePackages: (vendorId: string, data: any) =>
    api.post(`/vaultPackages/${vendorId}`, data),
  deletePackages: (vendorId: string, ruleId: number) =>
    api.delete(`/vaultPackages/${vendorId}/packages/${ruleId}`),
  editletePackages: (vendorId: string, ruleId: number) =>
    api.delete(`/vaultPackages/${vendorId}/packages/${ruleId}`),
};
