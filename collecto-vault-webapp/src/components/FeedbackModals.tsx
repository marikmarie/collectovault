import { useFeedback } from '../context/FeedbackContext';
import RatingModal from '../components/RatingModal';
import FeedbackModal from '../components/FeedbackModal';
import LiveChatModal from '../components/LiveChatModal';

interface FeedbackModalsProps {
  customerId: number;
}

/**
 * Global Feedback Modals Component
 * 
 * Renders all feedback-related modals. Place this once in your app root.
 * Use useFeedback() hook to control them from anywhere.
 * 
 * Usage:
 * 1. Wrap your app with FeedbackProvider
 * 2. Add FeedbackModals component to your app root
 * 3. Use useFeedback() hook to trigger modals from any component
 */
export default function FeedbackModals({ customerId }: FeedbackModalsProps) {
  const {
    showRatingModal,
    ratingTransactionId,
    closeRatingModal,
    showFeedbackModal,
    feedbackType,
    closeFeedbackModal,
    showChatModal,
    closeChatModal,
  } = useFeedback();

  return (
    <>
      {/* Rating Modal */}
      {ratingTransactionId && (
        <RatingModal
          open={showRatingModal}
          onClose={closeRatingModal}
          customerId={customerId}
          transactionId={ratingTransactionId}
          onSuccess={() => {
            console.log('Rating submitted successfully');
          }}
        />
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        open={showFeedbackModal}
        onClose={closeFeedbackModal}
        customerId={customerId}
        initialType={feedbackType}
        onSuccess={() => {
          console.log('Feedback submitted successfully');
        }}
      />

      {/* Live Chat Modal */}
      <LiveChatModal
        open={showChatModal}
        onClose={closeChatModal}
        customerId={customerId}
      />
    </>
  );
}
