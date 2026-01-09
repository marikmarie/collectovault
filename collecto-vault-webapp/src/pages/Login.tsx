import React, { useState } from 'react';
import { User, Briefcase, Lock, ArrowRight, Mail, RotateCw, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; 
import { authService } from '../api/authService';
import { setVaultOtpToken, getVaultOtpToken } from '../api';

type UserType = 'client' | 'staff' ;
type PendingPayload = {
  type: UserType;
  id: string; 
  vaultOTPToken?: string | null;
};

export default function LoginPage() {
  const navigate = useNavigate(); 
    
  const [userType, setUserType] = useState<UserType>('client');
  const [loginStep, setLoginStep] = useState<'id_entry' | 'otp_entry'>('id_entry');
  const [idValue, setIdValue] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<PendingPayload | null>(null);

  const buildAuthPayload = (type: UserType, id: string) => {
    const basePayload = { type, id };
    if (type === 'client') return { ...basePayload, cid: id, uid: undefined }; 
    return { ...basePayload, cid: undefined, uid: id }; 
  };

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
      const { id, type } = buildAuthPayload(userType, idValue);
      const apiPayload = { type, id }; 
      const res = await authService.startCollectoAuth(apiPayload as any);
      const root = res;
      const inner = root?.data ?? null;
      
      if (!root) {
        setError("Authorization failed. Unexpected server response.");
        return;
      }

      const returnedToken = inner?.data?.vaultOTPToken ?? inner?.vaultOTPToken ?? null;
      
      if (returnedToken) {
        const expiryIso = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        setVaultOtpToken(returnedToken, expiryIso);
        setPendingPayload({ type, id: idValue, vaultOTPToken: returnedToken });
        setLoginStep('otp_entry');
        setError(inner?.message ?? "OTP sent — check your registered channel.");
        return;
      }

      if (root?.auth === true && root?.status === "error") {
        const existingToken = getVaultOtpToken();
        if (existingToken) {
          setPendingPayload({ type, id: idValue, vaultOTPToken: existingToken });
          setLoginStep('otp_entry');
          setError(root?.message ?? "You already have an active OTP session.");
        } else {
          setError("You must wait before requesting a new OTP.");
        }
        return;
      }
      setError(inner?.message ?? root?.message ?? "Authorization failed.");
    } catch (err: any) {
      setError(err?.message ?? "Network or service error.");
    } finally {
      setIsProcessing(false);
    }
  };

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
      setError("No active session. Please restart.");
      handleBackToIdEntry();
      setIsProcessing(false);
      return;
    }

    try {
      const verifyPayload = {
        id: pendingPayload.id, 
        vaultOTP: otpValue,
        vaultOTPToken: pendingPayload.vaultOTPToken,
      };

      const res = await authService.verifyCollectoOtp(verifyPayload);
      const verified = Boolean(res?.data?.data?.verified ?? res?.data?.authVerify ?? res?.authVerify ?? false);
      const message = res?.data?.message ?? res?.status_message ?? res?.message ?? "Login successful.";
      const name = res?.data?.data?.name ?? null;

      if (verified) {
        if (name) localStorage.setItem('userName', String(name).trim());
        const returnedClientId = res?.data?.data?.id ?? res?.data?.id ?? res?.id ?? pendingPayload.id ?? null;
        if (returnedClientId) localStorage.setItem('clientId', String(returnedClientId));
        
        setPendingPayload(null);
        navigate(pendingPayload.type === 'client' ? '/dashboard' : '/staff/dashboard');
      } else {
        setError(message ?? "Invalid OTP.");
      }
    } catch (err: any) {
      setError(err?.message ?? "Verification failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingPayload || isProcessing) return;
    setIsProcessing(true);
    setError('');
    try {
      const payload = buildAuthPayload(pendingPayload.type, pendingPayload.id);
      const res = await authService.startCollectoAuth({ type: payload.type, cid: payload.cid, uid: payload.uid } as any); 
      setError(res?.data?.message ?? "OTP resent successfully.");
    } catch (e: any) {
      setError(e?.message ?? "Unable to resend OTP.");
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleBackToIdEntry = () => {
    setLoginStep('id_entry');
    setPendingPayload(null);
    setOtpValue('');
    setError('');
  };

  const TabButton: React.FC<{ type: UserType; icon: React.FC<any>; label: string }> = ({ type, icon: Icon, label }) => (
    <button
      onClick={() => {
        setUserType(type);
        handleBackToIdEntry();
      }}
      className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all duration-200
        ${userType === type
          ? 'bg-white text-[#67095D] border-b-2 border-[#67095D]'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border-b-2 border-transparent'
        }
      `}
      disabled={isProcessing}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-linear-to-br from-gray-50 to-gray-200">
      <div className="w-full max-w-md">
        
        {/* Logo (no background) */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="CollectoVault Logo" className="h-16 w-auto object-contain" />
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          
          {/* Gray Tabs */}
          <div className="flex">
            <TabButton type="client" icon={User} label="CLIENT" />
            <TabButton type="staff" icon={Briefcase} label="STAFF" />
          </div>

          <div className="p-8">
            {/* Dynamic Title */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                    {loginStep === 'id_entry' ? (userType === 'client' ? 'Welcome Back' : 'Staff Sign In') : 'Verify OTP'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    {loginStep === 'id_entry' ? 'Enter your credentials to continue' : 'Secure verification required'}
                </p>
            </div>

            {error && (
              <div className={`mb-6 p-4 text-sm rounded-xl flex items-center gap-3 border ${
                error.includes('successful') || error.includes('sent') 
                ? 'text-green-700 border-green-100 bg-green-50' 
                : 'text-red-700 border-red-100 bg-red-50'
              }`}>
                <ShieldCheck className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            {loginStep === 'id_entry' ? (
              <form onSubmit={handleIdSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {userType === 'client' ? 'Client ID / Email' : 'Staff User ID'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      {userType === 'client' ? <User size={18} /> : <Briefcase size={18} />}
                    </div>
                    <input
                      type="text"
                      value={idValue}
                      onChange={(e) => { setIdValue(e.target.value); setError(''); }}
                      placeholder={userType === 'client' ? "e.g. CLI-12345" : "e.g. STF-001"}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#67095D] focus:border-transparent bg-gray-50 transition-all text-sm"
                      required
                      disabled={isProcessing}
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl shadow-lg text-sm font-bold text-gray-700 bg-[#f8f5f8] hover:bg-[#c5bdc4] active:scale-[0.98] transition-all disabled:opacity-70"
                >
                  {isProcessing ? <RotateCw className="w-5 h-5 animate-spin" /> : (
                    <>Next Step <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </button>
                
                <button type="button" className="w-full text-center text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                  Trouble logging in? Contact Support
                </button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200 text-center">
                    <Mail className="w-5 h-5 text-[#67095D] mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Verification code sent to</p>
                    <p className="text-sm font-bold text-gray-900">{pendingPayload?.id}</p>
                </div>

                <input
                  type="text"
                  value={otpValue}
                  onChange={(e) => { setOtpValue(e.target.value); setError(''); }}
                  placeholder="0 0 0 0 0 0"
                  className="block w-full text-center py-4 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-[#67095D] focus:border-transparent text-2xl font-black tracking-[0.5em] bg-gray-50 transition-all"
                  maxLength={6}
                  required
                  disabled={isProcessing}
                />

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl shadow-lg text-sm font-bold text-gray-700 bg-[#f0e8ef] hover:bg-[#c0bdc0] transition-all"
                >
                  {isProcessing ? <RotateCw className="w-5 h-5 animate-spin" /> : (
                    <><Lock className="w-4 h-4 mr-2" /> Verify & Access</>
                  )}
                </button>
                
                <div className="flex items-center justify-between pt-2">
                    <button onClick={handleBackToIdEntry} type="button" className="text-xs font-bold text-gray-400 hover:text-gray-600">
                      ← CHANGE ID
                    </button>
                    <button onClick={handleResendOtp} disabled={isProcessing} type="button" className="text-xs font-bold text-[#67095D] hover:underline uppercase">
                      Resend Code
                    </button>
                </div>
              </form>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-center mt-8">
          <p className="text-xs text-gray-400">© 2026 CollectoVault. All rights reserved.</p>
         </div>
      </div>
    </div>
  );
}