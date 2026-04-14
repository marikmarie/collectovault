# Feedback System Integration Guide

## Overview
This guide explains how to integrate the feedback, rating, chat, and WhatsApp contact system into your application. The system includes:

1. **Rating System** - Rate orders, payments, and services (1-5 stars)
2. **Feedback System** - Submit feedback about orders, services, app, or general topics
3. **Live Chat** - Real-time chat support with support team
4. **WhatsApp Integration** - Direct WhatsApp contact links

---

## Web App (React/Vite) Integration

### 1. Import Required Components

```tsx
import RatingModal from '../components/RatingModal';
import FeedbackModal from '../components/FeedbackModal';
import LiveChatModal from '../components/LiveChatModal';
import WhatsAppButton from '../components/WhatsAppButton';
```

### 2. Show Rating Modal After Payment

In your payment success page:

```tsx
import { useState } from 'react';
import RatingModal from '../components/RatingModal';

export function PaymentSuccess({ transactionId, customerId }) {
  const [showRatingModal, setShowRatingModal] = useState(true);

  return (
    <div>
      <h1>Payment Successful!</h1>
      {/* Your success content */}

      <RatingModal
        open={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        customerId={customerId}
        transactionId={transactionId}
        onSuccess={() => {
          console.log('Rating submitted successfully');
          // Optionally refresh user data
        }}
      />
    </div>
  );
}
```

### 3. Add Feedback Form to Help Section

```tsx
import { useState } from 'react';
import FeedbackModal from '../components/FeedbackModal';
import Button from '../components/Button';

export function HelpSection({ customerId }) {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <div>
      <h2>Help & Feedback</h2>
      
      <Button onClick={() => setShowFeedback(true)}>
        Send Feedback
      </Button>

      <FeedbackModal
        open={showFeedback}
        onClose={() => setShowFeedback(false)}
        customerId={customerId}
        onSuccess={() => console.log('Feedback sent')}
      />
    </div>
  );
}
```

### 4. Add Live Chat Widget

```tsx
import { useState } from 'react';
import LiveChatModal from '../components/LiveChatModal';
import Button from '../components/Button';

export function ChatWidget({ customerId }) {
  const [showChat, setShowChat] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowChat(true)}
        className="fixed bottom-4 right-4 rounded-full"
      >
        💬 Chat
      </Button>

      <LiveChatModal
        open={showChat}
        onClose={() => setShowChat(false)}
        customerId={customerId}
      />
    </>
  );
}
```

### 5. Add WhatsApp Contact Links

#### Business WhatsApp Button (in Help page)
```tsx
import WhatsAppButton from '../components/WhatsAppButton';

export function HelpPage() {
  return (
    <div>
      <h2>Contact Us</h2>
      <WhatsAppButton type="business" label="Contact us on WhatsApp" />
    </div>
  );
}
```

#### User WhatsApp Button (in Profile/Settings)
```tsx
import WhatsAppButton from '../components/WhatsAppButton';

export function UserProfile({ customerId }) {
  return (
    <div>
      <h2>Your WhatsApp</h2>
      <WhatsAppButton 
        type="user" 
        customerId={customerId}
        label="Share on WhatsApp"
      />
    </div>
  );
}
```

---

## Mobile App (React Native/Expo) Integration

### 1. Import Required Components

```tsx
import RatingModal from '../components/RatingModal';
import FeedbackModal from '../components/FeedbackModal';
import LiveChatModal from '../components/LiveChatModal';
import WhatsAppButton from '../components/WhatsAppButton';
```

### 2. Show Rating Modal After Payment

```tsx
import { useState } from 'react';
import { View, Text, ClassNameButton } from 'react-native';
import RatingModal from '../components/RatingModal';

export function PaymentSuccessScreen({ route }) {
  const [showRating, setShowRating] = useState(true);
  const { transactionId, customerId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Successful!</Text>
      {/* Your success content */}

      <RatingModal
        visible={showRating}
        onClose={() => setShowRating(false)}
        customerId={customerId}
        transactionId={transactionId}
        onSuccess={() => console.log('Rating submitted')}
      />
    </View>
  );
}
```

### 3. Feedback Form in Help Screen

```tsx
import { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import FeedbackModal from '../components/FeedbackModal';

export function HelpScreen({ route }) {
  const [showFeedback, setShowFeedback] = useState(false);
  const { customerId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Help & Support</Text>

      <TouchableOpacity onPress={() => setShowFeedback(true)}>
        <Text>Send Feedback</Text>
      </TouchableOpacity>

      <FeedbackModal
        visible={showFeedback}
        onClose={() => setShowFeedback(false)}
        customerId={customerId}
      />
    </View>
  );
}
```

### 4. Live Chat in Support Screen

```tsx
import { useState } from 'react';
import LiveChatModal from '../components/LiveChatModal';
import { TouchableOpacity, Text } from 'react-native';

export function SupportScreen({ route }) {
  const [showChat, setShowChat] = useState(false);
  const { customerId } = route.params;

  return (
    <View>
      <TouchableOpacity onPress={() => setShowChat(true)}>
        <Text>Start Live Chat</Text>
      </TouchableOpacity>

      <LiveChatModal
        visible={showChat}
        onClose={() => setShowChat(false)}
        customerId={customerId}
      />
    </View>
  );
}
```

### 5. WhatsApp Buttons

