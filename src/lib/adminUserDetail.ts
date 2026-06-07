import { humanUserLabel } from "@/lib/adminHumanize";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";
import { formatBookingStatusLabel, tabTriggerClass } from "@/lib/adminProviderDetail";

export type BadgeVariant = "success" | "warning" | "danger" | "outline" | "secondary";

export type LegalConsentState = "accepted" | "partial" | "missing";

export type UserStateAction = "disable" | "enable";

export type ResolutionStatus = "open" | "in_progress" | "resolved";

export type UserDocument = {
  userId?: string;
  uid?: string;
  role?: string;
  accountStatus?: string | null;
  displayName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  locale?: string | null;
  authProviders?: string[];
  primaryLocation?: {
    formattedAddress?: string | null;
  } | null;
  legalConsentState?: LegalConsentState | string | null;
  termsAcceptedAt?: string | null;
  termsVersion?: string | null;
  privacyAcceptedAt?: string | null;
  privacyVersion?: string | null;
  legalConsentSource?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  lastLoginAt?: string | null;
  adminCaseSnapshot?: {
    latestNote?: string | null;
    resolutionStatus?: ResolutionStatus | string | null;
    updatedAt?: string | null;
  } | null;
};

export type BookingListItem = {
  bookingId?: string;
  status?: string | null;
  providerId?: string | null;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
  providerSnapshot?: {
    displayName?: string | null;
    businessName?: string | null;
  } | null;
  serviceSnapshot?: {
    title?: string | null;
    name?: string | null;
  } | null;
  paymentSummary?: {
    status?: string | null;
    amount?: number | null;
    currency?: string | null;
    method?: string | null;
    processor?: string | null;
    paymentId?: string | null;
    transactionId?: string | null;
    updatedAt?: string | null;
    last4?: string | null;
  } | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type AuditEventItem = {
  eventId?: string;
  action?: string | null;
  actorUid?: string | null;
  actorRole?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  result?: string | null;
  reasonCode?: string | null;
  metadata?: Record<string, unknown> | null;
  context?: Record<string, unknown> | null;
  createdAt?: string | null;
};

export type UserCase = {
  user?: UserDocument | null;
  recentBookings?: BookingListItem[];
  recentAuditEvents?: AuditEventItem[];
};

export type UserStateResult = {
  userId?: string | null;
  accountStatus?: string | null;
  reason?: string | null;
  note?: string | null;
  resolutionStatus?: ResolutionStatus | string | null;
  updatedAt?: string | null;
};

export type UserPaymentItem = {
  id: string;
  bookingId?: string | null;
  serviceName: string;
  amountLabel: string;
  status: string;
  statusLabel: string;
  statusVariant: BadgeVariant;
  methodLabel: string;
  at?: string | null;
  paymentId?: string | null;
  transactionId?: string | null;
};

export type UserTimelineEvent = {
  id: string;
  title: string;
  at?: string | null;
  description?: string | null;
  technicalAction?: string | null;
};

export type UserSummaryMetrics = {
  accountStatusLabel: string;
  accountStatusVariant: BadgeVariant;
  bookingsCount: number;
  bookingsDetail: string;
  paymentsLabel: string;
  paymentsDetail: string;
  paymentsVariant: BadgeVariant;
  consentsLabel: string;
  consentsDetail: string;
  consentsVariant: BadgeVariant;
};

const USER_ACTIVITY_LABEL_MAP: Record<string, string> = {
  "booking.created": "Programare creată",
  "booking.create": "Programare creată",
  "booking.confirmed": "Programare confirmată",
  "booking.confirm": "Programare confirmată",
  "booking.rejected": "Programare respinsă",
  "booking.reject": "Programare respinsă",
  "booking.cancelled": "Programare anulată",
  "booking.completed": "Programare finalizată",
  "payment.succeeded": "Plată confirmată",
  "payment.stripe_webhook": "Plată confirmată",
  "payment.failed": "Plată eșuată",
  "payment.synced": "Plată sincronizată",
  "user.account_state_change": "Stare cont actualizată",
  "account.delete": "Cont șters",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  paid: "Reușită",
  success: "Reușită",
  failed: "Eșuată",
  unpaid: "În așteptare",
  in_progress: "În așteptare",
  pending: "În așteptare",
  refunded: "Rambursată",
};

const PAYMENT_STATUS_VARIANTS: Record<string, BadgeVariant> = {
  paid: "success",
  success: "success",
  failed: "danger",
  unpaid: "warning",
  in_progress: "warning",
  pending: "warning",
  refunded: "secondary",
};

const RESOLUTION_STATUS_LABELS: Record<string, string> = {
  open: "Deschis",
  in_progress: "În lucru",
  resolved: "Închis",
};

const LEGAL_CONSENT_SOURCE_LABELS: Record<string, string> = {
  mobile_signup: "Înscriere mobilă",
  web_signup: "Înscriere web",
  provider_onboarding: "Înscriere prestator",
};

const AUTH_PROVIDER_LABELS: Record<string, string> = {
  password: "Email și parolă",
  "google.com": "Google",
  "apple.com": "Apple",
  phone: "Telefon",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: "Card",
  demo: "Demo",
  manual_mvp: "Manual",
  unknown: "Necunoscut",
};

export function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function formatValue(value: unknown, fallback = "Nu este completat") {
  const normalized = readString(value);
  return normalized || fallback;
}

export function formatCompactValue(value: unknown, fallback = "-") {
  const normalized = readString(value);
  return normalized || fallback;
}

export function getUserFromCase(data?: UserCase | null) {
  return data?.user || null;
}

export function getUserId(user: UserDocument | null | undefined, fallback = "") {
  return readString(user?.userId) || readString(user?.uid) || fallback;
}

export function getUserDisplayName(user: UserDocument | null | undefined) {
  if (!user) return "Utilizator necunoscut";
  return humanUserLabel({
    displayName: user.displayName,
    email: user.email,
    phoneNumber: user.phoneNumber,
  });
}

export function getAccountStatus(user: UserDocument | null | undefined) {
  const status = readString(user?.accountStatus);
  return status === "disabled" ? "disabled" : "active";
}

export function getAccountStatusLabel(status?: string | null) {
  return readString(status) === "disabled" ? "Dezactivat" : "Activ";
}

export function getAccountStatusVariant(status?: string | null): BadgeVariant {
  return readString(status) === "disabled" ? "danger" : "success";
}

export function getLegalConsentLabel(state?: string | null) {
  if (state === "accepted") return "Acceptate";
  if (state === "partial") return "Parțiale";
  return "Lipsă";
}

export function getLegalConsentVariant(state?: string | null): BadgeVariant {
  if (state === "accepted") return "success";
  if (state === "partial") return "warning";
  return "outline";
}

export function formatPaymentStatusLabel(status: unknown) {
  const normalized = readString(status).toLowerCase();
  return PAYMENT_STATUS_LABELS[normalized] || formatCompactValue(status);
}

export function getPaymentStatusVariant(status: unknown): BadgeVariant {
  const normalized = readString(status).toLowerCase();
  return PAYMENT_STATUS_VARIANTS[normalized] || "outline";
}

export function formatUserBookingStatusLabel(status: unknown) {
  const normalized = readString(status).toLowerCase();
  if (normalized === "requested" || normalized === "pending") {
    return "În așteptare";
  }
  if (normalized.startsWith("cancelled")) {
    return "Anulată";
  }
  return formatBookingStatusLabel(status);
}

export function formatUserActivityLabel(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return "Activitate utilizator";
  }
  const cleaned = value.trim();
  if (USER_ACTIVITY_LABEL_MAP[cleaned]) {
    return USER_ACTIVITY_LABEL_MAP[cleaned];
  }
  if (cleaned.startsWith("payment.") || cleaned.includes("stripe") || cleaned.includes("webhook")) {
    return "Plată confirmată";
  }
  if (cleaned.startsWith("booking.")) {
    const suffix = cleaned.replace("booking.", "");
    return USER_ACTIVITY_LABEL_MAP[`booking.${suffix}`] || "Programare actualizată";
  }
  if (cleaned.startsWith("user.")) {
    return USER_ACTIVITY_LABEL_MAP[cleaned] || "Activitate cont";
  }
  return cleaned.replace(/_/g, " ").replace(/\./g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatResolutionStatusLabel(status: unknown) {
  const normalized = readString(status).toLowerCase();
  return RESOLUTION_STATUS_LABELS[normalized] || formatCompactValue(status);
}

export function formatLegalConsentSource(value: unknown) {
  const normalized = readString(value).toLowerCase();
  return LEGAL_CONSENT_SOURCE_LABELS[normalized] || formatValue(value);
}

export function formatAuthProvider(value: unknown) {
  const normalized = readString(value).toLowerCase();
  return AUTH_PROVIDER_LABELS[normalized] || formatCompactValue(value);
}

export function formatPaymentMethod(value: unknown) {
  const normalized = readString(value).toLowerCase();
  return PAYMENT_METHOD_LABELS[normalized] || formatCompactValue(value);
}

export function formatCurrency(amount: unknown, currency?: string | null) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "-";
  }
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: readString(currency) || "RON",
  }).format(numeric);
}

