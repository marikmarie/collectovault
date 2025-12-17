import React, { useState } from 'react';
import { User, Briefcase, Lock, ArrowRight, Mail, RotateCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; 
import { authService } from '../api/authService';
import { setVaultOtpToken, getVaultOtpToken } from '../api';

// Define the available user types
type UserType = 'client' | 'staff';

// Type for the temporary payload needed between ID and OTP steps
type PendingPayload = {
  type: UserType;
  // We keep 'id' here for internal state tracking, but use 'cid'/'uid' for API
  id: string; 
  vaultOTPToken?: string | null;
};

const BACKGROUND_IMAGE_PATH = '/bg.png'; 

export default function LoginPage() {
  const navigate = useNavigate(); 
    
  const [userType, setUserType] = useState<UserType>('client');
  const [loginStep, setLoginStep] = useState<'id_entry' | 'otp_entry'>('id_entry');
  const [idValue, setIdValue] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<PendingPayload | null>(null);

  // --- API Payload Builder ---
  const buildAuthPayload = (type: UserType, id: string) => {
    const basePayload = { type, id };
    if (type === 'client') {
      return { ...basePayload, cid: id, uid: undefined }; // Use 'cid' for clients
    } else if (type === 'staff') {
      return { ...basePayload, cid: undefined, uid: id }; // Use 'uid' for staff
    }
    // Fallback/Default for API
    return { ...basePayload, cid: id, uid: undefined }; 
  };

  // --- STEP 1: Handle ID/Email Submission (API Call: startCollectoAuth) ---
  const handleIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);

    if (idValue.length < 5) {
      setError(`Please enter a valid ${userType === 'client' ? 'Client ID/Email' : 'User ID'}.`);
      setIsProcessing(false);
      return;
    }

    try {
      // 1. Prepare API-specific payload
      const { cid, uid, type } = buildAuthPayload(userType, idValue);
      const apiPayload = { type, cid, uid }; 

      const res = await authService.startCollectoAuth(apiPayload as any);
      
      const root = res; // authService returns resp.data, so root is the data object
      const inner = root?.data ?? null;
      
      if (!root) {
        setError("Authorization failed. Unexpected server response structure.");
        return;
      }

      const returnedToken = inner?.data?.vaultOTPToken ?? inner?.vaultOTPToken ?? null;
      
      if (returnedToken) {
        // 2. Set token and prepare payload for next step
        const expiryIso = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        setVaultOtpToken(returnedToken, expiryIso);
        
        const newPayload: PendingPayload = { type, id: idValue, vaultOTPToken: returnedToken };
        setPendingPayload(newPayload);
        
        // 3. Move to OTP step
        setLoginStep('otp_entry');
        setError(inner?.message ?? "OTP sent — check your registered channel.");
        return;
      }

      // Handle case where OTP session might already exist without a new token being returned
      if (root?.auth === true && root?.status === "error") {
        const existingToken = getVaultOtpToken();

        if (existingToken) {
          const newPayload: PendingPayload = { type, id: idValue, vaultOTPToken: existingToken };
          setPendingPayload(newPayload);
          setLoginStep('otp_entry');
          setError(
            root?.message ??
            "You already have an active OTP session. Enter your OTP."
          );
        } else {
          setError("You must wait before requesting a new OTP.");
        }
        return;
      }
      
      // Handle general errors
      setError(inner?.message ?? root?.message ?? "Authorization failed. Please try again.");
      
    } catch (err: any) {
      console.error("startCollectoAuth error:", err);
      setError(err?.message ?? "Network or service error. Please check your connection.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- STEP 2: Handle OTP Submission (API Call: verifyCollectoOtp) ---
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);
    
    if (otpValue.length !== 6) {
      setError("OTP must be 6 digits.");
      setIsProcessing(false);
      return;
    }

    if (!pendingPayload?.vaultOTPToken) {
      setError("No active authentication session. Please go back to ID entry.");
      handleBackToIdEntry();
      setIsProcessing(false);
      return;
    }

    try {
      // 1. Prepare verify payload
      const verifyPayload = {
        id: pendingPayload.id, // ID is needed here, as per your authService definition
        vaultOTP: otpValue,
        vaultOTPToken: pendingPayload.vaultOTPToken,
      };

      const res = await authService.verifyCollectoOtp(verifyPayload);
      
      const verified = res?.data?.verified;
      
      if (verified) {
        console.log(`Login Successful as ${pendingPayload.type.toUpperCase()}! Redirecting...`);
        setError(res?.message ?? "Login successful.");

        if (pendingPayload.type === 'client') {
          navigate('/dashboard');
        } else if (pendingPayload.type === 'staff') {
          navigate('/staff/dashboard'); // Use staff route
        } else {
          navigate('/');
        }
        
      } else {
        // Note: authService returns data, not data.data, so accessing message directly
        setError(res?.message ?? "Invalid OTP. Please try again.");
      }
      
    } catch (err: any) {
      console.error("verifyCollectoOtp error:", err);
      setError(err?.message ?? "Verification failed. Check console for details.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Resend OTP Logic ---
  const handleResendOtp = async () => {
    if (!pendingPayload || isProcessing) return;

    setIsProcessing(true);
    setError('');

    try {
      const payload = buildAuthPayload(pendingPayload.type, pendingPayload.id);
      const resendPayload = { type: payload.type, cid: payload.cid, uid: payload.uid }; 
      
      // Re-use startCollectoAuth to resend OTP
      const res = await authService.startCollectoAuth(resendPayload as any); 
      
      const message = res?.data?.message ?? res?.message ?? "OTP resent successfully.";
      setError(message);
      
    } catch (e: any) {
      setError(e?.message ?? "Unable to resend OTP.");
    } finally {
      setIsProcessing(false);
    }
  };
  
  // --- Back to ID Entry Logic ---
  const handleBackToIdEntry = () => {
    setLoginStep('id_entry');
    setPendingPayload(null);
    setOtpValue('');
    setError('');
  };

  // --- Rendering Helpers (unchanged, but cleaner) ---
  const getFormTitle = () => {
    if (loginStep === 'id_entry') {
      return userType === 'client' ? "Client Access" : "Staff Portal";
    }
    return "Verify Identity";
  };
  
  const getPlaceholderText = () => {
    return userType === 'client' ? "Enter Client ID or Email" : "Enter Staff User ID";
  };
  
  // --- Tab Button Component (unchanged) ---
  const TabButton: React.FC<{ type: UserType; icon: React.FC<any>; label: string }> = ({ type, icon: Icon, label }) => (
    <button
      onClick={() => {
        setUserType(type);
        handleBackToIdEntry(); // Reset everything on tab change
      }}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-t-xl transition-all duration-200
        ${userType === type
          ? 'bg-white text-[#67095D] shadow-inner'
          : 'bg-transparent text-gray-400 hover:text-white border-b-2 border-transparent hover:border-[#3f0b31]'
        }
      `}
      disabled={isProcessing}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      
      {/* --- Background Image Container (z-0) --- */}
      <div className="absolute inset-0 z-0">
        <img 
          src={BACKGROUND_IMAGE_PATH} 
          alt="Login Background" 
          className="w-full h-full object-cover" 
        />
        {/* Dark overlay using a deep gradient from your palette for better text contrast */}
        <div className="absolute inset-0" style={{ 
          background: 'linear-gradient(to top, rgba(24, 1, 14, 0.9), rgba(103, 9, 93, 0.5))' 
        }} />
      </div>

      {/* --- Login Content (z-10) --- */}
      <div className="w-full max-w-md mx-auto relative z-10">
        
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <p className="text-sm font-medium text-gray-300 mt-2">Secure Login Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          
          {/* Tabs */}
          <div className="flex" style={{ backgroundColor: '#2b0a1f' }}>
            <TabButton type="client" icon={User} label="Client" />
            <TabButton type="staff" icon={Briefcase} label="Staff" />
          </div>

          <div className="p-8 space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 text-center">{getFormTitle()}</h2>

            {/* Error/Server Message Banner */}
            {error && (
                <div className={`p-3 text-sm rounded-md text-center font-medium ${
                    error.includes('successful') || error.includes('sent') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                    {error}
                </div>
            )}

            {/* --- Step 1: ID Entry Form --- */}
            {loginStep === 'id_entry' && (
              <form onSubmit={handleIdSubmit} className="space-y-6">
                
                <div className="relative">
                  <label htmlFor="user_id" className="block text-sm font-medium text-gray-700 mb-1">
                    {userType === 'client' ? 'Client ID / Email' : 'User ID'}
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                      {userType === 'client' ? <User className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
                    </span>
                    <input
                      type="text"
                      id="user_id"
                      value={idValue}
                      onChange={(e) => { setIdValue(e.target.value); setError(''); }}
                      placeholder={getPlaceholderText()}
                      className="flex-1 min-w-0 block w-full px-3 py-2 border border-gray-300 rounded-none rounded-r-md focus:ring-[#67095D] focus:border-[#67095D] sm:text-sm"
                      required
                      disabled={isProcessing}
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white transition-colors 
                      ${isProcessing ? 'bg-gray-400 cursor-wait' : 'bg-[#EF4155] hover:bg-[#CB0D6C] focus:ring-[#EF4155]'}`}
                >
                  {isProcessing ? (
                      <RotateCw className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                      <>
                          Continue to OTP <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                  )}
                </button>
                
                <div className="text-center">
                    <button 
                      type="button" 
                      onClick={() => alert("Redirecting to Password Recovery...")}
                      className="text-sm font-medium text-[#67095D] hover:text-[#EF4155] transition-colors"
                      disabled={isProcessing}
                    >
                      Forgot Password?
                    </button>
                </div>
              </form>
            )}

            {/* --- Step 2: OTP Entry Form --- */}
            {loginStep === 'otp_entry' && pendingPayload && (
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                
                <div className="text-center p-3 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-2 flex items-center justify-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500"/> OTP sent for **{pendingPayload.id}**
                    </p>
                    <p className="text-xs text-gray-400">Please check your email or SMS.</p>
                </div>

                <div className="relative">
                  <label htmlFor="otp_code" className="block text-sm font-medium text-gray-700 mb-1">
                    One-Time Password (OTP)
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="otp_code"
                      value={otpValue}
                      onChange={(e) => { setOtpValue(e.target.value); setError(''); }}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      pattern="\d{6}"
                      className="block w-full text-center px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-[#67095D] focus:border-[#67095D] text-lg font-bold tracking-widest"
                      required
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white transition-colors 
                      ${isProcessing ? 'bg-gray-400 cursor-wait' : 'bg-[#67095D] hover:bg-[#880666] focus:ring-[#67095D]'}`}
                >
                  {isProcessing ? (
                      <RotateCw className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                      <>
                          <Lock className="w-5 h-5 mr-2" /> Secure Login
                      </>
                  )}
                </button>
                
                <div className="text-center space-y-2 pt-2">
                    <button 
                      type="button" 
                      onClick={handleBackToIdEntry}
                      className="text-xs font-medium text-gray-500 hover:text-gray-700 block"
                      disabled={isProcessing}
                    >
                      ← Back to ID Entry
                    </button>
                    <button 
                      type="button" 
                      onClick={handleResendOtp}
                      className="text-xs font-medium text-[#EF4155] hover:text-[#FFA727] block"
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Resending...' : 'Resend OTP'}
                    </button>
                </div>
              </form>
            )}

          </div>
        </div>
        
        {/* Footer Text */}
        <p className="text-center text-xs text-gray-400 mt-6 relative z-10">
            © {new Date().getFullYear()} CollectoVault. All rights reserved.
        </p>
      </div>
    </div>
  );
}