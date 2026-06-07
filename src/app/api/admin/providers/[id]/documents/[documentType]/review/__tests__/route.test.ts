import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminMock = vi.fn();
const adminAuthErrorResponseMock = vi.fn();
const callAdminCallableMock = vi.fn();

vi.mock("@/lib/adminAuth", () => ({
  requireAdmin: requireAdminMock,
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

vi.mock("@/lib/sentryServer", () => ({
  captureServerException: vi.fn(),
}));

describe("POST /api/admin/providers/[id]/documents/[documentType]/review", () => {
  beforeEach(() => {
    vi.resetModules();
    requireAdminMock.mockResolvedValue({ uid: "admin_1", idToken: "token" });
    adminAuthErrorResponseMock.mockReturnValue(null);
    callAdminCallableMock.mockResolvedValue({
      providerId: "provider_1",
      documentType: "identity",
      status: "approved",
    });
  });

  it("proxies document approval to adminReviewProviderDocument callable", async () => {
    const { POST } = await import("../route");

    const response = await POST(
      new Request("https://example.com/api/admin/providers/provider_1/documents/identity/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      }),
      { params: Promise.resolve({ id: "provider_1", documentType: "identity" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      providerId: "provider_1",
      documentType: "identity",
      status: "approved",
    });
    expect(callAdminCallableMock).toHaveBeenCalledWith(
      "adminReviewProviderDocument",
      expect.objectContaining({
        providerId: "provider_1",
        documentType: "identity",
        action: "approve",
        adminUid: "admin_1",
      }),
      "Nu am putut procesa documentul prestatorului.",
      "token"
    );
  });

  it("requires reason for reject", async () => {
    const { POST } = await import("../route");

    const response = await POST(
      new Request("https://example.com/api/admin/providers/provider_1/documents/identity/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      }),
      { params: Promise.resolve({ id: "provider_1", documentType: "identity" }) }
    );

    expect(response.status).toBe(400);
    expect(callAdminCallableMock).not.toHaveBeenCalled();
  });

  it("rejects invalid document types", async () => {
    const { POST } = await import("../route");

    const response = await POST(
      new Request("https://example.com/api/admin/providers/provider_1/documents/passport/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      }),
      { params: Promise.resolve({ id: "provider_1", documentType: "passport" }) }
    );

    expect(response.status).toBe(400);
    expect(callAdminCallableMock).not.toHaveBeenCalled();
  });
});
