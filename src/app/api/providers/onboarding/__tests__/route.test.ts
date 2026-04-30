import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  captureServerException: vi.fn(),
  getAdminDb: vi.fn(),
  getAdminAuth: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendEmail: mocks.sendEmail,
}));

vi.mock("@/lib/firebaseAdmin", () => ({
  getAdminAuth: mocks.getAdminAuth,
  getAdminDb: mocks.getAdminDb,
}));

vi.mock("@/lib/sentryServer", () => ({
  captureServerException: mocks.captureServerException,
}));

import { POST } from "../route";

type QuerySnapshot = {
  empty: boolean;
  docs: unknown[];
};

const validPayload = {
  acceptTerms: true,
  cityCode: "179196",
  countyCode: "B",
  email: "provider@example.com",
  fullName: "Provider Test",
  legalStatus: "need_guidance",
  password: "Passw0rd!",
  phone: "0700000000",
  serviceType: "Curatenie birouri",
};

function request(body: Record<string, unknown>) {
  return new Request("https://example.com/api/providers/onboarding", {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      "x-next-intl-locale": "ro",
    },
    method: "POST",
  });
}

function firestoreWithProviderSnapshot(snapshot: QuerySnapshot) {
  const get = vi.fn().mockResolvedValue(snapshot);
  const limit = vi.fn(() => ({ get }));
  const where = vi.fn(() => ({ limit }));
  const collection = vi.fn(() => ({ where }));
  const db = { collection };

  mocks.getAdminDb.mockReturnValue(db);
  return { collection, get, limit, where };
}

function firestoreForSuccessfulSignup() {
  const providersGet = vi.fn().mockResolvedValue({
    docs: [],
    empty: true,
  });
  const providersLimit = vi.fn(() => ({ get: providersGet }));
  const providersWhere = vi.fn(() => ({ limit: providersLimit }));
  const providerSet = vi.fn().mockResolvedValue(undefined);
  const providerEventAdd = vi.fn().mockResolvedValue({ id: "event-1" });
  const providerCollection = vi.fn(() => ({ add: providerEventAdd }));
  const providerDoc = vi.fn(() => ({
    collection: providerCollection,
    set: providerSet,
  }));
  const providersCollection = {
    doc: providerDoc,
    where: providersWhere,
  };
  const collection = vi.fn((name: string) => {
    if (name === "providers") {
      return providersCollection;
    }

    throw new Error(`Unexpected collection: ${name}`);
  });
  const db = { collection };

  mocks.getAdminDb.mockReturnValue(db);
  return { providerEventAdd, providerSet };
}

