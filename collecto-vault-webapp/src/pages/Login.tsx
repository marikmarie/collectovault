import type { JSX } from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { authService } from "../api/authService"; // Ensure these paths match your project
import { setVaultOtpToken, getVaultOtpToken } from "../api";

// --- Icons (Inline SVGs for portability) ---
const Icons = {
  Business: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  User: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Staff: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  ),
  Lock: () => (
    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  ShieldCheck: () => (
    <svg className="w-12 h-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
};

// --- Types ---
type FormValues = {
  type: "business" | "client" | "staff";
  id?: string;
};

type OtpValues = {
  vaultOTP: string;
};

export default function Login(): JSX.Element {
  const navigate = useNavigate();
  const [step, setStep] = useState<"identifiers" | "otp">("identifiers");
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedType, setSelectedType] = useState<FormValues["type"]>("client");
  const [pendingPayload, setPendingPayload] = useState<
    (Partial<FormValues> & { vaultOTPToken?: string | null }) | null
  >(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormValues>({
    defaultValues: { type: "client", id: "" },
  });

  // Sync state selection with form
  useEffect(() => {
    setValue("type", selectedType);
  }, [selectedType, setValue]);

  // --- Handlers ---

  const onIdentifiersSubmit = async (data: FormValues) => {
    setServerMessage(null);
    setIsProcessing(true);

    try {
      if (!data.id) {
        setServerMessage("An ID is required");
        return;
      }
      const payload = { type: data.type, id: data.id };
      const res = await authService.startCollectoAuth(payload);

      const root = res?.data;
      const inner = root?.data ?? null;

      if (!root) {
        setServerMessage(root?.message ?? root?.status_message ?? "Unexpected server response");
        return;
      }

      const returnedToken = inner?.data?.vaultOTPToken ?? inner?.vaultOTPToken ?? null;
      
      if (returnedToken) {
        const expiryIso = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        setVaultOtpToken(returnedToken, expiryIso);
        setPendingPayload({ ...payload, vaultOTPToken: returnedToken });
        setStep("otp");
        setServerMessage(inner?.message ?? "OTP sent — check your Collecto Vault app or SMS");
        return;
      }

      // Handle existing session error logic
      if (root?.auth === true && root?.status === "error") {
        const existingToken = getVaultOtpToken();
        if (existingToken) {
          setPendingPayload({ ...payload, vaultOTPToken: existingToken });
          setStep("otp");
          setServerMessage(root?.message ?? "You have an active session. Enter your OTP.");
        } else {
          setServerMessage("You must wait before requesting a new OTP.");
        }
        return;
      }

      if (inner?.status === "error") {
        setServerMessage(inner?.message ?? "Authorization error");
        return;
      }

      setServerMessage(inner?.message ?? root?.message ?? "Unexpected server response");
    } catch (err: any) {
      console.error("startCollectoAuth error:", err);
      setServerMessage(err?.message ?? "Authorization failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const {
    register: registerOtp,
    handleSubmit: handleSubmitOtp,
    formState: { errors: otpErrors },
  } = useForm<OtpValues>();

  const onOtpSubmit = async (data: OtpValues) => {
    if (!pendingPayload?.vaultOTPToken) {
      setServerMessage("No active authentication session. Start again.");
      setStep("identifiers");
      return;
    }

    setIsProcessing(true);
    try {
      const verifyPayload: any = {
        ...pendingPayload,
        vaultOTP: data.vaultOTP,
        vaultOTPToken: pendingPayload.vaultOTPToken,
      };

      const res = await authService.verifyCollectoOtp(verifyPayload);
      const verified = res?.data?.data?.verified;
      
      if (!verified) {
        setServerMessage(res?.data?.message ?? "OTP verification failed");
        return;
      }

      // Success
      const userType = pendingPayload.type;
      if (userType === "business") navigate("/vendor/dashboard");
      else if (userType === "client") navigate("/dashboard");
      else if (userType === "staff") navigate("/staff/dashboard");
      else navigate("/");

    } catch (err: any) {
      console.error(err);
      setServerMessage(err?.message ?? "Verification failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const onBackToIdentifiers = () => {
    setStep("identifiers");
    setPendingPayload(null);
    setServerMessage(null);
  };

  const typeOptions: { value: FormValues["type"]; label: string; icon: any }[] = [
    { value: "client", label: "Client", icon: Icons.User },
    { value: "business", label: "Business", icon: Icons.Business },
    { value: "staff", label: "Staff", icon: Icons.Staff },
  ];

  // --- Render ---

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl relative z-10 overflow-hidden">
        
        {/* Header Section */}
        <div className="pt-8 pb-6 px-8 text-center border-b border-slate-800/50 bg-slate-900/50">
           <div className="flex justify-center mb-4">
             <div className="p-3 bg-slate-800 rounded-full ring-1 ring-slate-700 shadow-inner">
               <Icons.ShieldCheck />
             </div>
           </div>
           <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
             {step === "identifiers" ? "Welcome Back" : "Security Check"}
           </h1>
           <p className="text-sm text-slate-400 mt-2">
             {step === "identifiers" 
               ? "Select your account type to continue" 
               : "Enter the code sent to your device"}
           </p>
        </div>

        <div className="p-8 pt-6">
          {/* --- Step 1: Identifiers --- */}
          {step === "identifiers" && (
            <form onSubmit={handleSubmit(onIdentifiersSubmit)} className="space-y-6" noValidate>
              
              {/* Type Selector */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
                {typeOptions.map((t) => {
                  const Icon = t.icon;
                  const isActive = selectedType === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setSelectedType(t.value)}
                      className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-md text-xs font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-slate-800 text-emerald-400 shadow-sm ring-1 ring-slate-700"
                          : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"
                      }`}
                    >
                      <span className="mb-1"><Icon /></span>
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <input type="hidden" {...register("type")} />

              {/* ID Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                  {selectedType} ID
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                      <Icons.User />
                    </span>
                  </div>
                  <input
                    {...register("id", { required: "ID is required" })}
                    className={`block w-full rounded-lg pl-10 pr-3 py-3 bg-slate-950 border ${
                      errors.id 
                        ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20" 
                        : "border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                    } text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-4 transition-all`}
                    placeholder={`Enter your ${selectedType} ID`}
                  />
                </div>
                {errors.id && (
                  <p className="text-xs text-rose-400 ml-1">{errors.id.message}</p>
                )}
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Connecting...
                  </span>
                ) : (
                  "Continue Securely"
                )}
              </button>
            </form>
          )}

          {/* --- Step 2: OTP --- */}
          {step === "otp" && (
            <form onSubmit={handleSubmitOtp(onOtpSubmit)} className="space-y-6">
              
              <div className="space-y-2">
                 <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                  One-Time Password
                </label>
                <div className="relative group">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Icons.Lock />
                   </div>
                  <input
                    {...registerOtp("vaultOTP", { required: "OTP is required" })}
                    autoFocus
                    maxLength={6}
                    className={`block w-full rounded-lg pl-10 pr-3 py-3 bg-slate-950 border ${
                      otpErrors.vaultOTP 
                        ? "border-rose-500/50 focus:border-rose-500" 
                        : "border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                    } text-slate-200 text-lg tracking-[0.2em] placeholder-slate-700 font-mono text-center focus:outline-none focus:ring-4 transition-all`}
                    placeholder="000000"
                  />
                </div>
                 {otpErrors.vaultOTP && (
                  <p className="text-xs text-rose-400 ml-1">{otpErrors.vaultOTP.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                 <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
                >
                  {isProcessing ? "Verifying..." : "Verify & Login"}
                </button>

                <div className="flex items-center justify-between text-sm mt-2">
                  <button
                    type="button"
                    onClick={onBackToIdentifiers}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    ← Change ID
                  </button>
                  <button
                    type="button"
                    className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
                    onClick={async () => {
                      if (!pendingPayload) return;
                      setIsProcessing(true);
                      try {
                        const r = await authService.startCollectoAuth(pendingPayload as any);
                        setServerMessage(r?.data?.message ?? "OTP resent successfully");
                      } catch (e: any) {
                        setServerMessage(e?.message ?? "Unable to resend OTP");
                      } finally {
                        setIsProcessing(false);
                      }
                    }}
                  >
                    Resend Code
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Status Messages */}
          {serverMessage && (
            <div className={`mt-6 p-3 rounded-lg text-sm text-center border animate-in fade-in slide-in-from-top-1 duration-200 ${
              serverMessage.includes("success") 
                ? "bg-emerald-900/30 border-emerald-800 text-emerald-200" 
                : "bg-amber-900/20 border-amber-900/50 text-amber-200"
            }`}>
              {serverMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}