export function getAvailableUserActions(accountStatus: string): UserStateAction[] {
  return accountStatus === "disabled" ? ["enable"] : ["disable"];
}

export function getLatestActivityAt(
  user: UserDocument | null | undefined,
  recentBookings: BookingListItem[],
  recentAuditEvents: AuditEventItem[]
) {
  const candidates = [
    user?.lastLoginAt,
    user?.updatedAt,
    ...recentBookings.map((booking) => booking.updatedAt || booking.scheduledStartAt),
    ...recentAuditEvents.map((event) => event.createdAt),
  ].filter((value) => readString(value));

  if (candidates.length === 0) {
    return user?.createdAt || null;
  }

  return candidates.sort((left, right) => {
    const leftTime = Date.parse(String(left));
    const rightTime = Date.parse(String(right));
    return rightTime - leftTime;
  })[0];
}

export function countSuccessfulPayments(bookings: BookingListItem[]) {
  return bookings.filter((booking) => {
    const status = readString(booking.paymentSummary?.status).toLowerCase();
    return status === "paid" || status === "success";
  }).length;
}

export function getUserSummaryMetrics(
  user: UserDocument,
  recentBookings: BookingListItem[]
): UserSummaryMetrics {
  const accountStatus = getAccountStatus(user);
  const successfulPayments = countSuccessfulPayments(recentBookings);
  const consentState = readString(user.legalConsentState);

  return {
    accountStatusLabel: getAccountStatusLabel(accountStatus),
    accountStatusVariant: getAccountStatusVariant(accountStatus),
    bookingsCount: recentBookings.length,
    bookingsDetail: recentBookings.length === 1 ? "Programare recentă" : "Programări recente",
    paymentsLabel:
      successfulPayments > 0
        ? `${successfulPayments} ${successfulPayments === 1 ? "reușită" : "reușite"}`
        : "0",
    paymentsDetail:
      successfulPayments > 0 ? "Plăți confirmate" : "Fără plăți confirmate",
    paymentsVariant: successfulPayments > 0 ? "success" : "outline",
    consentsLabel: getLegalConsentLabel(consentState),
    consentsDetail:
      consentState === "accepted"
        ? "Termeni și politică acceptate"
        : consentState === "partial"
          ? "Consimțământ parțial"
          : "Consimțământ lipsă",
    consentsVariant: getLegalConsentVariant(consentState),
  };
}

