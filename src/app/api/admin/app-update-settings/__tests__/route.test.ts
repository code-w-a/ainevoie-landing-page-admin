import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  let docData: Record<string, unknown> | null = null;

  return {
    requireAdmin: vi.fn(),
    adminAuthErrorResponse: vi.fn(),
    captureServerException: vi.fn(),
    devLogServerError: vi.fn(),
    serverTimestamp: vi.fn(() => "server-timestamp"),
    getDocData: () => docData,
    setDocData: (value: Record<string, unknown> | null) => {
      docData = value;
    },
    setDoc: vi.fn(async (payload: Record<string, unknown>) => {
      docData = {
        ...(docData || {}),
        ...payload,
      };
    }),
  };
});

vi.mock("@/lib/adminAuth", () => ({
  requireAdmin: mocks.requireAdmin,
  adminAuthErrorResponse: mocks.adminAuthErrorResponse,
}));

vi.mock("@/lib/firebaseAdmin", () => ({
  getAdminDb: () => ({
    collection: () => ({
      doc: () => ({
        get: async () => ({
          exists: Boolean(mocks.getDocData()),
          data: () => mocks.getDocData(),
        }),
        set: mocks.setDoc,
      }),
    }),
  }),
}));

vi.mock("@/lib/sentryServer", () => ({
  captureServerException: mocks.captureServerException,
}));

vi.mock("@/lib/devServerErrorLog", () => ({
  devLogServerError: mocks.devLogServerError,
}));

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    serverTimestamp: mocks.serverTimestamp,
  },
}));

import { GET, PUT } from "../route";

describe("admin app update settings route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.setDocData(null);
    mocks.requireAdmin.mockResolvedValue({ uid: "admin-1" });
    mocks.adminAuthErrorResponse.mockReturnValue(null);
  });

  it("returns defaults that include paymentDemoModeEnabled on GET", async () => {
    const response = await GET(new Request("https://example.com/api/admin/app-update-settings"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.item.paymentDemoModeEnabled).toBe(false);
    expect(json.defaults.paymentDemoModeEnabled).toBe(false);
  });

  it("persists paymentDemoModeEnabled on PUT", async () => {
    const response = await PUT(new Request("https://example.com/api/admin/app-update-settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        enabled: false,
        paymentDemoModeEnabled: true,
        mode: "notice",
        urls: {},
      }),
    }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.item.paymentDemoModeEnabled).toBe(true);
    expect(mocks.setDoc).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentDemoModeEnabled: true,
      }),
      { merge: true }
    );
  });
});
