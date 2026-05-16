import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminMock = vi.fn();
const requireAdminOrSupportMock = vi.fn();
const adminAuthErrorResponseMock = vi.fn();
const callAdminCallableMock = vi.fn();
const captureServerExceptionMock = vi.fn();

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
});