export function extractPaymentsFromBookings(bookings: BookingListItem[]): UserPaymentItem[] {
  return bookings
    .filter((booking) => booking.paymentSummary)
    .map((booking, index) => {
      const payment = booking.paymentSummary || {};
      const status = readString(payment.status).toLowerCase() || "pending";
      const serviceName =
        readString(booking.serviceSnapshot?.title) ||
        readString(booking.serviceSnapshot?.name) ||
        "Programare";

      return {
        id: readString(payment.paymentId) || readString(booking.bookingId) || `payment-${index}`,
        bookingId: booking.bookingId || null,
        serviceName,
        amountLabel: formatCurrency(payment.amount, payment.currency),
        status,
        statusLabel: formatPaymentStatusLabel(status),
        statusVariant: getPaymentStatusVariant(status),
        methodLabel: formatPaymentMethod(payment.method || payment.processor),
        at: payment.updatedAt || booking.updatedAt || booking.scheduledStartAt || null,
        paymentId: payment.paymentId || null,
        transactionId: payment.transactionId || null,
      };
    });
}

function hasDate(value: unknown) {
  return typeof value === "string" && value.trim() && formatAdminDateTime(value) !== "-";
}

export function buildUserTimelineEvents(
  user: UserDocument,
  recentAuditEvents: AuditEventItem[]
): UserTimelineEvent[] {
  const events: UserTimelineEvent[] = [];

  if (hasDate(user.createdAt)) {
    events.push({
      id: "user-created",
      title: "Cont creat",
      at: user.createdAt,
      description: "Utilizatorul și-a creat contul în aplicație.",
    });
  }

  if (hasDate(user.lastLoginAt)) {
    events.push({
      id: "user-last-login",
      title: "Ultima autentificare",
      at: user.lastLoginAt,
      description: "Ultima dată când utilizatorul s-a autentificat.",
    });
  }

  recentAuditEvents.forEach((event, index) => {
    const action = readString(event.action);
    events.push({
      id: event.eventId || `audit-${index}`,
      title: formatUserActivityLabel(action),
      at: event.createdAt,
      description: event.result ? `Rezultat: ${formatCompactValue(event.result)}` : null,
      technicalAction: action || null,
    });
  });

  return events.sort((left, right) => {
    const leftTime = Date.parse(String(left.at || ""));
    const rightTime = Date.parse(String(right.at || ""));
    return rightTime - leftTime;
  });
}

