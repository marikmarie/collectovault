import React, { useState } from "react";
import { createRating } from "../api/feedback";
import Modal from "./Modal";
import Button from "./Button";

interface RatingModalProps {
  open: boolean;
  onClose: () => void;
  customerId: number;
  transactionId: number;
  onSuccess?: () => void;
}

interface StarRatingProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function StarRating({ label, value, onChange }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            className={`text-3xl transition-colors ${
              star <= (hoverValue || value)
                ? "text-yellow-400"
                : "text-gray-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>
      {value > 0 && <p className="text-sm text-gray-500 mt-1">{value} star(s)</p>}
    </div>
  );
}

export default function RatingModal({
  open,
  onClose,
  customerId,
  transactionId,
  onSuccess,
}: RatingModalProps) {
  const [orderRating, setOrderRating] = useState(0);
  const [paymentRating, setPaymentRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [overallRating, setOverallRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      orderRating === 0 ||
      paymentRating === 0 ||
      serviceRating === 0 ||
      overallRating === 0
    ) {
      setError("Please rate all categories");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createRating({
        customerId,
        transactionId,
        orderRating,
        paymentRating,
        serviceRating,
        overallRating,
        comment: comment || undefined,
      });

      // Reset form
      setOrderRating(0);
      setPaymentRating(0);
      setServiceRating(0);
      setOverallRating(0);
      setComment("");
      onClose();
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to submit rating");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Rate Your Experience"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          Please rate your experience with our service
        </p>

        <StarRating
          label="Order Quality"
          value={orderRating}
          onChange={setOrderRating}
        />

        <StarRating
          label="Payment Experience"
          value={paymentRating}
          onChange={setPaymentRating}
        />

        <StarRating
          label="Service Quality"
          value={serviceRating}
          onChange={setServiceRating}
        />

        <StarRating
          label="Overall Experience"
          value={overallRating}
          onChange={setOverallRating}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Comments (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your feedback..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">{comment.length}/500</p>
        </div>

        {error && <div className="p-2 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? "Submitting..." : "Submit Rating"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
