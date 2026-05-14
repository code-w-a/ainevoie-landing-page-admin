import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  providerGet: vi.fn(),
  sendEmail: vi.fn(),
  getEmailTemplateConfig: vi.fn(),
  renderTemplate: vi.fn(),
}));

vi.mock("@/lib/adminAuth", () => ({
  requireAdmin: vi.fn().mockResolvedValue({
    uid: "admin-uid",
    idToken: "admin-token",
  }),
  requireAdminOrSupport: vi.fn().mockResolvedValue({
    uid: "admin-uid",
    idToken: "admin-token",
  }),
  adminAuthErrorResponse: vi.fn((error: unknown) =>
    error instanceof Error && error.message === "not_admin"
      ? Response.json({ error: "Nu ai drepturi de administrator pentru acest cont." }, { status: 403 })
      : null
  ),
}));

vi.mock("@/lib/sentryServer", () => ({
  captureServerException: vi.fn(),
}));

vi.mock("@/lib/firebaseAdmin", () => ({
  getAdminDb: () => ({
    collection: () => ({
      doc: () => ({
        get: mocks.providerGet,
      }),
    }),
  }),
  requireEnv: (name: string) => {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Missing env: ${name}`);
    }
    return value;
  },
}));

vi.mock("@/lib/email", () => ({
  sendEmail: mocks.sendEmail,
}));

vi.mock("@/lib/emailTemplates/adminEmailTemplatesServer", () => ({
  getEmailTemplateConfig: mocks.getEmailTemplateConfig,
}));

vi.mock("@/lib/emailTemplates/adminEmailTemplates", () => ({
  renderTemplate: mocks.renderTemplate,
}));

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
}

describe("admin provider callable proxy routes", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("FIREBASE_PROJECT_ID", "test-project");
    vi.stubEnv("FIREBASE_REGION", "europe-west1");
    vi.stubEnv("ADMIN_API_KEY", "admin-secret");
    vi.stubGlobal("fetch", vi.fn());
    mocks.providerGet.mockResolvedValue({
      exists: true,
      data: () => ({
        email: "provider@example.com",
        locale: "ro",
        professionalProfile: {
          displayName: "Provider One",
        },
      }),
    });
    mocks.getEmailTemplateConfig.mockResolvedValue({});
    mocks.renderTemplate.mockReturnValue({
      subject: "Cont aprobat",
      html: "<p>approved</p>",
      text: "approved",
    });
    mocks.sendEmail.mockResolvedValue(undefined);
  });

  it("proxies provider list filters to listAdminProviders", async () => {
    vi.mocked(fetch).mockReturnValueOnce(
      jsonResponse({
        result: {
          items: [],
          pagination: { page: 2, pageSize: 20, total: 0, totalPages: 1 },
        },
      }) as ReturnType<typeof fetch>
    );

    const { GET } = await import("../route");
    const response = await GET(
      new Request(
        "https://example.com/api/admin/providers?page=2&pageSize=20&q=ana&status=pending_review&countyCode=B&cityCode=179196&serviceType=Curatenie"
      )
    );

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledWith(
      "https://europe-west1-test-project.cloudfunctions.net/listAdminProviders",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          data: {
            page: 2,
            pageSize: 20,
            q: "ana",
            status: "pending_review",
            countyCode: "B",
            cityCode: "179196",
            serviceType: "Curatenie",
            adminApiKey: "admin-secret",
          },
        }),
      })
    );
  });

  it("proxies provider detail to getAdminProviderCase", async () => {
    vi.mocked(fetch).mockReturnValueOnce(
      jsonResponse({ result: { provider: { uid: "provider-1" } } }) as ReturnType<typeof fetch>
    );

    const { GET } = await import("../[id]/route");
    const response = await GET(new Request("https://example.com/api/admin/providers/provider-1"), {
      params: Promise.resolve({ id: "provider-1" }),
    });

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledWith(
      "https://europe-west1-test-project.cloudfunctions.net/getAdminProviderCase",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          data: {
            providerId: "provider-1",
            adminApiKey: "admin-secret",
          },
        }),
      })
    );
  });

  it("returns 403 instead of 500 when the account is not admin", async () => {
    const adminAuth = await import("@/lib/adminAuth");
    vi.mocked(adminAuth.requireAdminOrSupport).mockRejectedValueOnce(
      new Error("not_admin")
    );

    const { GET } = await import("../route");
    const response = await GET(
      new Request("https://example.com/api/admin/providers?page=1&pageSize=20")
    );
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe("Nu ai drepturi de administrator pentru acest cont.");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("requires a reason before calling reject or suspend review actions", async () => {
    const { POST } = await import("../[id]/review/route");
    const response = await POST(
      new Request("https://example.com/api/admin/providers/provider-1/review", {
        method: "POST",
        body: JSON.stringify({ action: "reject" }),
      }),
      { params: Promise.resolve({ id: "provider-1" }) }
    );

    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("proxies review actions and propagates callable errors", async () => {
    vi.mocked(fetch).mockReturnValueOnce(
      jsonResponse({ error: { message: "Transition not allowed" } }, 400) as ReturnType<
        typeof fetch
      >
    );

    const { POST } = await import("../[id]/review/route");
    const response = await POST(
      new Request("https://example.com/api/admin/providers/provider-1/review", {
        method: "POST",
        body: JSON.stringify({ action: "suspend", reason: "Document expirat" }),
      }),
      { params: Promise.resolve({ id: "provider-1" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Transition not allowed");
    expect(fetch).toHaveBeenCalledWith(
      "https://europe-west1-test-project.cloudfunctions.net/adminReviewProvider",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          data: {
            providerId: "provider-1",
            action: "suspend",
            reason: "Document expirat",
            adminUid: "admin-uid",
            adminApiKey: "admin-secret",
          },
        }),
      })
    );
  });

  it("sends providerApproved email after a successful approve action", async () => {
    vi.mocked(fetch).mockReturnValueOnce(
      jsonResponse({ result: { providerId: "provider-1", status: "approved" } }) as ReturnType<typeof fetch>
    );

    const { POST } = await import("../[id]/review/route");
    const response = await POST(
      new Request("https://example.com/api/admin/providers/provider-1/review", {
        method: "POST",
        body: JSON.stringify({ action: "approve" }),
      }),
      { params: Promise.resolve({ id: "provider-1" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ providerId: "provider-1", status: "approved" });
    expect(mocks.providerGet).toHaveBeenCalledTimes(1);
    expect(mocks.getEmailTemplateConfig).toHaveBeenCalledTimes(1);
    expect(mocks.renderTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "providerApproved",
        locale: "ro",
        vars: expect.objectContaining({
          fullName: "Provider One",
          email: "provider@example.com",
        }),
      })
    );
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "provider@example.com",
        subject: "Cont aprobat",
      })
    );
  });

  it("keeps approve success response even when providerApproved email sending fails", async () => {
    vi.mocked(fetch).mockReturnValueOnce(
      jsonResponse({ result: { providerId: "provider-1", status: "approved" } }) as ReturnType<typeof fetch>
    );
    mocks.sendEmail.mockRejectedValueOnce(new Error("smtp down"));

    const { POST } = await import("../[id]/review/route");
    const response = await POST(
      new Request("https://example.com/api/admin/providers/provider-1/review", {
        method: "POST",
        body: JSON.stringify({ action: "approve" }),
      }),
      { params: Promise.resolve({ id: "provider-1" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ providerId: "provider-1", status: "approved" });
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1);
  });

  it("does not send providerApproved email for non-approve review actions", async () => {
    vi.mocked(fetch).mockReturnValueOnce(
      jsonResponse({ result: { providerId: "provider-1", status: "rejected" } }) as ReturnType<typeof fetch>
    );

    const { POST } = await import("../[id]/review/route");
    const response = await POST(
      new Request("https://example.com/api/admin/providers/provider-1/review", {
        method: "POST",
        body: JSON.stringify({ action: "reject", reason: "Informații incomplete" }),
      }),
      { params: Promise.resolve({ id: "provider-1" }) }
    );

    expect(response.status).toBe(200);
    expect(mocks.providerGet).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("skips providerApproved email when provider email is missing", async () => {
    vi.mocked(fetch).mockReturnValueOnce(
      jsonResponse({ result: { providerId: "provider-1", status: "approved" } }) as ReturnType<typeof fetch>
    );
    mocks.providerGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        locale: "en",
        professionalProfile: { displayName: "Provider One" },
      }),
    });

    const { POST } = await import("../[id]/review/route");
    const response = await POST(
      new Request("https://example.com/api/admin/providers/provider-1/review", {
        method: "POST",
        body: JSON.stringify({ action: "approve" }),
      }),
      { params: Promise.resolve({ id: "provider-1" }) }
    );

    expect(response.status).toBe(200);
    expect(mocks.getEmailTemplateConfig).not.toHaveBeenCalled();
    expect(mocks.renderTemplate).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("proxies provider deletion to adminDeleteProvider", async () => {
    vi.mocked(fetch).mockReturnValueOnce(
      jsonResponse({ result: { providerId: "provider-1", deleted: true } }) as ReturnType<typeof fetch>
    );

    const { DELETE } = await import("../[id]/route");
    const response = await DELETE(
      new Request("https://example.com/api/admin/providers/provider-1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "provider-1" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ providerId: "provider-1", deleted: true });
    expect(fetch).toHaveBeenCalledWith(
      "https://europe-west1-test-project.cloudfunctions.net/adminDeleteProvider",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          data: {
            providerId: "provider-1",
            adminUid: "admin-uid",
            adminApiKey: "admin-secret",
          },
        }),
      })
    );
  });

  it("propagates provider deletion callable errors", async () => {
    vi.mocked(fetch).mockReturnValueOnce(
      jsonResponse({ error: { message: "Only admin users can delete providers." } }, 403) as ReturnType<typeof fetch>
    );

    const { DELETE } = await import("../[id]/route");
    const response = await DELETE(
      new Request("https://example.com/api/admin/providers/provider-1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "provider-1" }) }
    );
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe("Only admin users can delete providers.");
  });
});
