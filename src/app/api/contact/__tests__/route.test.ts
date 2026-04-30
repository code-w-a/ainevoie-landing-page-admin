import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  captureServerException: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendEmail: mocks.sendEmail,
}));

vi.mock("@/lib/sentryServer", () => ({
  captureServerException: mocks.captureServerException,
}));

import { POST } from "../route";

function request(body: Record<string, unknown>) {
  return new Request("https://example.com/api/contact", {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });
}

describe("POST /api/contact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    mocks.sendEmail.mockResolvedValue(undefined);
  });

  it("returns 400 when required fields are missing", async () => {
    const response = await POST(request({ email: "user@example.com" }));

    expect(response.status).toBe(400);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("returns 400 when email is invalid", async () => {
    const response = await POST(
      request({
        name: "Ana",
        email: "invalid",
        message: "Buna ziua",
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("sends the contact message to the configured recipient", async () => {
    vi.stubEnv("CONTACT_EMAIL", "support@example.com");

    const response = await POST(
      request({
        name: "Ana Pop",
        company: "Demo SRL",
        email: "Ana@Example.com",
        phone: "0712345678",
        message: "Vreau detalii.",
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "sent" });
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "support@example.com",
        replyTo: "ana@example.com",
        subject: "Mesaj contact AInevoie de la Ana Pop",
      })
    );
  });

  it("uses contact@ai-nevoie.ro by default", async () => {
    const response = await POST(
      request({
        name: "Ana Pop",
        email: "ana@example.com",
        message: "Vreau detalii.",
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "contact@ai-nevoie.ro",
      })
    );
  });

  it("localizes the internal contact email for English submissions", async () => {
    const response = await POST(
      request({
        name: "John Smith",
        email: "john@example.com",
        message: "I need details.",
        locale: "en",
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "AInevoie contact message from John Smith",
        text: expect.stringContaining("New message from the AInevoie contact form"),
      })
    );
  });

  it("returns 500 and captures the exception when sending fails", async () => {
    const error = new Error("smtp down");
    mocks.sendEmail.mockRejectedValueOnce(error);

    const response = await POST(
      request({
        name: "Ana Pop",
        email: "ana@example.com",
        message: "Vreau detalii.",
      })
    );

    expect(response.status).toBe(500);
    expect(mocks.captureServerException).toHaveBeenCalledWith(error, {
      route: "api/contact/route.ts",
    });
  });
});
