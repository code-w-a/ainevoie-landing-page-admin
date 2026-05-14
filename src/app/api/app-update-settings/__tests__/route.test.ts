import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  let docData: Record<string, unknown> | null = null;

  return {
    captureServerException: vi.fn(),
    devLogServerError: vi.fn(),
    getDocData: () => docData,
    setDocData: (value: Record<string, unknown> | null) => {
      docData = value;
    },
  };
});

vi.mock("@/lib/firebaseAdmin", () => ({
  getAdminDb: () => ({
    collection: () => ({
      doc: () => ({
        get: async () => ({
          exists: Boolean(mocks.getDocData()),
          data: () => mocks.getDocData(),
        }),
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

import { GET } from "../route";

describe("public app update settings route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.setDocData(null);
  });

  it("returns paymentDemoModeEnabled from persisted settings", async () => {
    mocks.setDocData({
      enabled: true,
      paymentDemoModeEnabled: true,
      mode: "notice",
      urls: {
        fallback: "https://ainevoie.ro/update",
      },
    });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(json.item.paymentDemoModeEnabled).toBe(true);
  });

  it("returns default paymentDemoModeEnabled when document is missing", async () => {
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.item.paymentDemoModeEnabled).toBe(false);
  });
});
