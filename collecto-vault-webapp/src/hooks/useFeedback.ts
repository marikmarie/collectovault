import { useCallback } from 'react';
import { useFeedback } from '../context/FeedbackContext';

/**
 * Hook to trigger rating modal after payment
 * 
 * Usage:
 * ```tsx
 * const triggerPaymentRating = usePaymentRating();
 * 
 * // In your payment success handler
 * triggerPaymentRating(transactionId);
 * ```
 */
export function usePaymentRating() {
  const { openRatingModal } = useFeedback();

  return useCallback((transactionId: number) => {
    openRatingModal(transactionId);
  }, [openRatingModal]);
}

/**
 * Hook to trigger feedback modal
 * 
 * Usage:
 * ```tsx
 * const triggerFeedback = useTriggerFeedback();
 * 
 * // Trigger general feedback
 * triggerFeedback('general');
 * 
 * // Trigger order-related feedback
 * triggerFeedback('order');
 * ```
 */
export function useTriggerFeedback() {
  const { openFeedbackModal } = useFeedback();

  return useCallback(
    (type: 'order' | 'service' | 'app' | 'general' = 'general') => {
      openFeedbackModal(type);
    },
    [openFeedbackModal]
  );
}

/**
 * Hook to open chat modal
 * 
 * Usage:
 * ```tsx
 * const openChat = useChatModal();
 * 
 * <button onClick={openChat}>Open Chat</button>
 * ```
 */
export function useChatModal() {
  const { openChatModal } = useFeedback();
  return openChatModal;
}
