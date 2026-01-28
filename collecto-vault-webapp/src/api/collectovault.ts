// collectovault.ts
import api from "./index";

export const collectovault = {
  //point rules
  getPointRules: (vendorId: string) => api.get(`/pointRules/${vendorId}/`),
  getPointRulesById: (id: string) => api.get(`/pointRules/${id}/`),

  savePointRule: (vendorId: string, data: any) =>
    data.id ? api.put(`/pointRules/${data.id}`, data) : api.post(`/pointRules/${vendorId}`, data),
  updatePointRule: (ruleId: number, data: any) =>
    api.put(`/pointRules/${ruleId}`, data),
  deletePointRule: (vendorId: string, ruleId: number) =>
    api.delete(`/pointRules/${vendorId}/${ruleId}`),


  //tier rules
  getTierRules: (vendorId: string) => api.get(`/tier/${vendorId}`),
  getTierRuleById: (id: string) => api.get(`/tier/${id}/`),
  saveTierRule: (vendorId: string, data: any) =>
    data.id ? api.put(`/tier/${data.id}`, data) : api.post(`/tier/${vendorId}`, data),
  updateTierRule: (tierId: number, data: any) =>
    api.put(`/tier/${tierId}`, data),
  deleteTierRules: (vendorId: string, ruleId: number) =>
    api.delete(`/tier/${vendorId}/${ruleId}`),
  
  //point packages
  getPackages: (vendorId: string) => api.get(`/vaultPackages/${vendorId}`),
  getPackageById: (id: string) => api.get(`/vaultPackages/${id}/`),
  savePackages: (vendorId: string, data: any) =>
    data.id ? api.put(`/vaultPackages/${data.id}`, data) : api.post(`/vaultPackages/${vendorId}`, data),
  updatePackages: (packageId: number, data: any) =>
    api.put(`/vaultPackages/${packageId}`, data),
  deletePackages: (vendorId: string, ruleId: number) =>
    api.delete(`/vaultPackages/${vendorId}/${ruleId}`),
 };
