// src/features/customer/BuyPointsModal.tsx
import type { JSX } from "react";
import { useEffect, useState } from "react";
import Modal from "../../components/Modal";
import Card from "../../components/Card";
import Button from "../../components/Button";

type Package = {
  id: number | string;
  points: number;
  price: number;
  label?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

/** Static fallback used during frontend development */
const FALLBACK_PACKAGES: Package[] = [
  { id: "p1", points: 100, price: 5000 },
  { id: "p2", points: 500, price: 10000 },
  { id: "p3", points: 2500, price: 25000 },
];

export default function BuyPointsModal({ open, onClose, onSuccess }: Props): JSX.Element {
  // UI State
  const [packages, setPackages] = useState<Package[]>(FALLBACK_PACKAGES);
  const [selected, setSelected] = useState<string | number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Payment mode
  const [paymentMode, setPaymentMode] = useState<"momo" | "bank">("momo");

  // Phone number local state (no session)
  const [phone, setPhone] = useState("");

  /** Reset modal state whenever opened */
  useEffect(() => {
    if (!open) return;

    setMessage(null);
    setSelected(null);
    setPaymentMode("momo");
    setPhone("");

    // For now we only load mock packages
    setPackages(FALLBACK_PACKAGES);
  }, [open]);

  /** Handle Buy Click (frontend only — no API calls yet) */
  const handleBuy = async () => {
    setMessage(null);

    if (!selected) {
      setMessage("Please select a package first.");
      return;
    }

    if (paymentMode === "momo" && (!phone || phone.trim().length < 10)) {
      setMessage("Please enter a valid phone number for mobile money (MOMO).");
      return;
    }

    setProcessing(true);

    // Simulate a small delay for UI feedback
    setTimeout(() => {
      setProcessing(false);
      setMessage("Purchase initiated (mocked). You can integrate API later.");

      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
      }, 700);
    }, 800);
  };

  return (
    <Modal open={open} onClose={() => !processing && onClose()}>
      <div className="p-4 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-3">Buy points</h3>

        <div className="text-sm text-slate-300 mb-3">
          Choose a points package and pay using mobile money (MOMO).  
          Bank payments are coming soon.
        </div>

        {/* PACKAGES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4" role="list">
          {packages.map((p) => {
            const isSel = String(selected) === String(p.id);
            return (
              <div
                key={String(p.id)}
                onClick={() => setSelected(p.id)}
                role="listitem"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelected(p.id);
                }}
                className="cursor-pointer"
                aria-pressed={isSel}
              >
                <Card
                  className={`p-3 ${
                    isSel
                      ? "ring-2 ring-emerald-400 border-emerald-400/30 shadow-lg"
                      : ""
                  }`}
                >
                  <div>
                    <div className="text-sm text-slate-300">
                      {p.label ?? "Package"}
                    </div>
                    <div className="text-xl font-bold">
                      {p.points.toLocaleString()} pts
                    </div>
                    <div className="text-sm text-slate-400">
                      UGX {p.price.toLocaleString()}
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>

        {/* PAYMENT MODE */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-2">Payment method</div>

          <div className="flex gap-3">
            <label
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer ${
                paymentMode === "momo"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800/40 text-slate-200"
              }`}
            >
              <input
                type="radio"
                name="paymentMode"
                value="momo"
                checked={paymentMode === "momo"}
                onChange={() => setPaymentMode("momo")}
                className="hidden"
                aria-hidden
              />
              <span className="text-sm font-medium">MOMO</span>
              <span className="text-xs text-slate-300">
                Mobile money (Instant)
              </span>
            </label>

            {/* Disabled Bank Option */}
            <label
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-slate-800/30 text-slate-400 cursor-not-allowed"
              title="Bank payments coming soon"
            >
              <input type="radio" name="paymentMode" value="bank" disabled />
              <span className="text-sm font-medium">Bank (soon)</span>
            </label>
          </div>
        </div>

        {/* PHONE INPUT */}
        {paymentMode === "momo" && (
          <div className="mb-4">
            <label className="block text-sm text-slate-200">
              Phone number for MOMO
            </label>

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 256771234567"
              className="mt-1 block w-full rounded-md px-3 py-2 bg-slate-900/40 border border-slate-700 text-white"
              inputMode="tel"
              aria-label="Mobile money phone number"
            />

            <div className="text-xs text-slate-400 mt-1">
              We will use this phone number to simulate mobile money payment.
            </div>
          </div>
        )}

        {/* MESSAGE */}
        {message && (
          <div className="text-sm text-amber-300 mb-3">{message}</div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-3 justify-end">
          <Button variant="ghost" onClick={onClose} disabled={processing}>
            Cancel
          </Button>
          <Button onClick={handleBuy} disabled={processing}>
            {processing ? "Processing..." : "Proceed to payment"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
