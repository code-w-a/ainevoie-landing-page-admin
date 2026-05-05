import { FieldValue } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { getDb, getSubscriberByToken } from "../shared/firestore";
import { withSentryFunction } from "../shared/sentry";

export const unsubscribe = onRequest(
  { region: "europe-west1", invoker: "public" },
  withSentryFunction("unsubscribe", async (req: any, res: any) => {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    if (!token) {
      res.status(400).send(
        "<html><body><h1>Token lipsă</h1><p>Link invalid.</p></body></html>"
      );
      return;
    }

    const db = getDb();
    const subscriberSnap = await getSubscriberByToken(db, token);

    if (!subscriberSnap) {
      res.status(404).send(
        "<html><body><h1>Nu am găsit abonarea</h1><p>Token invalid sau deja dezabonat.</p></body></html>"
      );
      return;
    }

    await subscriberSnap.ref.update({
      status: "unsubscribed",
      unsubscribedAt: FieldValue.serverTimestamp(),
      consentGranted: false,
      consentWithdrawnAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    res.status(200).send(
      "<html><body><h1>Dezabonare confirmată</h1><p>Nu vei mai primi emailuri de la Ainevoie.</p></body></html>"
    );
  })
);
