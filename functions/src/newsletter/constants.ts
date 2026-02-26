import {
  NEWSLETTER_CAMPAIGN_STATUSES,
  NEWSLETTER_SUBSCRIBER_STATUSES,
} from "../shared/newsletterTypes";

export const REGION = "europe-west1";

export const SEND_QUEUE_FUNCTION =
  `locations/${REGION}/functions/newsletterSendTask`;
export const START_QUEUE_FUNCTION =
  `locations/${REGION}/functions/newsletterCampaignStartTask`;

export const DEFAULT_MAX_PER_SECOND = 5;
export const DEFAULT_MAX_CONCURRENT = 50;
export const RETRY_DELAYS_SECONDS = [30, 120, 600] as const;

export { NEWSLETTER_CAMPAIGN_STATUSES, NEWSLETTER_SUBSCRIBER_STATUSES };
