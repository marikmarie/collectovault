import React, { useState } from 'react';
import { User, Briefcase, ArrowRight, RotateCw, ShieldCheck, ChevronLeft, AtSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; 
import { authService } from '../api/authService';
import { useTheme } from '../theme/ThemeProvider';
import { setVaultOtpToken, getVaultOtpToken } from '../api';
import { customerService } from '../api/customer';
import SetUsernameModal from '../components/SetUsernameModal';

type UserType = 'client' | 'business';
type PendingPayload = {
  type: UserType;
  id: string; 
  vaultOTPToken?: string | null;
};

export default function LoginPage() {
  const navigate = useNavigate(); 
  
  const [userType, setUserType] = useState<UserType>('client');
  const [loginStep, setLoginStep] = useState<'id_entry' | 'otp_entry'>('id_entry');
  const [idOrUsername, setIdOrUsername] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<PendingPayload | null>(null);
  const [showSetUsernameModal, setShowSetUsernameModal] = useState(false);
  const [showClientIdDialog, setShowClientIdDialog] = useState(false);
  const [clientIdForUsername, setClientIdForUsername] = useState('');

  const buildAuthPayload = (type: UserType, id: string) => {
    const basePayload = { type, id };
    if (type === 'client') return { ...basePayload, cid: id, uid: undefined }; 
    return { ...basePayload, cid: undefined, uid: id }; 
  };

  const attemptLogin = async (input: string) => {
    setError('');
    setIsProcessing(true);

    if (input.length < 3) {
      setError(`Please enter a valid ID or username.`);
      setIsProcessing(false);
      return;
    }

    try {
      let resolvedId = input;
      let resolvedType = userType;

      // Try as username first (if input looks like a username - contains letters/underscores)
      if (/^[a-zA-Z0-9_-]+$/.test(input) && input.length < 50) {
        try {
          const userInfo = await authService.getClientIdByUsername(input);
          resolvedId = userInfo.clientId;
          resolvedType = userInfo.type || userType;
        } catch (usernameErr) {
          // Username not found, try as client ID
        }
      }

      // Try as client ID
      const { id, type } = buildAuthPayload(resolvedType, resolvedId);
      const res = await authService.startCollectoAuth({ type, id } as any);
      const inner = res?.data ?? null;
      
      const returnedToken = inner?.data?.vaultOTPToken ?? inner?.vaultOTPToken ?? null;
      
      if (returnedToken) {
        const expiryIso = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        setVaultOtpToken(returnedToken, expiryIso);
        setPendingPayload({ type, id: resolvedId, vaultOTPToken: returnedToken });
        setLoginStep('otp_entry');
        return;
      }

      if (res?.auth === true && res?.status === "error") {
        const existingToken = getVaultOtpToken();
        if (existingToken) {
          setPendingPayload({ type, id: resolvedId, vaultOTPToken: existingToken });
          setLoginStep('otp_entry');
        } else {
          setError("Please wait before requesting a new OTP.");
        }
        return;
      }
      
      setError(inner?.message ?? res?.message ?? "ID or username not found.");
    } catch (err: any) {
      setError(err?.message ?? "Network or service error.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await attemptLogin(idOrUsername);
  };

  const handleSetUsernameClick = () => {
    setShowClientIdDialog(true);
    setClientIdForUsername('');
  };

  const handleClientIdSubmit = () => {
    if (clientIdForUsername.trim().length < 3) {
      setError('Please enter a valid client ID');
      return;
    }
    setShowClientIdDialog(false);
    setShowSetUsernameModal(true);
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

    try {
      const verifyPayload = {
        id: pendingPayload!.id,
        type: pendingPayload!.type,
        vaultOTP: otpValue,
        vaultOTPToken: pendingPayload!.vaultOTPToken!,
      };

      const res = await authService.verifyCollectoOtp(verifyPayload);
      const verified = Boolean(res?.data?.data?.verified ?? res?.data?.authVerify ?? false);

      if (verified) {
        const name = res?.data?.data?.name;
        if (name) localStorage.setItem('userName', String(name).trim());

        // If this is a client login, create/upsert the customer on the Collecto backend
        try {
          if (pendingPayload!.type === 'client') {
            const collectoId = localStorage.getItem('collectoId') || '';
            const payload = {
              collecto_id: collectoId,
              client_id: pendingPayload!.id,
              name: name ?? undefined,
            };
            // fire-and-forget but await to surface errors if desired
            await customerService.createCustomer(payload);
          }
        } catch (err) {
          // don't block login on customer creation failure, but log it
          console.warn('Failed to create customer record:', err);
        }

        navigate(pendingPayload!.type === 'client' ? '/dashboard' : '/adminDashboard');
      } else {
        setError("Invalid verification code.");
      }
    } catch (err: any) {
      setError("Verification failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingPayload || isProcessing) return;
    setIsProcessing(true);
    try {
      const payload = buildAuthPayload(pendingPayload.type, pendingPayload.id);
      await authService.startCollectoAuth({ type: payload.type, cid: payload.cid, uid: payload.uid } as any); 
      setError("A new code has been sent.");
    } catch (e) {
      setError("Unable to resend code.");
    } finally {
      setIsProcessing(false);
    }
  };

  const { theme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#F9FAFB]">
      <div className="w-full max-w-[400px]">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <img src={theme.logoUrl ?? "/logo.png"} alt="Logo" className="h-12 w-auto mb-2" />
          <p className="text-gray-600 text-xs font-medium uppercase tracking-[0.2em]">Earn & Thrive</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden border border-gray-100">
          
          {/* User Type Switcher */}
          {loginStep === 'id_entry' && (
            <div className="flex p-1.5 bg-gray-50/50 border-b border-gray-100">
              <button
                onClick={() => setUserType('client')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 ${
                  userType === 'client' ? 'bg-white shadow-sm text-[#67095D]' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <User className="w-3.5 h-3.5" /> CLIENT
              </button>
              <button
                onClick={() => setUserType('business')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 ${
                  userType === 'business' ? 'bg-white shadow-sm text-[#67095D]' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" /> BUSINESS
              </button>
            </div>
          )}

          <div className="p-8">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                {loginStep === 'id_entry' ? 'Sign In' : 'Verify Identity'}
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                {loginStep === 'id_entry' 
                  ? `Enter your ID or username to continue` 
                  : 'Enter the 6-digit code sent to your device'}
              </p>
            </div>

            {error && (
              <div className={`mb-6 p-3 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${
                error.toLowerCase().includes('sent') || error.toLowerCase().includes('success')
                ? 'bg-emerald-50 text-emerald-700' 
                : 'bg-rose-50 text-rose-700'
              }`}>
                <ShieldCheck className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {loginStep === 'id_entry' ? (
              <form onSubmit={handleIdSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">
                    ID or Username
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#d81b60] transition-colors">
                      <AtSign size={18} />
                    </div>
                    <input
                      type="text"
                      value={idOrUsername}
                      onChange={(e) => { setIdOrUsername(e.target.value); setError(''); }}
                      placeholder="Enter ID or username"
                      className="block w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#67095D]/5 focus:border-[#67095D] focus:bg-white transition-all outline-none text-sm font-medium"
                      required
                      disabled={isProcessing}
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center py-4 px-4 rounded-2xl text-sm font-bold text-gray-800 bg-[#e1d7e0] hover:bg-[#b6adb5] shadow-lg shadow-[#67095D]/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isProcessing ? <RotateCw className="w-5 h-5 animate-spin" /> : (
                    <>Continue <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSetUsernameClick}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-semibold text-[#d81b60] bg-[#d81b60]/10 hover:bg-[#d81b60]/20 border border-[#d81b60]/20 transition-all"
                >
                  <User size={16} /> Create Username
                </button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="flex flex-col items-center">
                  <input
                    type="text"
                    value={otpValue}
                    onChange={(e) => { 
                        const val = e.target.value.replace(/\D/g, '');
                        if(val.length <= 6) setOtpValue(val); 
                        setError(''); 
                    }}
                    placeholder=""
                    className="block w-full text-center py-4 bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-2xl focus:border-[#67095D] focus:bg-white transition-all outline-none text-3xl font-bold tracking-[0.4em] text-gray-800"
                    maxLength={6}
                    required
                    autoFocus
                    disabled={isProcessing}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center py-4 px-4 rounded-2xl text-sm font-bold text-gray-700 bg-[#cec9ce] hover:bg-[#b8afb7] shadow-lg shadow-[#67095D]/20 transition-all disabled:opacity-50"
                >
                  {isProcessing ? <RotateCw className="w-5 h-5 animate-spin" /> : 'Verify Code'}
                </button>
                
                <div className="flex flex-col gap-4 pt-2">
                    <button 
                        onClick={handleResendOtp} 
                        type="button" 
                        disabled={isProcessing}
                        className="text-xs font-bold text-gray-700 hover:text-gray-900 transition-colors flex items-center justify-center gap-1.5"
                    >
                        <RotateCw className="w-3 h-3" /> RESEND CODE
                    </button>
                    <button 
                        onClick={() => { setLoginStep('id_entry'); setError(''); }} 
                        type="button" 
                        className="text-xs font-medium text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1"
                    >
                        <ChevronLeft className="w-3.5 h-3.5" /> Use a different ID
                    </button>
                </div>
              </form>
            )}
          </div>
        </div>
        
        {showClientIdDialog && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Enter Client ID</h3>
              <p className="text-sm text-gray-500 mb-4">Please enter your client ID to create a username</p>
              
              {error && (
                <div className="mb-4 p-3 rounded-xl text-xs font-medium bg-rose-50 text-rose-700">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#67095D] transition-colors">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    value={clientIdForUsername}
                    onChange={(e) => {
                      setClientIdForUsername(e.target.value);
                      setError('');
                    }}
                    placeholder="e.g., 324CV38"
                    className="block w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#67095D]/5 focus:border-[#67095D] focus:bg-white transition-all outline-none text-sm font-medium"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowClientIdDialog(false);
                      setClientIdForUsername('');
                      setError('');
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClientIdSubmit}
                    className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-[#d81b60] hover:bg-[#b5164d] transition-all"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {showSetUsernameModal && (
          <SetUsernameModal 
            isOpen={showSetUsernameModal}
            onClose={() => setShowSetUsernameModal(false)}
            onSuccess={() => {
              setShowSetUsernameModal(false);
              setClientIdForUsername('');
              setError('Username created successfully!');
            }}
            existingUsername={localStorage.getItem('userName') || undefined}
            clientId={clientIdForUsername}
          />
        )}
        
        <p className="text-center mt-10 text-[11px] font-medium text-gray-500 uppercase tracking-widest">
          ••• © 2026 CollectoVault ••• 
        </p>
      </div>
    </div>
  );
}