// import { useState } from 'react'

import './App.css'
import { useEffect } from 'react';
import Dashboard from './pages/customer/Dashboard'
import Statement from './pages/customer/Statement'
import Login from './pages/Login';
import Services from './pages/customer/Services';
import ProtectedRoute from './components/ProtectedRoute';
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { hasVaultOtpToken } from './api';


export default function App() {
  const navigate = useNavigate();
  //const clientId = Number(localStorage.getItem('clientId')) || 0;

  // Periodically check token validity and force logout when expired
  useEffect(() => {
    const interval = setInterval(() => {
      if (!hasVaultOtpToken()) {
        navigate('/login');
      }
    }, 30_000); 
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/statement" element={<ProtectedRoute><Statement /></ProtectedRoute>} />
        <Route path="/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
        {/* <Route path="/admin/*" element={<Layout />} /> */}

        <Route path="/login" element={<Login />} />
      </Routes>
      
      {/* Global Feedback Modals — always mounted so context triggers always work */}
      {/* <FeedbackModals customerId={clientId} /> */}
    </>
  );
}