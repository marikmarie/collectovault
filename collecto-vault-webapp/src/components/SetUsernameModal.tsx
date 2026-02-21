import React, { useState } from 'react';
import { X, Check, AlertCircle, RotateCw, AtSign } from 'lucide-react';
import { authService } from '../api/authService';

interface SetUsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (username: string) => void;
  existingUsername?: string | null;
  clientId?: string;
}

export default function SetUsernameModal({
  isOpen,
  onClose,
  onSuccess,
  existingUsername,
  clientId: passedClientId,
}: SetUsernameModalProps) {
  const [username, setUsername] = useState(existingUsername || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (username.length > 100) {
      setError('Username cannot exceed 100 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError('Username can only contain letters, numbers, underscores, and hyphens');
      return;
    }

    setIsLoading(true);

    try {
      const clientId = passedClientId || localStorage.getItem('clientId');
      const collectoId = localStorage.getItem('collectoId');

      if (!clientId) {
        setError('Client ID not found. Please login again.');
        setIsLoading(false);
        return;
      }

      try {
        await authService.checkUsernameAvailability(username.trim());
      } catch (availabilityErr: any) {
        setError('Username already exists. Please try another one.');
        setIsLoading(false);
        return;
      }

      const result = await authService.setUsername({
        clientId,
        username: username.trim(),
        collectoId: collectoId || undefined,
      });

      if (result.success) {
        setSuccess('Username created successfully!');
        localStorage.setItem('userName', username.trim());
        setTimeout(() => {
          onSuccess(username.trim());
          onClose();
        }, 1500);
      } else {
        setError(result.message || 'Failed to create username');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create username. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-[#d81b60] to-pink-400 rounded-full flex items-center justify-center text-white">
              <AtSign size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Create Username</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Create a unique username to make it easier to login next time
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase">
              Username
            </label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="john_doe"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#d81b60]/20 focus:border-[#d81b60] outline-none transition-all bg-gray-50 focus:bg-white"
                disabled={isLoading}
                maxLength={100}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {username.length}/100 characters
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm animate-in fade-in slide-in-from-top-1">
              <Check size={16} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 text-gray-700 font-semibold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 text-white font-semibold bg-[#d81b60] hover:bg-[#b8165c] rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RotateCw size={18} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Create Username
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-500 mt-6 pt-6 border-t border-gray-100 text-center">
          Username can only contain<br />
          letters, numbers, underscores & hyphens
        </p>
      </div>
    </div>
  );
}
