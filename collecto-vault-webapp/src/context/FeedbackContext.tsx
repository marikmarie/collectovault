import { createContext, useContext, useState, ReactNode } from 'react';

interface FeedbackContextType {
  // Rating Modal State
  showRatingModal: boolean;
  ratingTransactionId: number | null;
  openRatingModal: (transactionId: number) => void;
  closeRatingModal: () => void;

  // Feedback Modal State
  showFeedbackModal: boolean;
  feedbackType: 'order' | 'service' | 'app' | 'general';
  openFeedbackModal: (type?: 'order' | 'service' | 'app' | 'general') => void;
  closeFeedbackModal: () => void;

  // Chat Modal State
  showChatModal: boolean;
  openChatModal: () => void;
  closeChatModal: () => void;

  // Unread Messages
  unreadMessageCount: number;
  setUnreadMessageCount: (count: number) => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  // Rating Modal
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingTransactionId, setRatingTransactionId] = useState<number | null>(null);

  const openRatingModal = (transactionId: number) => {
    setRatingTransactionId(transactionId);
    setShowRatingModal(true);
  };

  const closeRatingModal = () => {
    setShowRatingModal(false);
    setRatingTransactionId(null);
  };

  // Feedback Modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'order' | 'service' | 'app' | 'general'>('general');

  const openFeedbackModal = (type: 'order' | 'service' | 'app' | 'general' = 'general') => {
    setFeedbackType(type);
    setShowFeedbackModal(true);
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setFeedbackType('general');
  };

  // Chat Modal
  const [showChatModal, setShowChatModal] = useState(false);

  const openChatModal = () => {
    setShowChatModal(true);
  };

  const closeChatModal = () => {
    setShowChatModal(false);
  };

  // Unread Messages
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  return (
    <FeedbackContext.Provider
      value={{
        // Rating
        showRatingModal,
        ratingTransactionId,
        openRatingModal,
        closeRatingModal,
        // Feedback
        showFeedbackModal,
        feedbackType,
        openFeedbackModal,
        closeFeedbackModal,
        // Chat
        showChatModal,
        openChatModal,
        closeChatModal,
        // Unread
        unreadMessageCount,
        setUnreadMessageCount,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}
