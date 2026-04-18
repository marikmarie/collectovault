import React, { useState } from "react";
import { createFeedback } from "../api/feedback";
import Modal from "./Modal";
import Button from "./Button";

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  customerId: number;
  onSuccess?: () => void;
  initialType?: 'order' | 'service' | 'app' | 'general';
}

export default function FeedbackModal({
  open,
  onClose,
  customerId,
  onSuccess,
  initialType = 'general',
}: FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<'order' | 'service' | 'app' | 'general'>(initialType);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createFeedback({
        customerId,
        feedbackType,
        title: title.trim(),
        message: message.trim(),
      });

      setSuccess(true);
      setTimeout(() => {
        setTitle("");
        setMessage("");
        setFeedbackType('general');
        setSuccess(false);
        onClose();
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Send Feedback"
      size="md"
      noOverlay={true}
    >
      {success ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">✓</div>
          <p className="text-lg font-semibold text-green-600">
            Thank you for your feedback!
          </p>
          <p className="text-sm text-gray-600 mt-2">
            We appreciate your input and will review it soon.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback Category *
            </label>
            <select
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="general">General</option>
              <option value="order">Order Related</option>
              <option value="service">Service Quality</option>
              <option value="app">App/Website</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief subject of your feedback..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={255}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/255</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your feedback in detail..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              maxLength={2000}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{message.length}/2000</p>
          </div>

          {error && (
            <div className="p-2 bg-red-100 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

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
              {loading ? "Sending..." : "Send Feedback"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
