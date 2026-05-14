import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMailMock = vi.hoisted(() => vi.fn());
const createTransportMock = vi.hoisted(() => vi.fn(() => ({ sendMail: sendMailMock })));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: createTransportMock,
  },
}));

function applyRequiredEmailEnv() {
  process.env.EMAIL_SERVER_HOST = "smtp.test.local";
  process.env.EMAIL_SERVER_PORT = "587";
  process.env.EMAIL_SERVER_SECURE = "false";
  process.env.EMAIL_SERVER_USER = "mailer-user";
  process.env.EMAIL_SERVER_PASSWORD = "mailer-pass";
  process.env.EMAIL_FROM = "AInevoie <no-reply@ai-nevoie.com>";
}

describe("sendEmail observability logs", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    applyRequiredEmailEnv();
  });

  it("logs start and success metadata with masked recipient and SMTP context", async () => {
    sendMailMock.mockResolvedValueOnce({
      messageId: "msg-1",
      accepted: ["provider@example.com"],
      rejected: [],
    });
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);

    const { sendEmail } = await import("../email");
    await sendEmail(
      {
        to: "provider@example.com",
        subject: "Welcome",
        html: "<p>hello</p>",
      },
      {
        channel: "provider_onboarding_welcome",
        templateKind: "providerWelcome",
        requestId: "req-1",
      }
    );

    const startCall = infoSpy.mock.calls.find(([event]) =>
      String(event).includes("email_send_start")
    );
    const successCall = infoSpy.mock.calls.find(([event]) =>
      String(event).includes("email_send_success")
    );

    expect(startCall).toBeTruthy();
    expect(successCall).toBeTruthy();

    const startPayload = startCall?.[1] as Record<string, unknown>;
    const successPayload = successCall?.[1] as Record<string, unknown>;

    expect(startPayload).toMatchObject({
      channel: "provider_onboarding_welcome",
      templateKind: "providerWelcome",
      requestId: "req-1",
      smtpHost: "smtp.test.local",
      smtpPort: 587,
      secure: false,
    });
    expect(startPayload.recipientMasked).toBe("pr***@example.com");
    expect(typeof startPayload.recipientHash).toBe("string");
    expect(String(startPayload.recipientHash)).toHaveLength(64);

    expect(successPayload).toMatchObject({
      channel: "provider_onboarding_welcome",
      templateKind: "providerWelcome",
      requestId: "req-1",
      messageId: "msg-1",
      acceptedCount: 1,
      rejectedCount: 0,
    });
    expect(typeof successPayload.durationMs).toBe("number");
  });

  it("logs failure metadata and rethrows SMTP errors", async () => {
    const smtpError = Object.assign(new Error("smtp down"), {
      code: "EAUTH",
      responseCode: 535,
    });
    sendMailMock.mockRejectedValueOnce(smtpError);

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { sendEmail } = await import("../email");

    await expect(
      sendEmail(
        {
          to: "provider@example.com",
          subject: "Approval",
          html: "<p>ok</p>",
        },
        {
          channel: "provider_approved",
          templateKind: "providerApproved",
          requestId: "req-failure",
        }
      )
    ).rejects.toThrow("smtp down");

    const failureCall = errorSpy.mock.calls.find(([event]) =>
      String(event).includes("email_send_failure")
    );

    expect(failureCall).toBeTruthy();
    const failurePayload = failureCall?.[1] as Record<string, unknown>;
    expect(failurePayload).toMatchObject({
      channel: "provider_approved",
      templateKind: "providerApproved",
      requestId: "req-failure",
      errorCode: "EAUTH",
      responseCode: 535,
      errorMessage: "smtp down",
      smtpHost: "smtp.test.local",
    });
    expect(typeof failurePayload.durationMs).toBe("number");
  });
});
