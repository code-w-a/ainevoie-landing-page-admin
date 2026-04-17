import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  captureServerException: vi.fn(),
  getAdminDb: vi.fn(),
  getAuth: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock("firebase-admin/auth", () => ({
  getAuth: mocks.getAuth,
}));

vi.mock("@/lib/email", () => ({
  sendEmail: mocks.sendEmail,
}));

vi.mock("@/lib/firebaseAdmin", () => ({
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
  city: "Bucuresti",
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

  it("returns 400 when provider options are invalid", async () => {
    const response = await POST(
      request({
        ...validPayload,
        city: "Oradea",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "INVALID_CITY",
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
    expect(mocks.getAuth).not.toHaveBeenCalled();
  });
});
