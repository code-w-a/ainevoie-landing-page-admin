# AInevoie Firebase Shared vs App-Specific Model

## Purpose

The Expo mobile app is the source of truth for Firebase structures shared by AInevoie clients. The Next.js project may keep site/dashboard-only Firebase data, but it must not redefine shared collections, shared Storage paths, or shared callable names with incompatible behavior.

## Firestore Collections

### Shared Between Expo And Next.js

- `providers/{uid}`: canonical provider account document. Next.js public onboarding creates this as `status: "pre_registered"` only.
- `providers/{uid}/events/{eventId}`: provider lifecycle/event history used by the admin experience.
- `admini/{uid}`: admin/support identity and admin UI state.

### Shared In Expo Source Of Truth, Not Currently Written By Next.js

- `users/{uid}`
- `providerDirectory/{uid}`
- `providers/{uid}/services/{serviceId}`
- `providers/{uid}/availability/profile`
- `bookings/{bookingId}`
- `payments/{paymentId}`
- `reviews/{bookingId}`
- `auditEvents/{eventId}`
- `idempotencyKeys/{scopeKey}`
- `conversations/{conversationId}`
- `conversationMemberships/{conversationId_uid}`
- `conversations/{conversationId}/messages/{messageId}`

### Next.js Only

- `newsletter_subscribers/{subscriberId}`
- `newsletter_campaigns/{campaignId}`
- `newsletter_campaigns/{campaignId}/jobs/{jobId}`
- `newsletter_logs/{logId}`
- `newsletter_settings/default`
- `admin_settings/email_templates`

Contact form submissions are email-only in the current Next.js code and do not create a Firestore collection.

## Storage Paths

### Shared Between Expo And Next.js

- `providers/{uid}/avatar/{fileName}`
- `providers/{uid}/documents/identity/{fileName}`
- `providers/{uid}/documents/professional/{fileName}`

Next.js uploads to these paths, then calls the shared Expo-owned finalization callables deployed in the Firebase project.

### Expo Only

- `users/{uid}/avatar/{fileName}`

Next.js rules include this path so deploying rules from `next-js` does not break the Expo app.

## Firebase Functions

### Shared / Expo-Owned

These names must remain owned by the Expo Firebase Functions codebase:

- `bootstrapSession`
- `submitProviderOnboarding`
- `saveProviderAvailability`
- `searchCoveragePlaceSuggestions`
- `resolveCoveragePlaceSelection`
- booking lifecycle callables: `createBookingRequest`, `confirmBooking`, `rejectBooking`, `proposeBookingReschedule`, `cancelBooking`, `completeBooking`, `updateBookingPaymentSummary`
- chat callables: `ensureDirectConversation`, `ensureBookingConversation`, `sendChatMessage`, `markConversationRead`
- `saveBookingReview`
- upload finalizers: `finalizeUserAvatarUpload`, `finalizeProviderAvatarUpload`, `finalizeProviderDocumentUpload`
- admin callables: `adminReviewProvider`, `getAdminDashboardSummary`, `listAdminProviders`, `getAdminProviderCase`, `listAdminBookings`, `getAdminBookingCase`, `listAdminReviews`, `listAdminAuditEvents`

### Next.js Only

The Next.js functions codebase is named `nextjs` in `firebase.json` and exports only newsletter functions:

- `createNewsletterCampaign`
- `sendNewsletterCampaignNow`
- `scheduleNewsletterCampaign`
- `unscheduleNewsletterCampaign`
- `sendNewsletterTestEmail`
- `newsletterCampaignStartTask`
- `newsletterSendTask`
- `requeueFailedJobs`
- `unsubscribe`

## Provider Onboarding Contract

Next.js public provider onboarding is a pre-registration flow:

- creates the Firebase Auth user;
- creates `providers/{uid}` using the shared provider schema with `status: "pre_registered"`;
- sets custom claims to `{ role: "provider", providerStatus: "pre_registered", isSuspended: false }`;
- stores landing/dashboard-only metadata on the same provider document under legacy fields such as `emailNormalized`, `legalStatus`, `newsletterStatusAtSignup`, and consent fields;
- uploads avatar/documents through shared Storage paths and shared finalizer callables;
- does not call `submitProviderOnboarding` and does not move the provider to `pending_review`.

The full review transition remains owned by the Expo shared callable contract, which requires the complete provider profile, finalized documents, and configured availability.