describe("POST /api/providers/onboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when required fields are missing", async () => {
    const response = await POST(request({ email: "provider@example.com" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "MISSING_FIELDS",
    });
    expect(mocks.getAdminDb).not.toHaveBeenCalled();
  });

  it("returns 400 when email is invalid", async () => {
    const response = await POST(
      request({
        ...validPayload,
        email: "provider.example.com",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "INVALID_EMAIL",
    });
    expect(mocks.getAdminDb).not.toHaveBeenCalled();
  });

  it("returns 400 when terms are not accepted", async () => {
    const response = await POST(
      request({
        ...validPayload,
        acceptTerms: false,
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "TERMS_NOT_ACCEPTED",
    });
    expect(mocks.getAdminDb).not.toHaveBeenCalled();
  });

  it("returns 400 when countyCode is missing", async () => {
    const response = await POST(
      request({
        ...validPayload,
        countyCode: undefined,
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "MISSING_FIELDS",
    });
    expect(mocks.getAdminDb).not.toHaveBeenCalled();
  });

  it("returns 400 when cityCode is missing", async () => {
    const response = await POST(
      request({
        ...validPayload,
        cityCode: undefined,
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "MISSING_FIELDS",
    });
    expect(mocks.getAdminDb).not.toHaveBeenCalled();
  });

  it("returns 400 when countyCode is invalid", async () => {
    const response = await POST(
      request({
        ...validPayload,
        countyCode: "XX",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "INVALID_COUNTY",
    });
    expect(mocks.getAdminDb).not.toHaveBeenCalled();
  });

  it("returns 400 when cityCode belongs to a different county", async () => {
    const response = await POST(
      request({
        ...validPayload,
        countyCode: "CJ",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "INVALID_CITY",
    });
    expect(mocks.getAdminDb).not.toHaveBeenCalled();
  });

  it("returns 400 when provider service option is invalid", async () => {
    const response = await POST(
      request({
        ...validPayload,
        serviceType: "Instalatii",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "INVALID_SERVICE",
    });
    expect(mocks.getAdminDb).not.toHaveBeenCalled();
  });

  it("returns 409 when the provider email already exists", async () => {
    firestoreWithProviderSnapshot({
      docs: [{ id: "existing-provider" }],
      empty: false,
    });

    const response = await POST(request(validPayload));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: "PROVIDER_EMAIL_EXISTS",
    });
    expect(mocks.getAdminAuth).not.toHaveBeenCalled();
  });

  it("creates a provider with county and city snapshots", async () => {
    const { providerEventAdd, providerSet } = firestoreForSuccessfulSignup();
    const createUser = vi.fn().mockResolvedValue({ uid: "provider-uid" });
    const setCustomUserClaims = vi.fn().mockResolvedValue(undefined);
    mocks.getAdminAuth.mockReturnValue({ createUser, setCustomUserClaims });
    mocks.sendEmail.mockResolvedValue(undefined);

    const response = await POST(request(validPayload));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "created",
      uid: "provider-uid",
    });
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: "Provider Test",
        email: "provider@example.com",
      }),
    );
    expect(providerSet).toHaveBeenCalledWith(
      expect.objectContaining({
        accountStatus: "active",
        authProviders: ["password"],
        city: "Sector 6",
        cityCode: "179196",
        cityName: "Sector 6",
        cityNameNormalized: "sector 6",
        cityNormalized: "sector 6",
        createdBy: "provider-uid",
        countyCode: "B",
        countyName: "București",
        countyNameNormalized: "bucuresti",
        coverageAreaText: "România, București, Sector 6",
        documents: {
          identity: {
            originalFileName: null,
            status: "missing",
            storagePath: null,
            uploadedAt: null,
          },
          professional: {
            originalFileName: null,
            status: "missing",
            storagePath: null,
            uploadedAt: null,
          },
        },
        locale: "ro",
        notificationPreferences: {
          bookings: true,
          messages: true,
          promoSystem: true,
        },
        phoneNumber: "0700000000",
        adminReview: {
          action: null,
          reason: null,
          reviewedAt: null,
          reviewedBy: null,
        },
        lastLoginAt: expect.anything(),
        lastPublishedAt: null,
        professionalProfile: {
          avatarPath: null,
          availabilitySummary: "",
          baseRateAmount: null,
          baseRateCurrency: "RON",
          businessName: "",
          coverageArea: {
            centerLat: null,
            centerLng: null,
            cityCode: "179196",
            cityName: "Sector 6",
            countryCode: "RO",
            countryName: "România",
            countyCode: "B",
            countyName: "București",
            formattedAddress: "",
            locationLabel: "",
            placeId: "",
          },
          coverageAreaText: "România, București, Sector 6",
          displayName: "Provider Test",
          shortBio: "",
          specialization: "Curatenie birouri",
        },
        reviewState: {
          lastReviewedAt: null,
          submittedAt: null,
        },
        role: "provider",
        schemaVersion: 1,
        status: "pre_registered",
        suspension: null,
        onboardingStatus: "pre_registered",
        privacyAcceptedAt: expect.anything(),
        privacyVersion: "v1",
        termsAcceptedAt: expect.anything(),
        termsVersion: "v1",
        updatedBy: "provider-uid",
      }),
    );
    expect(setCustomUserClaims).toHaveBeenCalledWith("provider-uid", {
      role: "provider",
      providerStatus: "pre_registered",
      isSuspended: false,
    });
    expect(providerEventAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        toStatus: "pre_registered",
        type: "status_changed",
      }),
    );
  });
});
