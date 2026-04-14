import React, { useState, useEffect, useRef } from "react";
import {
  getConversation,
  sendChatMessage,
  markChatMessageAsRead,
  getUnreadMessageCount,
} from "../api/feedback";
import Modal from "./Modal";
import Button from "./Button";

interface ChatMessage {
  id: number;
  customerId: number;
  senderType: 'customer' | 'support';
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface LiveChatModalProps {
  open: boolean;
  onClose: () => void;
  customerId: number;
}

export default function LiveChatModal({
  open,
  onClose,
  customerId,
}: LiveChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open) {
      loadConversation();
      loadUnreadCount();
    }
  }, [open, customerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = async () => {
    try {
      const data = await getConversation(customerId, 50, 0);
      setMessages(data);

      // Mark unread messages as read
      for (const msg of data) {
        if (!msg.isRead && msg.senderType === 'support') {
          await markChatMessageAsRead(msg.id);
        }
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadMessageCount(customerId);
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to load unread count:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const message = await sendChatMessage({
        customerId,
        message: newMessage.trim(),
      });

      setMessages([...messages, message]);
      setNewMessage("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Live Chat Support"
      size="md"
    >
      <div className="flex flex-col h-96">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-3 rounded-lg">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p className="text-sm">No messages yet. Start a conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.senderType === 'customer' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.senderType === 'customer'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.senderType === 'customer'
                        ? 'text-blue-100'
                        : 'text-gray-600'
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="mt-4 space-y-2">
          {error && (
            <div className="p-2 bg-red-100 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={500}
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading || !newMessage.trim()}
            >
              {loading ? '...' : 'Send'}
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            {newMessage.length}/500
          </p>
        </form>
      </div>
    </Modal>
  );
}
