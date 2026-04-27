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

function hasConfiguredAvailability(value: any) {
  return value?.hasConfiguredAvailability === true && Boolean(value.availabilitySummary);
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
    const uid = requireUid(request);
    const normalized = normalizeProviderAvailability(request.data || {});
    const db = getDb();
    const providerRef = db.collection("providers").doc(uid);
    const providerSnap = await providerRef.get();
    if (!providerSnap.exists) {
      throw new HttpsError("not-found", "Profilul de prestator nu există.");
    }

    await providerRef.collection("availability").doc("profile").set({
      ...normalized,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid,
    });
    await providerRef.set(
      {
        professionalProfile: {
          availabilitySummary: normalized.availabilitySummary,
        },
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: uid,
      },
      { merge: true }
    );

    return normalized;
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

    const availabilitySnap = await providerRef.collection("availability").doc("profile").get();
    if (!availabilitySnap.exists || !hasConfiguredAvailability(availabilitySnap.data())) {
      throw new HttpsError("failed-precondition", "Disponibilitatea trebuie configurată înainte de trimitere.");
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
