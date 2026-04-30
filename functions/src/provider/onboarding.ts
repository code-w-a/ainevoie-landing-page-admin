import { getStorage } from "firebase-admin/storage";
import { FieldValue } from "firebase-admin/firestore";
import sharp from "sharp";
import {
  CallableRequest,
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";
import { getDefaultFirebaseApp } from "../shared/firebaseAdmin";
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
  const [exists] = await getStorage(getDefaultFirebaseApp())
    .bucket()
    .file(storagePath)
    .exists();
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

function logCallableInfo(handler: string, event: string, extra: Record<string, unknown>) {
  console.info(`[${handler}] ${event}`, extra);
}

function summarizeSubmitProviderOnboardingPayload(data: unknown) {
  const payload = data && typeof data === "object" ? data as Record<string, any> : {};
  const documents = payload.documents && typeof payload.documents === "object"
    ? payload.documents as Record<string, any>
    : {};
  return {
    payloadKeys: Object.keys(payload).sort(),
    hasUid: typeof payload.uid === "string" && payload.uid.trim().length > 0,
    hasProviderUid:
      typeof payload.providerUid === "string" && payload.providerUid.trim().length > 0,
    hasAvatarPath:
      typeof payload.avatarPath === "string" && payload.avatarPath.trim().length > 0,
    hasDocuments: Boolean(payload.documents && typeof payload.documents === "object"),
    hasIdentityDocumentPath:
      typeof documents.identity?.storagePath === "string" &&
      documents.identity.storagePath.trim().length > 0,
    hasProfessionalDocumentPath:
      typeof documents.professional?.storagePath === "string" &&
      documents.professional.storagePath.trim().length > 0,
  };
}

export const finalizeProviderAvatarUpload = onCall(
  { region: REGION },
  withSentryFunction("finalizeProviderAvatarUpload", async (request: CallableRequest<any>) => {
    const authUid = request.auth?.uid || null;
    const requestedStoragePath =
      typeof request.data?.storagePath === "string" ? request.data.storagePath : null;
    logCallableInfo("finalizeProviderAvatarUpload", "request received", {
      uid: authUid,
      storagePath: requestedStoragePath,
    });

    try {
      const uid = requireUid(request);
      const storagePath = readString(request.data?.storagePath, "storagePath");
      assertStoragePath(storagePath, `providers/${uid}/avatar/`);
      logCallableInfo("finalizeProviderAvatarUpload", "storage path validated", {
        uid,
        storagePath,
      });

      await assertFileExists(storagePath);
      logCallableInfo("finalizeProviderAvatarUpload", "source file exists", {
        uid,
        storagePath,
      });

      const avatarPath = `providers/${uid}/avatar/profile.jpg`;
      const bucket = getStorage(getDefaultFirebaseApp()).bucket();
      const [sourceBuffer] = await bucket.file(storagePath).download();
      logCallableInfo("finalizeProviderAvatarUpload", "source file downloaded", {
        uid,
        storagePath,
        sourceBytes: sourceBuffer.length,
      });

      const normalizedBuffer = await sharp(sourceBuffer)
        .rotate()
        .resize(1024, 1024, { fit: "cover", position: "centre" })
        .jpeg({ quality: 92 })
        .toBuffer();

      await bucket.file(avatarPath).save(normalizedBuffer, {
        contentType: "image/jpeg",
        metadata: {
          cacheControl: "public, max-age=3600",
        },
      });
      logCallableInfo("finalizeProviderAvatarUpload", "normalized avatar saved", {
        uid,
        storagePath,
        avatarPath,
        normalizedBytes: normalizedBuffer.length,
      });

      const db = getDb();
      const providerRef = db.collection("providers").doc(uid);
      const providerSnap = await providerRef.get();
      logCallableInfo("finalizeProviderAvatarUpload", "provider lookup completed", {
        uid,
        exists: providerSnap.exists,
      });
      if (!providerSnap.exists) {
        throw new HttpsError("not-found", "Profilul de prestator nu există.");
      }

      await providerRef.set(
        {
          professionalProfile: {
            avatarPath,
          },
          updatedAt: FieldValue.serverTimestamp(),
          updatedBy: uid,
        },
        { merge: true }
      );
      logCallableInfo("finalizeProviderAvatarUpload", "provider avatar path saved", {
        uid,
        avatarPath,
      });

      return { status: "uploaded", storagePath, avatarPath };
    } catch (error) {
      logCallableError("finalizeProviderAvatarUpload", error, {
        uid: authUid,
        storagePath: requestedStoragePath,
      });
      throw error;
    }
  })
);

export const finalizeProviderDocumentUpload = onCall(
  { region: REGION },
  withSentryFunction("finalizeProviderDocumentUpload", async (request: CallableRequest<any>) => {
    const authUid = request.auth?.uid || null;
    const requestedDocumentType =
      typeof request.data?.documentType === "string" ? request.data.documentType : null;
    const requestedStoragePath =
      typeof request.data?.storagePath === "string" ? request.data.storagePath : null;
    logCallableInfo("finalizeProviderDocumentUpload", "request received", {
      uid: authUid,
      documentType: requestedDocumentType,
      storagePath: requestedStoragePath,
    });

    try {
      const uid = requireUid(request);
      const documentType = readDocumentType(request.data?.documentType);
      const storagePath = readString(request.data?.storagePath, "storagePath");
      const originalFileName = readString(request.data?.originalFileName, "originalFileName");
      assertStoragePath(storagePath, `providers/${uid}/documents/${documentType}/`);
      logCallableInfo("finalizeProviderDocumentUpload", "storage path validated", {
        uid,
        documentType,
        storagePath,
        originalFileName,
      });

      await assertFileExists(storagePath);
      logCallableInfo("finalizeProviderDocumentUpload", "source file exists", {
        uid,
        documentType,
        storagePath,
      });

      const db = getDb();
      const providerRef = db.collection("providers").doc(uid);
      const providerSnap = await providerRef.get();
      logCallableInfo("finalizeProviderDocumentUpload", "provider lookup completed", {
        uid,
        exists: providerSnap.exists,
      });
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
      logCallableInfo("finalizeProviderDocumentUpload", "provider document metadata saved", {
        uid,
        documentType,
        storagePath,
      });

      return { documentType, status: "uploaded", storagePath, originalFileName };
    } catch (error) {
      logCallableError("finalizeProviderDocumentUpload", error, {
        uid: authUid,
        documentType: requestedDocumentType,
        storagePath: requestedStoragePath,
      });
      throw error;
    }
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
    const authUid = request.auth?.uid || null;
    const payloadSummary = summarizeSubmitProviderOnboardingPayload(request.data || {});
    logCallableInfo("submitProviderOnboarding", "request received", {
      uid: authUid,
      ...payloadSummary,
    });

    try {
      const uid = requireUid(request);
      const db = getDb();
      const providerRef = db.collection("providers").doc(uid);
      const providerSnap = await providerRef.get();
      logCallableInfo("submitProviderOnboarding", "provider lookup completed", {
        uid,
        exists: providerSnap.exists,
      });
      if (!providerSnap.exists) {
        throw new HttpsError("not-found", "Profilul de prestator nu există.");
      }

      const provider = providerSnap.data() || {};
      const profile = provider.professionalProfile || {};
      logCallableInfo("submitProviderOnboarding", "precondition snapshot", {
        uid,
        status: provider.status || null,
        hasDisplayName: Boolean(profile.displayName),
        hasSpecialization: Boolean(profile.specialization),
        hasCoverageAreaText: Boolean(profile.coverageAreaText),
        hasAvatarPath: Boolean(profile.avatarPath),
        identityDocumentUploaded: isUploadedDocument(provider.documents?.identity),
        professionalDocumentUploaded: isUploadedDocument(provider.documents?.professional),
      });

      if (provider.status !== "pre_registered" && provider.status !== "rejected") {
        throw new HttpsError("failed-precondition", "Profilul nu poate fi trimis la verificare în statusul curent.");
      }

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
      logCallableInfo("submitProviderOnboarding", "provider status saved", {
        uid,
        fromStatus: provider.status || null,
        toStatus: "pending_review",
      });

      await providerRef.collection("events").add({
        type: "status_changed",
        fromStatus: provider.status || null,
        toStatus: "pending_review",
        actorUid: uid,
        note: "Prestator trimis la verificare.",
        createdAt: FieldValue.serverTimestamp(),
      });
      logCallableInfo("submitProviderOnboarding", "provider event saved", {
        uid,
        type: "status_changed",
        toStatus: "pending_review",
      });

      return { status: "pending_review" };
    } catch (error) {
      logCallableError("submitProviderOnboarding", error, {
        uid: authUid,
        ...payloadSummary,
      });
      throw error;
    }
  })
);
