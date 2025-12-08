import type { JSX } from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { authService } from "../api/authService";
import { setVaultOtpToken, getVaultOtpToken } from "../api";


type FormValues = {
  type: "business" | "client" | "staff";
  id?: string;
};

type OtpValues = {
  vaultOTP: string;
};

export default function LoginForm(): JSX.Element {
  const navigate = useNavigate();
  const [step, setStep] = useState<"identifiers" | "otp">("identifiers");
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedType, setSelectedType] =
    useState<FormValues["type"]>("client");
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

  useEffect(() => {
    setValue("type", selectedType);
  }, [selectedType, setValue]);

 
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
      //console.log("startCollectoAuth response:", res);

      const root = res?.data;
      const inner = root?.data ?? null;

      if (!root) {
        setServerMessage(
          root?.message ?? root?.status_message ?? "Unexpected server response"
        );
        return;
      }

      const returnedToken =
        inner?.data?.vaultOTPToken ??
        inner?.vaultOTPToken ??
        null;
      
      if (returnedToken) {
        const expiryIso =new Date(Date.now() + 15 * 60 * 1000).toISOString();
        setVaultOtpToken(returnedToken, expiryIso);
        setPendingPayload({ ...payload, vaultOTPToken: returnedToken });
        setStep("otp");
        setServerMessage(
          inner?.message ?? "OTP sent — check your Collecto Vault app or SMS"
        );
        return;
      }

      if (root?.auth === true && root?.status === "error") {
        const existingToken = getVaultOtpToken();
         console.log(existingToken);

        if (existingToken) {
          setPendingPayload({ ...payload, vaultOTPToken: existingToken });
          setStep("otp");
          setServerMessage(
            root?.message ??
              "You already have an active OTP session. Enter your OTP."
          );
        } else {
          setServerMessage("You must wait before requesting a new OTP.");
        }
        return;
      }

      if (inner?.status === "error") {
        setServerMessage(inner?.message ?? "Authorization error");
        return;
      }

      setServerMessage(
        inner?.message ?? root?.message ?? "Unexpected server response"
      );
    } catch (err: any) {
      console.error("startCollectoAuth error:", err);
      setServerMessage(err?.message ?? "Authorization failed");
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
      console.log("✅ verifyCollectoOtp response:", res);

      const verified = res?.data?.data?.verified;
      if (!verified) {
        setServerMessage(res?.data?.message ?? "OTP verification failed");
        return;
      }

      setServerMessage(res?.data?.message ?? "OTP verified successfully");

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

  const typeOptions: { value: FormValues["type"]; label: string }[] = [
    { value: "business", label: "Business" },
    { value: "client", label: "Client" },
    { value: "staff", label: "Staff" },
  ];

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="mb-4">
        <div className="flex gap-2 justify-center">
          {typeOptions.map((t) => (
            <button
              key={t.value}
              onClick={() => setSelectedType(t.value)}
              className={`px-3 py-2 rounded-full text-sm font-medium ${
                selectedType === t.value
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-700 text-slate-200"
              }`}
              type="button"
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          Select account type
        </p>
      </div>

      {step === "identifiers" && (
        <form
          onSubmit={handleSubmit(onIdentifiersSubmit)}
          className="space-y-4"
          noValidate
        >
          <input type="hidden" {...register("type")} />
          <div>
            <label className="block text-sm text-slate-200">
              {selectedType === "client"
                ? "Client ID"
                : selectedType === "staff"
                ? "Staff UID"
                : "Business ID"}
            </label>
            <input
              {...register("id", { required: "ID is required" })}
              className={`mt-1 block w-full rounded-md px-3 py-2 bg-slate-900/40 border ${
                errors.id ? "border-rose-500" : "border-slate-700"
              } placeholder-slate-400`}
              placeholder={`Enter your ${selectedType} ID`}
            />
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={isProcessing}
              className={`px-5 py-2 rounded-md font-semibold shadow-sm ${
                isProcessing
                  ? "bg-slate-600 cursor-wait"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white"
              }`}
            >
              {isProcessing ? "Starting..." : "Authorize"}
            </button>
          </div>

          {serverMessage && (
            <div className="text-sm text-center text-amber-300">
              {serverMessage}
            </div>
          )}
        </form>
      )}

      {/* Step 2: OTP */}
      {step === "otp" && (
        <div className="space-y-4">
          <form onSubmit={handleSubmitOtp(onOtpSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-200">OTP Code</label>
              <input
                {...registerOtp("vaultOTP", { required: "OTP is required" })}
                className={`mt-1 block w-full rounded-md px-3 py-2 bg-slate-900/40 border ${
                  otpErrors.vaultOTP ? "border-rose-500" : "border-slate-700"
                } placeholder-slate-400`}
                placeholder="123456"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onBackToIdentifiers}
                className="text-sm text-slate-300 hover:underline"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className={`px-5 py-2 rounded-md font-semibold shadow-sm ${
                  isProcessing
                    ? "bg-slate-600 cursor-wait"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white"
                }`}
              >
                {isProcessing ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          </form>

          <div className="text-center text-sm text-slate-400">
            Didn’t get it?{" "}
            <button
              className="underline text-slate-100"
              onClick={async () => {
                if (!pendingPayload) return;
                setIsProcessing(true);
                try {
                  const r = await authService.startCollectoAuth(
                    pendingPayload as any
                  );
                  setServerMessage(r?.data?.message ?? "OTP resent");
                } catch (e: any) {
                  setServerMessage(e?.message ?? "Unable to resend OTP");
                } finally {
                  setIsProcessing(false);
                }
              }}
            >
              Resend
            </button>
          </div>

          {serverMessage && (
            <div className="mt-2 text-center text-amber-300">
              {serverMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
