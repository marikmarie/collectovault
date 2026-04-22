import { useState, useEffect } from "react";
import { X, AlertCircle, CheckCircle } from "lucide-react";
import { authService } from "../api/authService";

interface SetUsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingUsername?: string | null;
  displayName?: string;
}

export default function SetUsernameModal({
  isOpen,
  onClose,
  onSuccess,
  existingUsername,
  displayName,
}: SetUsernameModalProps) {
  const [username, setUsername] = useState(existingUsername || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (existingUsername) {
      setUsername(existingUsername);
    }
  }, [existingUsername]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmed = username.trim();
    if (!trimmed) {
      setError("Username cannot be empty");
      return;
    }
    if (trimmed.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (trimmed.length > 100) {
      setError("Username cannot exceed 100 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      setError(
        "Username can only contain letters, numbers, underscores, and hyphens"
      );
      return;
    }

    setIsLoading(true);
    try {
      const clientId = localStorage.getItem("clientId") || "";
      const collectoId = localStorage.getItem("collectoId") || "";

      if (!clientId) {
        setError("Client ID not found. Please login again.");
        setIsLoading(false);
        return;
      }

      const resp = await authService.setUsername({
        clientId,
        collectoId,
        username: trimmed,
        action: existingUsername ? "update" : "create",
      });

      if (resp.success) {
        setSuccess("Username updated successfully!");
        localStorage.setItem("userName", trimmed);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setError(resp.message || "Failed to update username");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update username. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {existingUsername ? "Update Username" : "Set Username"}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {displayName && (
            <div className="bg-gray-50 border-l-4 border-[#d81b60] rounded p-4">
              <p className="text-xs font-semibold text-gray-600 mb-1">
                Account Name
              </p>
              <p className="text-base font-semibold text-gray-900">
                {displayName}
              </p>
            </div>
          )}

          {existingUsername && (
            <div className="bg-gray-50 border-l-4 border-[#d81b60] rounded p-4">
              <p className="text-xs font-semibold text-gray-600 mb-1">
                Current Username
              </p>
              <p className="text-base font-semibold text-gray-900">
                @{existingUsername}
              </p>
            </div>
          )}

          <p className="text-sm text-gray-600">
            {existingUsername
              ? "Update your username to make it unique"
              : "Create a unique username to make it easier to login next time"}
          </p>

          {/* Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              placeholder="Enter username"
              disabled={isLoading}
              maxLength={100}
              autoCapitalize="off"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d81b60] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {username.length}/100
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Footer Note */}
          <p className="text-xs text-gray-500 text-center">
            Username may only contain letters, numbers, _ and -
          </p>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-[#d81b60] text-white rounded-lg font-semibold hover:bg-[#b8145c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                existingUsername ? "Update" : "Set Username"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
