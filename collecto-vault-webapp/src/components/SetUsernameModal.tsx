import React, { useState, useEffect } from "react";
import { authService } from "../api/authService";
import Modal from "./Modal";
import Button from "./Button";

interface SetUsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (username: string) => void;
  existingUsername?: string | null;
}

export default function SetUsernameModal({
  isOpen,
  onClose,
  onSuccess,
  existingUsername,
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

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError("");
      setSuccess("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmed = username.trim();

    // Validation
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
      // Get client ID and collecto ID from localStorage
      const clientId = localStorage.getItem("clientId");
      const collectoId = localStorage.getItem("collectoId");

      if (!clientId) {
        setError("Client ID not found. Please login again.");
        setIsLoading(false);
        return;
      }

      // Check availability by attempting to fetch client id by username
      try {
        const avail = await authService.checkUsernameAvailability(trimmed);
        if (!avail.available) {
          setError("Username already exists. Please try another one.");
          setIsLoading(false);
          return;
        }
      } catch (err: any) {
        // if the helper throws we treat as unavailable
        setError("Username already exists. Please try another one.");
        setIsLoading(false);
        return;
      }

      // Call setUsername API
      const resp = await authService.setUsername({
        clientId,
        collectoId: collectoId || undefined,
        username: trimmed,
        action: existingUsername ? "update" : "create",
      });

      if (resp.success) {
        setSuccess("Username created successfully!");
        localStorage.setItem("userName", trimmed);
        setTimeout(() => {
          onSuccess(trimmed);
          onClose();
        }, 1500);
      } else {
        setError(resp.message || "Failed to create username");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create username. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={existingUsername ? "Update Username" : "Create Username"}
      size="sm"
      noOverlay={false}
      closeOnOverlayClick={true}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">
          Create a unique username to make it easier to login next time
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
            maxLength={100}
            disabled={isLoading}
            autoCapitalize="off"
            autoCorrect="off"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#d81b60] disabled:bg-gray-100"
          />
          <p className="text-xs text-gray-500 mt-1">{username.length}/100</p>
        </div>

        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-md">
          Username may only contain letters, numbers, _ and -
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-100 text-green-700 rounded text-sm">
            {success}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            loading={isLoading}
            className="flex-1"
          >
            {existingUsername ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
