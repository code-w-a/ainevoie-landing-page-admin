import { setGlobalOptions } from "firebase-functions/v2";

import { createNewsletterCampaign } from "./newsletter/campaign";
import { requeueFailedJobs } from "./newsletter/requeue";
import { sendNewsletterTestEmail } from "./newsletter/test";
import { unsubscribe } from "./newsletter/unsubscribe";
import { newsletterSendTask } from "./newsletter/worker";

setGlobalOptions({ region: "europe-west1" });

export {
  createNewsletterCampaign,
  sendNewsletterTestEmail,
  newsletterSendTask,
  requeueFailedJobs,
  unsubscribe,
};
