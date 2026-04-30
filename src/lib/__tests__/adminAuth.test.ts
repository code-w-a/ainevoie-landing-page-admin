import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  adminDocGet: vi.fn(),
}));

vi.mock("firebase-admin/auth", () => ({
  getAuth: () => ({
    verifyIdToken: mocks.verifyIdToken,
  }),
}));

vi.mock("@/lib/firebaseAdmin", () => ({
  getAdminAuth: () => ({
    verifyIdToken: mocks.verifyIdToken,
  }),
  getAdminDb: () => ({
    collection: (collectionName: string) => {
      expect(collectionName).toBe("admini");
      return {
        doc: (uid: string) => {
          expect(uid).toBe("admin-uid");
          return {
            get: mocks.adminDocGet,
          };
        },
      };
    },
  }),
}));

function adminRequest(token = "token") {
  return new Request("https://example.com/api/admin/auth/session", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

function adminDoc(data: Record<string, unknown> | null) {
  return {
    exists: Boolean(data),
    data: () => data,
  };
}

describe("adminAuth", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ADMIN_EMAIL_ALLOWLIST", "");
    vi.stubEnv("NEXT_ADMIN_EMAIL_ALLOWLIST", "");
    mocks.verifyIdToken.mockReset();
    mocks.adminDocGet.mockReset();
    mocks.verifyIdToken.mockResolvedValue({
      uid: "admin-uid",
      email: "admin@example.com",
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 401 for a missing token", async () => {
    const { requireAdmin } = await import("@/lib/adminAuth");

    await expect(requireAdmin(new Request("https://example.com"))).rejects.toMatchObject({
      code: "missing_token",
      status: 401,
    });
  });

  it("returns 401 for an invalid token", async () => {
    mocks.verifyIdToken.mockRejectedValueOnce(new Error("bad token"));
    const { requireAdmin } = await import("@/lib/adminAuth");

    await expect(requireAdmin(adminRequest())).rejects.toMatchObject({
      code: "invalid_token",
      status: 401,
    });
  });

  it("returns 403 when admini/{uid} is missing", async () => {
    mocks.adminDocGet.mockResolvedValueOnce(adminDoc(null));
    const { requireAdmin } = await import("@/lib/adminAuth");

    await expect(requireAdmin(adminRequest())).rejects.toMatchObject({
      code: "not_admin",
      status: 403,
    });
  });

  it("allows isAdmin true from admini/{uid}", async () => {
    mocks.adminDocGet.mockResolvedValueOnce(adminDoc({ isAdmin: true }));
    const { requireAdmin } = await import("@/lib/adminAuth");

    const session = await requireAdmin(adminRequest());

    expect(session.uid).toBe("admin-uid");
    expect(session.adminAccessLevel).toBe("admin");
    expect(session.adminAccessSource).toBe("firestore");
  });

  it("allows role admin from admini/{uid}", async () => {
    mocks.adminDocGet.mockResolvedValueOnce(adminDoc({ role: "admin" }));
    const { requireAdmin } = await import("@/lib/adminAuth");

    const session = await requireAdmin(adminRequest());

    expect(session.adminAccessLevel).toBe("admin");
  });

  it("allows support only through requireAdminOrSupport", async () => {
    mocks.adminDocGet.mockResolvedValueOnce(adminDoc({ isSupport: true }));
    const { requireAdminOrSupport } = await import("@/lib/adminAuth");

    const session = await requireAdminOrSupport(adminRequest());

    expect(session.adminAccessLevel).toBe("support");
  });

  it("allows dev allowlist email without creating or reading admini/{uid}", async () => {
    vi.stubEnv("ADMIN_EMAIL_ALLOWLIST", "admin@example.com");
    const { requireAdmin } = await import("@/lib/adminAuth");

    const session = await requireAdmin(adminRequest());

    expect(session.adminAccessLevel).toBe("admin");
    expect(session.adminAccessSource).toBe("dev_allowlist");
    expect(mocks.adminDocGet).not.toHaveBeenCalled();
  });

  it("ignores dev allowlist in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_EMAIL_ALLOWLIST", "admin@example.com");
    mocks.adminDocGet.mockResolvedValueOnce(adminDoc(null));
    const { requireAdmin } = await import("@/lib/adminAuth");

    await expect(requireAdmin(adminRequest())).rejects.toMatchObject({
      code: "not_admin",
      status: 403,
    });
    expect(mocks.adminDocGet).toHaveBeenCalledTimes(1);
  });
});
