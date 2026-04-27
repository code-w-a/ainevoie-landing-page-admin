import { setGlobalOptions } from "firebase-functions/v2";

import { createNewsletterCampaign } from "./newsletter/campaign";
import { newsletterCampaignStartTask } from "./newsletter/startTask";
import { requeueFailedJobs } from "./newsletter/requeue";
import { scheduleNewsletterCampaign } from "./newsletter/schedule";
import { sendNewsletterCampaignNow } from "./newsletter/sendNow";
import { sendNewsletterTestEmail } from "./newsletter/test";
import { unsubscribe } from "./newsletter/unsubscribe";
import { unscheduleNewsletterCampaign } from "./newsletter/unschedule";
import { newsletterSendTask } from "./newsletter/worker";
import {
  finalizeProviderAvatarUpload,
  finalizeProviderDocumentUpload,
  saveProviderAvailabilityProfile,
  submitProviderOnboarding,
} from "./provider/onboarding";

setGlobalOptions({ region: "europe-west1" });

export {
  createNewsletterCampaign,
  sendNewsletterCampaignNow,
  scheduleNewsletterCampaign,
  unscheduleNewsletterCampaign,
  sendNewsletterTestEmail,
  newsletterCampaignStartTask,
  newsletterSendTask,
  requeueFailedJobs,
  unsubscribe,
  finalizeProviderAvatarUpload,
  finalizeProviderDocumentUpload,
  saveProviderAvailabilityProfile,
  submitProviderOnboarding,
};
