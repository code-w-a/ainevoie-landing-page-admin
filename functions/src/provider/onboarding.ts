import { getStorage } from "firebase-admin/storage";
import { FieldValue } from "firebase-admin/firestore";
import {
  CallableRequest,
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";
import { getDb } from "../shared/firestore";
import { withSentryFunction } from "../shared/sentry";
import { normalizeProviderAvailability } from "./availability";

const REGION = "europe-west1";
const DOCUMENT_TYPES = ["identity", "professional"] as const;
type ProviderDocumentType = (typeof DOCUMENT_TYPES)[number];

function requireUid(request: CallableRequest) {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Autentificarea este obligatorie.");
  }
  return uid;
}

function readString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpsError("invalid-argument", `Missing ${field}`);
  }
  return value.trim();
}

function readDocumentType(value: unknown): ProviderDocumentType {
  if (DOCUMENT_TYPES.includes(value as ProviderDocumentType)) {
    return value as ProviderDocumentType;
  }
  throw new HttpsError("invalid-argument", "Tip document nevalid.");
}

function assertStoragePath(path: string, expectedPrefix: string) {
  if (!path.startsWith(expectedPrefix) || path.includes("..")) {
    throw new HttpsError("permission-denied", "Calea fișierului nu este permisă.");
  }
}

async function assertFileExists(storagePath: string) {
  const [exists] = await getStorage().bucket().file(storagePath).exists();
  if (!exists) {
    throw new HttpsError("not-found", "Fișierul încărcat nu a fost găsit.");
  }
}

function isUploadedDocument(value: any) {
  return (
    value?.status === "uploaded" &&
    typeof value.storagePath === "string" &&
    value.storagePath.trim().length > 0
  );
}

function summarizeAvailabilityInput(input: unknown) {
  const weekSchedule =
    input && typeof input === "object" && Array.isArray((input as any).weekSchedule)
      ? (input as any).weekSchedule
      : [];

  return {
    hasWeekSchedule: Array.isArray(weekSchedule),
    dayCount: weekSchedule.length,
    enabledDays: weekSchedule
      .filter((day: any) => day?.isEnabled === true)
      .map((day: any) => ({
        dayKey: typeof day?.dayKey === "string" ? day.dayKey : null,
        rangesCount: Array.isArray(day?.timeRanges) ? day.timeRanges.length : 0,
        ranges: Array.isArray(day?.timeRanges)
          ? day.timeRanges.map((range: any) => ({
              startTime: typeof range?.startTime === "string" ? range.startTime : null,
              endTime: typeof range?.endTime === "string" ? range.endTime : null,
            }))
          : [],
      })),
  };
}

function logCallableError(handler: string, error: unknown, extra: Record<string, unknown>) {
  const knownError = error instanceof HttpsError
    ? { code: error.code, message: error.message, details: error.details ?? null }
    : error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { value: String(error) };

  console.error(`[${handler}] failed`, {
    ...extra,
    error: knownError,
  });
}

export const finalizeProviderAvatarUpload = onCall(
  { region: REGION },
  withSentryFunction("finalizeProviderAvatarUpload", async (request: CallableRequest<any>) => {
    const uid = requireUid(request);
    const storagePath = readString(request.data?.storagePath, "storagePath");
    assertStoragePath(storagePath, `providers/${uid}/avatar/`);
    await assertFileExists(storagePath);

    const db = getDb();
    const providerRef = db.collection("providers").doc(uid);
    const providerSnap = await providerRef.get();
    if (!providerSnap.exists) {
      throw new HttpsError("not-found", "Profilul de prestator nu există.");
    }

    await providerRef.set(
      {
        professionalProfile: {
          avatarPath: storagePath,
        },
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: uid,
      },
      { merge: true }
    );

    return { status: "uploaded", storagePath };
  })
);

