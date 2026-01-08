// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import { useEffect } from 'react';
import Dashboard from './pages/customer/Dashboard'
import Statement from './pages/customer/Statement'
import Login from './pages/Login';
import Services from './pages/Admin/Services';
import Reports from './pages/Admin/Reports';
import Layout from './pages/Admin/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { hasVaultOtpToken } from './api';


export default function App() {
  const navigate = useNavigate();

  // Periodically check token validity and force logout when expired
  useEffect(() => {
    const interval = setInterval(() => {
      if (!hasVaultOtpToken()) {
        navigate('/login');
      }
    }, 30_000); // check every 30s
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/statement" element={<ProtectedRoute><Statement /></ProtectedRoute>} />
      <Route path="/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/admin/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>} />

      <Route path="/login" element={<Login />} />
    </Routes>
  );
}