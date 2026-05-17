import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminMock = vi.fn();
const requireAdminOrSupportMock = vi.fn();
const adminAuthErrorResponseMock = vi.fn();
const callAdminCallableMock = vi.fn();
const captureServerExceptionMock = vi.fn();
const getAdminDbMock = vi.fn();
const getAdminAuthMock = vi.fn();

vi.mock("@/lib/adminAuth", () => ({
  requireAdmin: requireAdminMock,
  requireAdminOrSupport: requireAdminOrSupportMock,
  adminAuthErrorResponse: adminAuthErrorResponseMock,
}));

vi.mock("@/lib/adminCallables", () => ({
  AdminCallableError: class AdminCallableError extends Error {
    status: number;
    constructor(message: string, status = 500) {
      super(message);
      this.status = status;
    }
  },
  callAdminCallable: callAdminCallableMock,
}));

vi.mock("@/lib/firebaseAdmin", () => ({
  getAdminDb: getAdminDbMock,
  getAdminAuth: getAdminAuthMock,
}));

vi.mock("@/lib/adminUsersFallback", () => ({
  getAdminUserCaseFallback: vi.fn(async () => ({ user: null, recentBookings: [], recentAuditEvents: [] })),
}));

vi.mock("@/lib/sentryServer", () => ({ captureServerException: captureServerExceptionMock }));

describe("DELETE /api/admin/users/[id]", () => {
  beforeEach(() => {
    vi.resetModules();
    requireAdminMock.mockResolvedValue({ uid: "admin_1", idToken: "token" });
    requireAdminOrSupportMock.mockResolvedValue({ uid: "admin_1", idToken: "token" });
    adminAuthErrorResponseMock.mockReturnValue(null);
    callAdminCallableMock.mockResolvedValue({ userId: "user_1", deleted: true });
    getAdminDbMock.mockReset();
    getAdminAuthMock.mockReset();
  });

  it("proxies user deletion to adminDeleteUser callable", async () => {
    const { DELETE } = await import("../route");

    const response = await DELETE(
      new Request("https://example.com/api/admin/users/user_1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "user_1" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ userId: "user_1", deleted: true });
    expect(callAdminCallableMock).toHaveBeenCalledWith(
      "adminDeleteUser",
      expect.objectContaining({ userId: "user_1", adminUid: "admin_1" }),
      "Nu am putut șterge utilizatorul.",
      "token"
    );
  });

  it("falls back to firestore delete when callable is missing", async () => {
    const { AdminCallableError } = await import("@/lib/adminCallables");
    callAdminCallableMock.mockRejectedValueOnce(new AdminCallableError("missing callable", 404));

    const userDocDelete = vi.fn(async () => undefined);
    const providerDocDelete = vi.fn(async () => undefined);
    const providerDirectoryDocDelete = vi.fn(async () => undefined);
    const collectionMock = vi.fn((name: string) => ({
      doc: (_id: string) => ({
        async get() {
          if (name === "admini") {
            return { data: () => ({ role: "user" }) };
          }
          if (name === "users") {
            return { data: () => ({ role: "user" }) };
          }
          return { data: () => null };
        },
        async delete() {
          if (name === "users") return userDocDelete();
          if (name === "providers") return providerDocDelete();
          if (name === "providerDirectory") return providerDirectoryDocDelete();
          return undefined;
        },
      }),
    }));

    getAdminDbMock.mockReturnValue({
      collection: collectionMock,
    });
    const deleteAuthUser = vi.fn(async () => undefined);
    getAdminAuthMock.mockReturnValue({
      deleteUser: deleteAuthUser,
    });

    const { DELETE } = await import("../route");

    const response = await DELETE(
      new Request("https://example.com/api/admin/users/user_1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "user_1" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ userId: "user_1", deleted: true, fallback: true });
    expect(userDocDelete).toHaveBeenCalledOnce();
    expect(providerDocDelete).toHaveBeenCalledOnce();
    expect(providerDirectoryDocDelete).toHaveBeenCalledOnce();
    expect(deleteAuthUser).toHaveBeenCalledWith("user_1");
  });

  it("returns 412 when fallback detects privileged admin/support account", async () => {
    const { AdminCallableError } = await import("@/lib/adminCallables");
    callAdminCallableMock.mockRejectedValueOnce(new AdminCallableError("missing callable", 404));

    getAdminDbMock.mockReturnValue({
      collection: vi.fn((_name: string) => ({
        doc: (_id: string) => ({
          async get() {
            return { data: () => ({ role: "admin" }) };
          },
          async delete() {
            return undefined;
          },
        }),
      })),
    });
    getAdminAuthMock.mockReturnValue({
      deleteUser: vi.fn(async () => undefined),
    });

    const { DELETE } = await import("../route");

    const response = await DELETE(
      new Request("https://example.com/api/admin/users/admin_uid", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "admin_uid" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(412);
    expect(json).toEqual({ error: "Nu poți șterge conturi de admin/support." });
  });
});
