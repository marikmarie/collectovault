// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import Dashboard from './pages/customer/Dashboard'
import Statement from './pages/customer/Statement'
import Login from './pages/Login';
import Services from './pages/Admin/Services';
import Reports from './pages/Admin/Reports';
import LoyaltySettings from './pages/Admin/LoyaltySettings';

import { Routes, Route, Navigate } from "react-router-dom";


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/statement" element={<Statement />} />
      <Route path="/login" element={<Login />} />
      <Route path="/services" element={<Services />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/loyalty-settings" element={<LoyaltySettings />} />

    </Routes>
  );
}