export function readUserStateResult(payload: unknown): UserStateResult | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const result = payload as Record<string, unknown>;
  const accountStatus =
    typeof result.accountStatus === "string" && result.accountStatus.trim()
      ? result.accountStatus.trim()
      : null;
  if (!accountStatus) {
    return null;
  }
  return {
    userId: readString(result.userId) || null,
    accountStatus,
    reason: readString(result.reason) || null,
    note: readString(result.note) || null,
    resolutionStatus: readString(result.resolutionStatus) || null,
    updatedAt: readString(result.updatedAt) || null,
  };
}

export function mergeUserStateResult(
  user: UserDocument,
  result: UserStateResult
): UserDocument {
  return {
    ...user,
    accountStatus: result.accountStatus || user.accountStatus,
    updatedAt: result.updatedAt || user.updatedAt,
    adminCaseSnapshot: {
      ...(user.adminCaseSnapshot || {}),
      latestNote: result.note || result.reason || user.adminCaseSnapshot?.latestNote || null,
      resolutionStatus:
        result.resolutionStatus || user.adminCaseSnapshot?.resolutionStatus || "open",
      updatedAt: result.updatedAt || user.adminCaseSnapshot?.updatedAt || null,
    },
  };
}

export function mergeUserCaseStateResult(data: UserCase, result: UserStateResult): UserCase {
  if (!data.user) {
    return data;
  }
  return {
    ...data,
    user: mergeUserStateResult(data.user, result),
  };
}

export { formatBookingStatusLabel, tabTriggerClass };
