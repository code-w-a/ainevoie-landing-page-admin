import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  captureServerException: vi.fn(),
  fetchBnrEurRate: vi.fn(),
}));

vi.mock("@/lib/bnrEurRate", () => ({
  fetchBnrEurRate: mocks.fetchBnrEurRate,
}));

vi.mock("@/lib/sentryServer", () => ({
  captureServerException: mocks.captureServerException,
}));

import { GET } from "../route";

describe("GET /api/fx/bnr-eur", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the latest cached EUR/RON rate", async () => {
    mocks.fetchBnrEurRate.mockResolvedValueOnce({
      date: "2026-04-17",
      ronPerEur: 4.9764,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("s-maxage=3600");
    await expect(response.json()).resolves.toEqual({
      date: "2026-04-17",
      rate: 4.9764,
    });
  });

  it("returns 503 and captures errors when BNR is unavailable", async () => {
    mocks.fetchBnrEurRate.mockRejectedValueOnce(new Error("network down"));

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "BNR_RATE_UNAVAILABLE",
    });
    expect(mocks.captureServerException).toHaveBeenCalledWith(
      expect.any(Error),
      { route: "api/fx/bnr-eur/route.ts" },
    );
  });
});
