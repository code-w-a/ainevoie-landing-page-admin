# Newsletter Backend (Firebase Functions)

## Overview
This backend provides newsletter campaign sending using:
- Firestore collections (`newsletter_subscribers`, `newsletter_campaigns`, `newsletter_logs`)
- Cloud Functions Gen 2 (callable + task queue)
- SMTP via Nodemailer
- Unsubscribe HTTP endpoint

## Firestore Collections
- `newsletter_subscribers/{id}`
  - `email`, `status`, `createdAt`, `unsubscribeToken`, `tags?`, `lastSentAt?`, `source?`
- `newsletter_campaigns/{campaignId}`
  - `subject`, `previewText?`, `html`, `text?`, `fromName`, `fromEmail`, `replyTo?`
  - `status`, `stats`, `filters`, `sendConfig`, `createdAt`, `createdBy`
- `newsletter_campaigns/{campaignId}/jobs/{jobId}`
  - `campaignId`, `subscriberRef?`, `email`, `status`, `attempts`, `lastError?`, `sentAt?`, `createdAt`, `dedupeKey`
- `newsletter_logs/{logId}`

## Secrets (Firebase Functions)
Set these secrets in your Firebase project:

```
SMTP_HOST
SMTP_PORT
SMTP_SECURE  # "true" or "false"
SMTP_USER
SMTP_PASS
NEWSLETTER_FROM_NAME
NEWSLETTER_FROM_EMAIL
NEWSLETTER_REPLY_TO   # optional
PUBLIC_BASE_URL       # e.g. https://domeniu.ro
ADMIN_API_KEY         # optional fallback for admin access
```

Example:
```
firebase functions:secrets:set SMTP_HOST
```

## Deploy
```
cd functions
npm install
npm run build
firebase deploy --only functions
```

## Local Emulators
```
cd functions
npm install
npm run build
firebase emulators:start --only functions,firestore
```

## Callable Functions

### createNewsletterCampaign
- **Callable**: `createNewsletterCampaign`
- **Admin-only** (custom claims `admin: true` or `adminApiKey` in payload)

Example payload:
```json
{
  "subject": "Noutăți AInevoie",
  "previewText": "",
  "html": "<h1>Salut!</h1><p>Avem noutăți.</p>",
  "text": "Salut! Avem noutăți.",
  "filters": { "tags": ["bucuresti"] },
  "sendConfig": { "maxPerSecond": 5, "maxConcurrent": 50 },
  "fromName": "AInevoie",
  "fromEmail": "contact@domeniu.ro",
  "replyTo": "contact@domeniu.ro",
  "adminApiKey": "<optional>"
}
```

### sendNewsletterTestEmail
- **Callable**: `sendNewsletterTestEmail`
- **Admin-only**

Example payload:
```json
{
  "toEmail": "test@domeniu.ro",
  "subject": "Test",
  "html": "<p>Test</p>",
  "text": "Test",
  "previewText": "Preview text",
  "adminApiKey": "<optional>"
}
```

### requeueFailedJobs
- **Callable**: `requeueFailedJobs`
- **Admin-only**

Example payload:
```json
{
  "campaignId": "<campaign-id>",
  "adminApiKey": "<optional>"
}
```

## Task Queue
- Queue name: `newsletter-send`
- Worker: `newsletterSendTask`
- Retries: up to 3 attempts with backoff

## Unsubscribe
- HTTP: `GET /unsubscribe?token=...`
- Marks subscriber as `unsubscribed`

## Notes
- Emails are sent as multipart/alternative (text + HTML).
- A footer with unsubscribe link is appended to each email.
- Jobs are idempotent: already sent jobs will not resend.
