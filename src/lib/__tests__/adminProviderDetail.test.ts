import { describe, expect, it } from "vitest";
import {
  formatAdminActivityLabel,
  formatAvailabilityDayLine,
  getApprovalBlockedReasons,
  getProviderApprovalSummary,
  getSimplifiedStatusLabel,
  getVerificationIssueCount,
  humanizeApprovalReason,
  shouldShowPublicSyncBanner,
} from "../adminProviderDetail";

describe("adminProviderDetail helpers", () => {
  it("maps simplified status labels for admin UX", () => {
    expect(getSimplifiedStatusLabel("pending_review")).toBe("În așteptare");
    expect(getSimplifiedStatusLabel("approved")).toBe("Aprobat");
    expect(getSimplifiedStatusLabel("rejected")).toBe("Respins");
    expect(getSimplifiedStatusLabel("suspended")).toBe("Suspendat");
  });

  it("humanizes approval blocked reasons", () => {
    expect(humanizeApprovalReason("disponibilitate neconfigurată")).toBe(
      "Programul nu este configurat"
    );
    expect(humanizeApprovalReason("act de identitate lipsă")).toBe(
      "Documentul de identitate lipsește"
    );
  });

  it("builds approval summary when profile is complete", () => {
    const reasons = getApprovalBlockedReasons({
      profileOk: true,
      avatarPath: "users/avatar.jpg",
      identityOk: true,
      professionalOk: true,
      availabilityOk: true,
      activeServices: [
        {
          status: "active",
          name: "Curățenie",
          description: "Serviciu complet de curățenie pentru apartamente.",
          categoryKey: "cleaning",
          baseRateAmount: 80,
        },
      ],
    });

    const summary = getProviderApprovalSummary(reasons, "pending_review");
    expect(summary.canApprove).toBe(true);
    expect(summary.headline).toBe("Furnizorul poate fi aprobat");
    expect(summary.missingItems).toHaveLength(0);
  });

  it("shows approved summary when provider is already approved", () => {
    const summary = getProviderApprovalSummary([], "approved");
    expect(summary.headline).toBe("Prestator aprobat");
    expect(summary.nextAction).toBe("Profilul este activ în sistem.");
    expect(summary.missingItems).toHaveLength(0);
  });

  it("builds approval summary with human missing items", () => {
    const reasons = getApprovalBlockedReasons({
      profileOk: false,
      avatarPath: null,
      identityOk: false,
      professionalOk: false,
      availabilityOk: false,
      activeServices: [],
    });

    const summary = getProviderApprovalSummary(reasons, "pending_review");
    expect(summary.canApprove).toBe(false);
    expect(summary.headline).toBe("Furnizorul nu poate fi aprobat încă");
    expect(summary.missingItems).toContain("Profilul public nu este complet");
    expect(summary.missingItems).toContain("Programul nu este configurat");
    expect(summary.missingItems).toContain("Nu există servicii active");
  });

  it("formats availability day lines", () => {
    expect(
      formatAvailabilityDayLine({
        dayKey: "monday",
        label: "Luni",
        isEnabled: true,
        timeRanges: [{ id: "1", startTime: "08:00", endTime: "17:00" }],
      })
    ).toBe("Luni: 08:00 - 17:00");

    expect(
      formatAvailabilityDayLine({
        dayKey: "sunday",
        label: "Duminică",
        isEnabled: false,
        timeRanges: [],
      })
    ).toBe("Duminică: Indisponibil");
  });

  it("formats activity labels in human language", () => {
    expect(formatAdminActivityLabel("booking.created")).toBe("Programare creată");
    expect(formatAdminActivityLabel("booking.confirmed")).toBe("Programare confirmată");
    expect(formatAdminActivityLabel("payment.succeeded")).toBe("Plată înregistrată");
    expect(formatAdminActivityLabel("provider.review")).toBe("Decizie admin");
  });

  it("counts verification checklist issues", () => {
    expect(
      getVerificationIssueCount([
        { title: "A", detail: "", state: "complete", badge: "Complet" },
        { title: "B", detail: "", state: "missing", badge: "Lipsă" },
        { title: "C", detail: "", state: "review", badge: "Necesită verificare" },
      ])
    ).toBe(2);
  });

  it("shows public sync banner only for relevant statuses", () => {
    expect(shouldShowPublicSyncBanner("approved", true)).toBe(true);
    expect(shouldShowPublicSyncBanner("pending_review", true)).toBe(true);
    expect(shouldShowPublicSyncBanner("rejected", true)).toBe(false);
    expect(shouldShowPublicSyncBanner("approved", false)).toBe(false);
  });
});
