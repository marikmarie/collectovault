# Payment Integration Example - Rating Modal

This example shows how to integrate the rating modal after a successful payment in your checkout flow.

## Implementation

### 1. Setup in App Root (App.tsx)

```tsx
import { FeedbackProvider } from './context/FeedbackContext';
import FeedbackModals from './components/FeedbackModals';
import { useAuth } from './context/AuthContext'; // or your auth context

function App() {
  const { customer } = useAuth();

  return (
    <FeedbackProvider>
      {customer && <FeedbackModals customerId={customer.id} />}
      
      {/* Your app routes */}
      <Router>
        {/* Routes here */}
      </Router>
    </FeedbackProvider>
  );
}

export default App;
```

### 2. In Your Payment Success Component

```tsx
import { useNavigate } from 'react-router-dom';
import { usePaymentRating } from '../hooks/useFeedback';

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const triggerRating = usePaymentRating();
  const { transactionId, customerId } = // get from route params or state

  useEffect(() => {
    // Show rating modal automatically after 2 seconds
    const timer = setTimeout(() => {
      triggerRating(transactionId);
    }, 2000);

    return () => clearTimeout(timer);
  }, [transactionId, triggerRating]);

  const handleContinue = () => {
    navigate('/dashboard');
  };

  return (
    <div className="payment-success">
      <div className="success-card">
        <div className="success-icon">✓</div>
        <h1>Payment Successful!</h1>
        <p className="amount">KES {amount.toLocaleString()}</p>
        
        <div className="details">
          <p><strong>Transaction ID:</strong> {transactionId}</p>
          <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
        </div>

        <div className="actions">
          <button onClick={handleContinue} className="btn-primary">
            Go to Dashboard
          </button>
          <p className="rating-notice">
            Please rate your experience in the popup above
          </p>
        </div>
      </div>

      {/* Rating modal will appear automatically via context */}
    </div>
  );
}
```

### 3. Alternative: Manual Trigger

If you want to trigger the rating modal from a button instead:

```tsx
import { useFeedback } from '../context/FeedbackContext';

export function PaymentSuccessPage() {
  const { openRatingModal } = useFeedback();
  const { transactionId } = // get from props/route

  return (
    <div className="payment-success">
      <button onClick={() => openRatingModal(transactionId)}>
        Rate Your Experience
      </button>
    </div>
  );
}
```

### 4. In Your Checkout / Payment Flow

```tsx
import { useState } from 'react';
import { processPayment } from '../api/payment';
import { usePaymentRating } from '../hooks/useFeedback';

export function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const triggerRating = usePaymentRating();
  const { customerId } = useAuth();

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await processPayment({
        amount: 5000,
        currency: 'KES',
        customerId,
      });

      // Payment successful
      if (response.success) {
        // Show rating modal
        triggerRating(response.transactionId);
        
        // Or navigate to success page
        // navigate('/payment-success', {
        //   state: { 
        //     transactionId: response.transactionId,
        //     amount: response.amount 
        //   }
        // });
      }
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handlePayment(); }}>
      {/* Checkout form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : 'Complete Payment'}
      </button>
    </form>
  );
}
```

## Best Practices

1. **Auto-trigger after delay**: Show the rating modal 2-3 seconds after payment success
   ```tsx
   useEffect(() => {
     const timer = setTimeout(() => triggerRating(id), 2500);
     return () => clearTimeout(timer);
   }, []);
   ```

2. **Allow dismissal**: Let users close the modal without rating
   - The modal has built-in close functionality

3. **Success feedback**: Give visual feedback after rating submission
   - The component shows a success message automatically

4. **Mobile consideration**: On mobile, use modal at full height
   - Components are already optimized for mobile

5. **Accessibility**: 
   - All buttons are keyboard accessible
   - Star rating is clear and obvious
   - Color contrast is sufficient

## Response Handling

The rating submission will automatically:
1. Validate all ratings are provided (1-5 stars)
2. Submit to backend via API
3. Show success/error message
4. Close modal on success
5. Keep modal open on error for retry

## Database Records

After successful rating submission:
- Record saved in `ratings` table
- Links to `customerId` and `transactionId`
- Timestamps recorded automatically
- Average ratings updated for customer

## API Flow

```
User fills rating form
    ↓
Clicks "Submit Rating"
    ↓
FeedbackModal validates
    ↓
POST /ratings (with validation)
    ↓
Backend saves to DB
    ↓
Success message shown
    ↓
Modal automatically closes
```

## Error Handling

If submission fails:
- Error message displayed
- User can edit and retry
- Network errors handled gracefully
- Form data preserved

## Next Steps

1. Integrate into your payment success handler
2. Test rating submission in development
3. Verify ratings appear in admin dashboard
4. Consider adding rating display on order history
5. Set up order history filtering by rating
