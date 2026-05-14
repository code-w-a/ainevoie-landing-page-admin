import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  captureServerException: vi.fn(),
  getAdminAuth: vi.fn(),
  getAdminDb: vi.fn(),
  getEmailTemplateConfig: vi.fn(),
  renderTemplate: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/firebaseAdmin", () => ({
  getAdminAuth: mocks.getAdminAuth,
  getAdminDb: mocks.getAdminDb,
}));

vi.mock("@/lib/email", () => ({
  sendEmail: mocks.sendEmail,
}));

vi.mock("@/lib/emailTemplates/adminEmailTemplates", () => ({
  renderTemplate: mocks.renderTemplate,
}));

vi.mock("@/lib/emailTemplates/adminEmailTemplatesServer", () => ({
  getEmailTemplateConfig: mocks.getEmailTemplateConfig,
}));

vi.mock("@/lib/sentryServer", () => ({
  captureServerException: mocks.captureServerException,
}));

import { POST } from "../route";

function request({
  locale = "ro",
  token,
}: {
  locale?: "ro" | "en";
  token?: string | null;
} = {}) {
  const headers = new Headers({
    "x-next-intl-locale": locale,
  });

  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  return new Request("https://example.com/api/providers/onboarding/welcome-email", {
    method: "POST",
    headers,
  });
}

function setupProviderDb({
  exists = true,
  data = {},
}: {
  exists?: boolean;
  data?: Record<string, unknown>;
} = {}) {
  const set = vi.fn().mockResolvedValue(undefined);
  const get = vi.fn().mockResolvedValue({
    exists,
    data: () => data,
  });
  const doc = vi.fn(() => ({ get, set }));
  const collection = vi.fn(() => ({ doc }));
  const db = { collection };

  mocks.getAdminDb.mockReturnValue(db);
  return { set, get, doc, collection };
}

describe("POST /api/providers/onboarding/welcome-email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getEmailTemplateConfig.mockResolvedValue({ providerWelcome: {} });
    mocks.renderTemplate.mockReturnValue({
      subject: "Subject",
      html: "<p>Hello</p>",
      text: "Hello",
    });
    mocks.sendEmail.mockResolvedValue(undefined);
  });

  it("returns 401 when bearer token is missing", async () => {
    const response = await POST(request({ token: null }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(mocks.getAdminAuth).not.toHaveBeenCalled();
  });

  it("returns 401 when bearer token is invalid", async () => {
    mocks.getAdminAuth.mockReturnValue({
      verifyIdToken: vi.fn().mockRejectedValue(new Error("bad token")),
    });

    const response = await POST(request({ token: "bad-token" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("returns 404 when provider profile does not exist", async () => {
    setupProviderDb({ exists: false });
    mocks.getAdminAuth.mockReturnValue({
      verifyIdToken: vi.fn().mockResolvedValue({ uid: "provider-uid" }),
    });

    const response = await POST(request({ token: "valid-token" }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      code: "PROVIDER_NOT_FOUND",
    });
  });

  it("returns 200 alreadySent=true and skips sending when email was already sent", async () => {
    setupProviderDb({
      exists: true,
      data: {
        email: "provider@example.com",
        welcomeEmailSent: true,
      },
    });
    mocks.getAdminAuth.mockReturnValue({
      verifyIdToken: vi.fn().mockResolvedValue({ uid: "provider-uid" }),
    });

    const response = await POST(request({ token: "valid-token" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sent: true,
      alreadySent: true,
    });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("returns 200 sent=true alreadySent=false after successful send and persists success flags", async () => {
    const db = setupProviderDb({
      exists: true,
      data: {
        email: "provider@example.com",
        fullName: "Provider One",
        locale: "ro",
        welcomeEmailSent: false,
      },
    });
    const verifyIdToken = vi.fn().mockResolvedValue({ uid: "provider-uid" });
    const generateEmailVerificationLink = vi
      .fn()
      .mockResolvedValue("https://example.com/verify");
    mocks.getAdminAuth.mockReturnValue({
      verifyIdToken,
      generateEmailVerificationLink,
    });

    const response = await POST(request({ token: "valid-token", locale: "ro" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sent: true,
      alreadySent: false,
    });
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1);
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "provider@example.com",
        subject: "Subject",
      }),
      expect.objectContaining({
        channel: "provider_onboarding_welcome",
        templateKind: "providerWelcome",
        requestId: expect.any(String),
      }),
    );
    expect(db.set).toHaveBeenCalledWith(
      expect.objectContaining({
        welcomeEmailSent: true,
        welcomeEmailError: null,
        welcomeEmailSentAt: expect.anything(),
        welcomeEmailLastAttemptAt: expect.anything(),
        welcomeEmailLastOutcome: "success",
        welcomeEmailLastErrorCode: null,
        welcomeEmailLastErrorMessage: null,
      }),
      { merge: true },
    );
    expect(verifyIdToken).toHaveBeenCalledWith("valid-token");
  });

  it("returns 500 when sending fails and persists welcomeEmailError", async () => {
    const db = setupProviderDb({
      exists: true,
      data: {
        email: "provider@example.com",
        fullName: "Provider One",
        locale: "ro",
        welcomeEmailSent: false,
      },
    });
    mocks.sendEmail.mockRejectedValueOnce(new Error("smtp down"));
    mocks.getAdminAuth.mockReturnValue({
      verifyIdToken: vi.fn().mockResolvedValue({ uid: "provider-uid" }),
      generateEmailVerificationLink: vi
        .fn()
        .mockResolvedValue("https://example.com/verify"),
    });

    const response = await POST(request({ token: "valid-token", locale: "ro" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      code: "WELCOME_EMAIL_FAILED",
    });
    expect(db.set).toHaveBeenCalledWith(
      expect.objectContaining({
        welcomeEmailSent: false,
        welcomeEmailError: "smtp down",
        welcomeEmailLastAttemptAt: expect.anything(),
        welcomeEmailLastOutcome: "failed",
        welcomeEmailLastErrorCode: "UNKNOWN",
        welcomeEmailLastErrorMessage: "smtp down",
      }),
      { merge: true },
    );
    expect(mocks.captureServerException).toHaveBeenCalledTimes(1);
  });

  it("renders the welcome template in English when provider locale is en and falls back to Romanian otherwise", async () => {
    setupProviderDb({
      exists: true,
      data: {
        email: "provider@example.com",
        fullName: "Provider One",
        locale: "en",
        welcomeEmailSent: false,
      },
    });
    mocks.getAdminAuth.mockReturnValue({
      verifyIdToken: vi.fn().mockResolvedValue({ uid: "provider-uid" }),
      generateEmailVerificationLink: vi
        .fn()
        .mockResolvedValue("https://example.com/verify"),
    });

    await POST(request({ token: "token-en", locale: "en" }));
    expect(mocks.renderTemplate).toHaveBeenLastCalledWith(
      expect.objectContaining({ locale: "en" }),
    );

    setupProviderDb({
      exists: true,
      data: {
        email: "provider2@example.com",
        fullName: "Provider Two",
        locale: "fr",
        welcomeEmailSent: false,
      },
    });

    await POST(request({ token: "token-ro-fallback", locale: "en" }));
    expect(mocks.renderTemplate).toHaveBeenLastCalledWith(
      expect.objectContaining({ locale: "ro" }),
    );
  });
});