export const finalizeProviderDocumentUpload = onCall(
  { region: REGION },
  withSentryFunction("finalizeProviderDocumentUpload", async (request: CallableRequest<any>) => {
    const uid = requireUid(request);
    const documentType = readDocumentType(request.data?.documentType);
    const storagePath = readString(request.data?.storagePath, "storagePath");
    const originalFileName = readString(request.data?.originalFileName, "originalFileName");
    assertStoragePath(storagePath, `providers/${uid}/documents/${documentType}/`);
    await assertFileExists(storagePath);

    const db = getDb();
    const providerRef = db.collection("providers").doc(uid);
    const providerSnap = await providerRef.get();
    if (!providerSnap.exists) {
      throw new HttpsError("not-found", "Profilul de prestator nu există.");
    }

    await providerRef.set(
      {
        documents: {
          [documentType]: {
            status: "uploaded",
            storagePath,
            originalFileName,
            uploadedAt: FieldValue.serverTimestamp(),
          },
        },
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: uid,
      },
      { merge: true }
    );

    return { documentType, status: "uploaded", storagePath, originalFileName };
  })
);

export const saveProviderAvailabilityProfile = onCall(
  { region: REGION },
  withSentryFunction("saveProviderAvailabilityProfile", async (request: CallableRequest<any>) => {
    const uid = request.auth?.uid || null;
    console.info("[saveProviderAvailabilityProfile] request received", {
      uid,
      authPresent: Boolean(uid),
      input: summarizeAvailabilityInput(request.data || {}),
    });

    try {
      const requiredUid = requireUid(request);
      const normalized = normalizeProviderAvailability(request.data || {});
      console.info("[saveProviderAvailabilityProfile] normalized", {
        uid: requiredUid,
        enabledDays: normalized.availabilityDayChips,
        summary: normalized.availabilitySummary,
      });

      const db = getDb();
      const providerRef = db.collection("providers").doc(requiredUid);
      const providerSnap = await providerRef.get();
      console.info("[saveProviderAvailabilityProfile] provider lookup", {
        uid: requiredUid,
        exists: providerSnap.exists,
      });
      if (!providerSnap.exists) {
        throw new HttpsError("not-found", "Profilul de prestator nu există.");
      }

      await providerRef.collection("availability").doc("profile").set({
        ...normalized,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: requiredUid,
      });
      console.info("[saveProviderAvailabilityProfile] availability document saved", {
        uid: requiredUid,
      });

      await providerRef.set(
        {
          professionalProfile: {
            availabilitySummary: normalized.availabilitySummary,
          },
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: requiredUid,
        },
        { merge: true }
      );
      console.info("[saveProviderAvailabilityProfile] provider summary updated", {
        uid: requiredUid,
      });

      return normalized;
    } catch (error) {
      logCallableError("saveProviderAvailabilityProfile", error, {
        uid,
        input: summarizeAvailabilityInput(request.data || {}),
      });
      throw error;
    }
  })
);

export const submitProviderOnboarding = onCall(
  { region: REGION },
  withSentryFunction("submitProviderOnboarding", async (request: CallableRequest<any>) => {
    const uid = requireUid(request);
    const db = getDb();
    const providerRef = db.collection("providers").doc(uid);
    const providerSnap = await providerRef.get();
    if (!providerSnap.exists) {
      throw new HttpsError("not-found", "Profilul de prestator nu există.");
    }

    const provider = providerSnap.data() || {};
    if (provider.status !== "pre_registered" && provider.status !== "rejected") {
      throw new HttpsError("failed-precondition", "Profilul nu poate fi trimis la verificare în statusul curent.");
    }

    const profile = provider.professionalProfile || {};
    if (!profile.displayName || !profile.specialization || !profile.coverageAreaText || !profile.avatarPath) {
      throw new HttpsError("failed-precondition", "Profilul profesional este incomplet.");
    }
    if (!isUploadedDocument(provider.documents?.identity) || !isUploadedDocument(provider.documents?.professional)) {
      throw new HttpsError("failed-precondition", "Documentele de verificare sunt obligatorii.");
    }

    await providerRef.set(
      {
        status: "pending_review",
        onboardingStatus: "pending_review",
        reviewState: {
          submittedAt: FieldValue.serverTimestamp(),
          lastReviewedAt: provider.reviewState?.lastReviewedAt ?? null,
        },
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: uid,
      },
      { merge: true }
    );

    await providerRef.collection("events").add({
      type: "status_changed",
      fromStatus: provider.status || null,
      toStatus: "pending_review",
      actorUid: uid,
      note: "Prestator trimis la verificare.",
      createdAt: FieldValue.serverTimestamp(),
    });

    return { status: "pending_review" };
  })
);
