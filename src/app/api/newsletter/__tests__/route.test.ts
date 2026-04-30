import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  captureServerException: vi.fn(),
  getAdminDb: vi.fn(),
}));

vi.mock("@/lib/firebaseAdmin", () => ({
  getAdminDb: mocks.getAdminDb,
}));

vi.mock("@/lib/sentryServer", () => ({
  captureServerException: mocks.captureServerException,
}));

import { POST } from "../route";

type SubscriberDoc = {
  ref: {
    update: ReturnType<typeof vi.fn>;
  };
  get: (field: string) => unknown;
};

type QuerySnapshot = {
  empty: boolean;
  docs: SubscriberDoc[];
};

function request(body: Record<string, unknown>) {
  return new Request("https://example.com/api/newsletter", {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });
}

function emptySnapshot(): QuerySnapshot {
  return { empty: true, docs: [] };
}

function subscriberSnapshot(status: string) {
  const update = vi.fn();
  const snapshot: QuerySnapshot = {
    empty: false,
    docs: [
      {
        ref: { update },
        get: (field: string) => (field === "status" ? status : undefined),
      },
    ],
  };

  return { snapshot, update };
}

function firestoreWithSnapshots(snapshots: QuerySnapshot[]) {
  const get = vi.fn();
  snapshots.forEach((snapshot) => get.mockResolvedValueOnce(snapshot));

  const add = vi.fn().mockResolvedValue({ id: "subscriber-id" });
  const limit = vi.fn(() => ({ get }));
  const where = vi.fn(() => ({ limit }));
  const collection = vi.fn(() => ({ add, where }));
  const db = { collection };

  mocks.getAdminDb.mockReturnValue(db);
  return { add, collection, get, limit, where };
}

describe("POST /api/newsletter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when email is missing", async () => {
    const response = await POST(request({}));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "NEWSLETTER_EMAIL_REQUIRED",
    });
    expect(mocks.getAdminDb).not.toHaveBeenCalled();
  });

  it("returns 400 when email is invalid", async () => {
    const response = await POST(request({ acceptTerms: true, email: "not-an-email" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "NEWSLETTER_INVALID_EMAIL",
    });
    expect(mocks.getAdminDb).not.toHaveBeenCalled();
  });

  it("returns 400 when terms are missing", async () => {
    const response = await POST(request({ email: "user@example.com" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "TERMS_NOT_ACCEPTED",
    });
    expect(mocks.getAdminDb).not.toHaveBeenCalled();
  });

  it("returns 400 when terms are not accepted", async () => {
    const response = await POST(
      request({ acceptTerms: false, email: "user@example.com" }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "TERMS_NOT_ACCEPTED",
    });
    expect(mocks.getAdminDb).not.toHaveBeenCalled();
  });

  it("creates a new active subscriber", async () => {
    const db = firestoreWithSnapshots([emptySnapshot(), emptySnapshot()]);

    const response = await POST(request({ acceptTerms: true, email: " User@Example.com " }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "subscribed" });
    expect(db.add).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "user@example.com",
        emailNormalized: "user@example.com",
        privacyVersion: "v1",
        source: "landing_form",
        status: "active",
        termsVersion: "v1",
      }),
    );
  });

  it("reactivates an existing subscriber", async () => {
    const existing = subscriberSnapshot("inactive");
    firestoreWithSnapshots([existing.snapshot]);

    const response = await POST(request({ acceptTerms: true, email: "user@example.com" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "already_subscribed" });
    expect(existing.update).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "user@example.com",
        emailNormalized: "user@example.com",
        privacyVersion: "v1",
        source: "landing_form",
        status: "active",
        termsVersion: "v1",
      }),
    );
  });

  it("returns 500 and captures the exception when Firestore fails", async () => {
    mocks.getAdminDb.mockImplementation(() => {
      throw new Error("db down");
    });

    const response = await POST(request({ acceptTerms: true, email: "user@example.com" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      code: "NEWSLETTER_SUBSCRIBE_FAILED",
    });
    expect(mocks.captureServerException).toHaveBeenCalledWith(
      expect.any(Error),
      { route: "api/newsletter/route.ts" },
    );
  });
});
