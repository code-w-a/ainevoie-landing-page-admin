import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  providerGet: vi.fn(),
  file: vi.fn(),
  fileExists: vi.fn(),
  fileDownload: vi.fn(),
  fileGetMetadata: vi.fn(),
}));

vi.mock("@/lib/adminAuth", () => ({
  requireAdmin: vi.fn().mockResolvedValue({ uid: "admin-uid" }),
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
  getAdminStorageBucket: () => ({
    file: mocks.file,
  }),
}));

function providerSnap(data: Record<string, unknown> | null) {
  return {
    exists: Boolean(data),
    data: () => data,
  };
}

function request() {
  return new Request("https://example.com/api/admin/providers/provider-1/avatar");
}

describe("GET /api/admin/providers/[id]/avatar", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.providerGet.mockReset();
    mocks.file.mockReset();
    mocks.fileExists.mockReset();
    mocks.fileDownload.mockReset();
    mocks.fileGetMetadata.mockReset();
    mocks.file.mockReturnValue({
      exists: mocks.fileExists,
      download: mocks.fileDownload,
      getMetadata: mocks.fileGetMetadata,
    });
  });

  it("returns 404 for a missing provider", async () => {
    mocks.providerGet.mockResolvedValueOnce(providerSnap(null));

    const { GET } = await import("../route");
    const response = await GET(request(), {
      params: Promise.resolve({ id: "provider-1" }),
    });

    expect(response.status).toBe(404);
    expect(mocks.file).not.toHaveBeenCalled();
  });

  it("returns 404 when avatarPath is missing", async () => {
    mocks.providerGet.mockResolvedValueOnce(
      providerSnap({
        professionalProfile: {
          displayName: "Provider One",
        },
      })
    );

    const { GET } = await import("../route");
    const response = await GET(request(), {
      params: Promise.resolve({ id: "provider-1" }),
    });

    expect(response.status).toBe(404);
    expect(mocks.file).not.toHaveBeenCalled();
  });

  it("rejects avatar paths outside the provider avatar folder", async () => {
    mocks.providerGet.mockResolvedValueOnce(
      providerSnap({
        professionalProfile: {
          avatarPath: "providers/other-provider/avatar/main.jpg",
        },
      })
    );

    const { GET } = await import("../route");
    const response = await GET(request(), {
      params: Promise.resolve({ id: "provider-1" }),
    });

    expect(response.status).toBe(404);
    expect(mocks.file).not.toHaveBeenCalled();
  });

  it("returns the avatar bytes inline for a valid avatar", async () => {
    mocks.providerGet.mockResolvedValueOnce(
      providerSnap({
        professionalProfile: {
          avatarPath: "providers/provider-1/avatar/main.jpg",
        },
      })
    );
    mocks.fileExists.mockResolvedValueOnce([true]);
    mocks.fileDownload.mockResolvedValueOnce([Buffer.from("avatar-bytes")]);
    mocks.fileGetMetadata.mockResolvedValueOnce([{ contentType: "image/jpeg" }]);

    const { GET } = await import("../route");
    const response = await GET(request(), {
      params: Promise.resolve({ id: "provider-1" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(response.headers.get("content-disposition")).toBe(
      'inline; filename="avatar-provider-1"'
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.text()).toBe("avatar-bytes");
    expect(mocks.file).toHaveBeenCalledWith("providers/provider-1/avatar/main.jpg");
  });
});
