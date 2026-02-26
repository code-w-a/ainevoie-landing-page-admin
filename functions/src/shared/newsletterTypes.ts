export const NEWSLETTER_CAMPAIGN_STATUSES = [
  "draft",
  "scheduled",
  "queued",
  "sending",
  "sent",
  "sent_with_errors",
  "canceled",
] as const;

export type NewsletterCampaignStatus =
  (typeof NEWSLETTER_CAMPAIGN_STATUSES)[number];

export const NEWSLETTER_SUBSCRIBER_STATUSES = [
  "active",
  "unsubscribed",
  "bounced",
  "complaint",
  "suppressed",
] as const;

export type NewsletterSubscriberStatus =
  (typeof NEWSLETTER_SUBSCRIBER_STATUSES)[number];

export const NEWSLETTER_ERROR_KINDS = [
  "transient",
  "permanent",
  "bounce",
] as const;

export type NewsletterErrorKind = (typeof NEWSLETTER_ERROR_KINDS)[number];

export type NewsletterConsentMethod = "single_opt_in";

export function isNewsletterCampaignStatus(
  value: unknown
): value is NewsletterCampaignStatus {
  return typeof value === "string" &&
    NEWSLETTER_CAMPAIGN_STATUSES.includes(value as NewsletterCampaignStatus);
}

export function isNewsletterSubscriberStatus(
  value: unknown
): value is NewsletterSubscriberStatus {
  return typeof value === "string" &&
    NEWSLETTER_SUBSCRIBER_STATUSES.includes(value as NewsletterSubscriberStatus);
}
