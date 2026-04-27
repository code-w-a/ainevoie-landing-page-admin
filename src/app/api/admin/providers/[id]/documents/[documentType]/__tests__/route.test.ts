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
  return new Request("https://example.com/api/admin/providers/provider-1/documents/identity");
}

describe("GET /api/admin/providers/[id]/documents/[documentType]", () => {
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

  it("rejects invalid document types", async () => {
    const { GET } = await import("../route");
    const response = await GET(request(), {
      params: Promise.resolve({ id: "provider-1", documentType: "avatar" }),
    });

    expect(response.status).toBe(400);
    expect(mocks.providerGet).not.toHaveBeenCalled();
  });

  it("returns 404 for a missing provider", async () => {
    mocks.providerGet.mockResolvedValueOnce(providerSnap(null));

    const { GET } = await import("../route");
    const response = await GET(request(), {
      params: Promise.resolve({ id: "provider-1", documentType: "identity" }),
    });

    expect(response.status).toBe(404);
  });

  it("rejects storage paths outside the provider document folder", async () => {
    mocks.providerGet.mockResolvedValueOnce(
      providerSnap({
        documents: {
          identity: {
            status: "uploaded",
            storagePath: "providers/other-provider/documents/identity/id.jpg",
            originalFileName: "id.jpg",
          },
        },
      })
    );

    const { GET } = await import("../route");
    const response = await GET(request(), {
      params: Promise.resolve({ id: "provider-1", documentType: "identity" }),
    });

    expect(response.status).toBe(404);
    expect(mocks.file).not.toHaveBeenCalled();
  });

  it("returns the document bytes inline for a valid document", async () => {
    mocks.providerGet.mockResolvedValueOnce(
      providerSnap({
        documents: {
          identity: {
            status: "uploaded",
            storagePath: "providers/provider-1/documents/identity/id.jpg",
            originalFileName: "id.jpg",
          },
        },
      })
    );
    mocks.fileExists.mockResolvedValueOnce([true]);
    mocks.fileDownload.mockResolvedValueOnce([Buffer.from("image-bytes")]);
    mocks.fileGetMetadata.mockResolvedValueOnce([{ contentType: "image/jpeg" }]);

    const { GET } = await import("../route");
    const response = await GET(request(), {
      params: Promise.resolve({ id: "provider-1", documentType: "identity" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(response.headers.get("content-disposition")).toBe('inline; filename="id.jpg"');
    expect(await response.text()).toBe("image-bytes");
    expect(mocks.file).toHaveBeenCalledWith("providers/provider-1/documents/identity/id.jpg");
  });
});
