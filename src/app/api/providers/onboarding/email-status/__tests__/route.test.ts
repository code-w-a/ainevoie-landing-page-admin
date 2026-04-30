import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  captureServerException: vi.fn(),
  getAdminAuth: vi.fn(),
  getAdminDb: vi.fn(),
}));

vi.mock("@/lib/firebaseAdmin", () => ({
  getAdminAuth: mocks.getAdminAuth,
  getAdminDb: mocks.getAdminDb,
}));

vi.mock("@/lib/sentryServer", () => ({
  captureServerException: mocks.captureServerException,
}));

import { GET } from "../route";

function request(email?: string) {
  const url = new URL("https://example.com/api/providers/onboarding/email-status");
  if (email !== undefined) {
    url.searchParams.set("email", email);
  }
  return new Request(url, {
    headers: { "x-next-intl-locale": "ro" },
  });
}

function mockProviderLookup(empty: boolean) {
  const get = vi.fn().mockResolvedValue({ empty });
  const limit = vi.fn(() => ({ get }));
  const where = vi.fn(() => ({ limit }));
  const collection = vi.fn(() => ({ where }));
  mocks.getAdminDb.mockReturnValue({ collection });
  return { collection, get, limit, where };
}

describe("GET /api/providers/onboarding/email-status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAdminAuth.mockReturnValue({
      getUserByEmail: vi.fn().mockRejectedValue({ code: "auth/user-not-found" }),
    });
  });

  it("returns 400 when email is missing", async () => {
    const response = await GET(request());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: expect.any(String) });
    expect(mocks.getAdminDb).not.toHaveBeenCalled();
  });

  it("returns 400 when email is invalid", async () => {
    const response = await GET(request("provider.example.com"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: expect.any(String) });
    expect(mocks.getAdminDb).not.toHaveBeenCalled();
  });

  it("returns exists true when provider email exists", async () => {
    mockProviderLookup(false);

    const response = await GET(request("Provider@Example.com"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      exists: true,
      source: "provider",
    });
    expect(mocks.getAdminAuth).not.toHaveBeenCalled();
  });

  it("returns exists true when only auth user exists", async () => {
    mockProviderLookup(true);
    const getUserByEmail = vi.fn().mockResolvedValue({ uid: "provider-uid" });
    mocks.getAdminAuth.mockReturnValue({ getUserByEmail });

    const response = await GET(request("provider@example.com"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      exists: true,
      source: "auth",
    });
    expect(getUserByEmail).toHaveBeenCalledWith("provider@example.com");
  });

  it("returns exists false when provider and auth user are missing", async () => {
    mockProviderLookup(true);

    const response = await GET(request("provider@example.com"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ exists: false });
  });
});