```tsx
import WhatsAppButton from '../components/WhatsAppButton';
import { View } from 'react-native';

export function ContactScreen({ customerId }) {
  return (
    <View>
      {/* Business WhatsApp */}
      <WhatsAppButton label="WhatsApp Us" />

      {/* User WhatsApp (if they set it) */}
      <WhatsAppButton label="Share your Contact" />
    </View>
  );
}
```

---

## API Endpoints

### Rating Endpoints
```
POST   /ratings                          - Create rating
GET    /ratings/:id                      - Get rating by ID
GET    /ratings/transaction/:id          - Get rating for transaction
GET    /ratings/customer/:customerId     - Get all customer ratings
GET    /ratings/customer/:customerId/average - Get average ratings
PATCH  /ratings/:id                      - Update rating
DELETE /ratings/:id                      - Delete rating
```

### Feedback Endpoints
```
POST   /feedback                         - Create feedback
GET    /feedback/:id                     - Get feedback by ID
GET    /feedback/customer/:customerId    - Get customer feedback
GET    /feedback/status/:status          - Get feedback by status
PATCH  /feedback/:id                     - Update feedback
PATCH  /feedback/:id/resolve             - Resolve feedback
PATCH  /feedback/:id/close               - Close feedback
DELETE /feedback/:id                     - Delete feedback
```

### Chat Endpoints
```
POST   /chat                             - Send message
GET    /chat/:id                         - Get message
GET    /chat/customer/:customerId        - Get conversation
GET    /chat/customer/:customerId/unread - Get unread count
PATCH  /chat/:id/read                    - Mark message as read
PATCH  /chat/customer/:customerId/read-all - Mark all as read
POST   /chat/:customerId/support-reply   - Send support reply
DELETE /chat/:id                         - Delete message
```

### Contact Endpoints
```
POST   /contacts/whatsapp/user           - Set user WhatsApp
GET    /contacts/whatsapp/user/:id       - Get user WhatsApp
GET    /contacts/whatsapp/user/:id/url   - Get WhatsApp URL
DELETE /contacts/whatsapp/user/:id       - Delete user WhatsApp

POST   /contacts/whatsapp/business       - Set business WhatsApp
GET    /contacts/whatsapp/business       - Get business WhatsApp
GET    /contacts/whatsapp/business/url   - Get business WhatsApp URL

POST   /contacts/email/business          - Set business email
GET    /contacts/email/business          - Get business email

POST   /contacts/phone/business          - Set business phone
GET    /contacts/phone/business          - Get business phone

GET    /contacts/business/all            - Get all business contacts
```

---

## Database Schema

### ratings table
- id (INT PK)
- customerId (INT FK)
- transactionId (INT FK)
- orderRating (INT 1-5)
- paymentRating (INT 1-5)
- serviceRating (INT 1-5)
- overallRating (INT 1-5)
- comment (TEXT)
- createdAt, updatedAt (TIMESTAMP)

### feedback table
- id (INT PK)
- customerId (INT FK)
- feedbackType (VARCHAR 'order', 'service', 'app', 'general')
- title (VARCHAR 255)
- message (TEXT)
- attachments (JSON)
- status (VARCHAR 'open', 'in-progress', 'resolved', 'closed')
- priority (VARCHAR 'low', 'medium', 'high', 'critical')
- createdAt, updatedAt (TIMESTAMP)

### chat_messages table
- id (INT PK)
- customerId (INT FK)
- senderType (VARCHAR 'customer', 'support')
- message (TEXT)
- attachments (JSON)
- isRead (BOOLEAN)
- readAt (TIMESTAMP)
- createdAt (TIMESTAMP)

### whatsapp_contacts table
- id (INT PK)
- customerId (INT FK)
- whatsappNumber (VARCHAR)
- isPreferred (BOOLEAN)
- verifiedAt (TIMESTAMP)
- createdAt, updatedAt (TIMESTAMP)

### business_contacts table
- id (INT PK)
- contactType (VARCHAR 'whatsapp', 'email', 'phone')
- value (VARCHAR)
- isActive (BOOLEAN)
- createdAt, updatedAt (TIMESTAMP)

---

## Configuration

### Environment Variables

#### Web App (.env.local)
```
VITE_API_BASE_URL=http://localhost:4000
```

#### Mobile App (.env or app.json)
```
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
```

#### Backend (.env)
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_DATABASE=collecto_vault
PORT=4000
```

---

## Features Summary

### ✅ Rating System
- After-purchase ratings
- Multi-category rating (Order, Payment, Service, Overall)
- Optional comments
- Rating history tracking
- Average rating calculations

### ✅ Feedback System
- Categorized feedback (Order, Service, App, General)
- Priority levels (Low, Medium, High, Critical)
- Status tracking (Open, In-Progress, Resolved, Closed)
- File attachments support
- Help page integration

### ✅ Live Chat
- Real-time messaging
- Read/unread status tracking
- Message history
- Customer-support distinction
- File attachment support

### ✅ WhatsApp Integration
- Business WhatsApp contact
- User WhatsApp contact management
- Direct WhatsApp links
- International number format support
- Contact verification

---

## Notes
- All ratings are 1-5 stars
- Feedback requires title and message
- Chat messages max 5000 characters
- WhatsApp numbers should include country code (+254...)
- All timestamps are UTC
- Dates are ISO 8601 format
