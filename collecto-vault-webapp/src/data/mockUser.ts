export const mockUser = {
  id: 'user_001',
  name: 'Tukas Mariam',
  phone: '0721695645',
  avatar: '/images/avatar-placeholder.jpg',
  pointsBalance: 2000,
  tier: 'Blue',
  tierProgress: 0.12, 
  expiryDate: '2027-04-30',
  ledger: [
    { id: 'l1', date: '2025-11-01', desc: 'Flight ABC123', change: 1200 },
    { id: 'l2', date: '2025-10-12', desc: 'Hotel stay', change: 800 },
    { id: 'l3', date: '2025-09-05', desc: 'Redeemed - discount', change: -500 },
  ]
}
