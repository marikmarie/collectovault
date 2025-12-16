// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import Dashboard from './pages/customer/Dashboard'
import Statement from './pages/customer/Statement'
import Login from './pages/Login';
import Services from './pages/Admin/Services';
import Reports from './pages/Admin/Reports';
import Layout from './pages/Admin/Layout';

import { Routes, Route, Navigate } from "react-router-dom";


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/statement" element={<Statement />} />
      <Route path="/login" element={<Login />} />
      <Route path="/services" element={<Services />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/admin/dashboard" element={<Layout />} />
      {/* <Route path="/tiers" element={<Tiers />} />
      <Route path="/users" element={<Users />} />
      <Route path="/point-rules" element={<PointRules />} />
      <Route path="/packages" element={<Packages />} /> */}

    </Routes>
  );
}