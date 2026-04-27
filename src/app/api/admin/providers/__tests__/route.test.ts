import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/adminAuth", () => ({
  requireAdmin: vi.fn().mockResolvedValue({ uid: "admin-uid" }),
}));

vi.mock("@/lib/sentryServer", () => ({
  captureServerException: vi.fn(),
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
    vi.stubEnv("FIREBASE_PROJECT_ID", "test-project");
    vi.stubEnv("FIREBASE_REGION", "europe-west1");
    vi.stubEnv("ADMIN_API_KEY", "admin-secret");
    vi.stubGlobal("fetch", vi.fn());
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
            adminApiKey: "admin-secret",
          },
        }),
      })
    );
  });
});
