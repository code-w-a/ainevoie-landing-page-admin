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

## Producție — mail.ai-nevoie.ro (SSL/TLS, port 465)

Valori pentru contul `no-reply@ai-nevoie.ro` (aceleași ca în panoul de hosting: Outgoing `mail.ai-nevoie.ro`, SMTP 465, autentificare obligatorie):

```
SMTP_HOST=mail.ai-nevoie.ro
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=no-reply@ai-nevoie.ro
SMTP_PASS=<parola_contului_mail>
NEWSLETTER_FROM_NAME=AInevoie
NEWSLETTER_FROM_EMAIL=no-reply@ai-nevoie.ro
NEWSLETTER_REPLY_TO=<adresa_monitorizata_ex_contact@ai-nevoie.ro>
PUBLIC_BASE_URL=https://ainevoie.ro
ADMIN_API_KEY=<aceeași valoare ca ADMIN_API_KEY din Next.js>
```

`NEWSLETTER_REPLY_TO` poate fi o adresă la care răspundeti (nu e obligatoriu să fie no-reply).

Setare secret din terminal (exemplu non-interactiv pentru valori scurte; pentru `SMTP_PASS` folosește aceeași metodă cu parola reală):

```bash
printf '%s' 'mail.ai-nevoie.ro' | firebase functions:secrets:set SMTP_HOST --data-file=-
printf '%s' '465' | firebase functions:secrets:set SMTP_PORT --data-file=-
printf '%s' 'true' | firebase functions:secrets:set SMTP_SECURE --data-file=-
printf '%s' 'no-reply@ai-nevoie.ro' | firebase functions:secrets:set SMTP_USER --data-file=-
printf '%s' 'PAROLA_AICI' | firebase functions:secrets:set SMTP_PASS --data-file=-
printf '%s' 'AInevoie' | firebase functions:secrets:set NEWSLETTER_FROM_NAME --data-file=-
printf '%s' 'no-reply@ai-nevoie.ro' | firebase functions:secrets:set NEWSLETTER_FROM_EMAIL --data-file=-
# opțional:
printf '%s' 'contact@ai-nevoie.ro' | firebase functions:secrets:set NEWSLETTER_REPLY_TO --data-file=-
```

După orice schimbare de secrete: `firebase deploy --only functions` (vezi secțiunea Deploy).

## Alternativ: Gmail App Password (doar test)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=<gmail>
SMTP_PASS=<gmail_app_password>
NEWSLETTER_FROM_NAME=AInevoie
NEWSLETTER_FROM_EMAIL=<gmail>
NEWSLETTER_REPLY_TO=<gmail>
PUBLIC_BASE_URL=https://ainevoie.ro
ADMIN_API_KEY=<aceeași-valoare-ca-in-next>
```

Comenzi interactive (orice secret):

```
firebase functions:secrets:set SMTP_HOST
firebase functions:secrets:set SMTP_PORT
firebase functions:secrets:set SMTP_SECURE
firebase functions:secrets:set SMTP_USER
firebase functions:secrets:set SMTP_PASS
firebase functions:secrets:set NEWSLETTER_FROM_NAME
firebase functions:secrets:set NEWSLETTER_FROM_EMAIL
firebase functions:secrets:set NEWSLETTER_REPLY_TO
firebase functions:secrets:set PUBLIC_BASE_URL
firebase functions:secrets:set ADMIN_API_KEY
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
  "fromEmail": "no-reply@ai-nevoie.ro",
  "replyTo": "contact@ai-nevoie.ro",
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
