import { humanProviderLabel, humanUserLabel } from "@/lib/adminHumanize";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";
import {
  formatBookingStatusLabel as formatProviderBookingStatusLabel,
  tabTriggerClass,
} from "@/lib/adminProviderDetail";
import {
  formatPaymentStatusLabel,
  getPaymentStatusVariant,
  readString,
} from "@/lib/adminUserDetail";

export type BadgeVariant = "success" | "warning" | "danger" | "outline" | "secondary";

export type ResolutionStatus = "open" | "in_progress" | "resolved";

export type BookingServiceLocation = {
  formattedAddress?: string | null;
  streetNumber?: string | null;
  building?: string | null;
  apartment?: string | null;
  floor?: string | null;
  entrance?: string | null;
  intercom?: string | null;
  accessDetails?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type BookingAddOn = {
  addOnId?: string | null;
  key?: string | null;
  name?: string | null;
  price?: number | null;
  currency?: string | null;
};

export type BookingDocument = Record<string, unknown> & {
  bookingId?: string;
  requestNumber?: number | null;
  bookingType?: string | null;
  subscriptionId?: string | null;
  subscriptionFrequency?: string | null;
  status?: string | null;
  userId?: string | null;
  providerId?: string | null;
  serviceId?: string | null;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
  timezone?: string | null;
  serviceLocation?: BookingServiceLocation | null;
  addOns?: BookingAddOn[] | null;
  requestDetails?: {
    description?: string | null;
    estimatedHours?: number | null;
    professionalsCount?: number | null;
  } | null;
  pricingSnapshot?: {
    amount?: number | null;
    currency?: string | null;
    estimatedHours?: number | null;
    ratePerHourPerProfessional?: number | null;
    baseAmount?: number | null;
    addOnsTotal?: number | null;
  } | null;
  paymentSummary?: Record<string, unknown> | null;
  userSnapshot?: {
    displayName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  } | null;
  providerSnapshot?: {
    displayName?: string | null;
    businessName?: string | null;
    email?: string | null;
  } | null;
  serviceSnapshot?: {
    name?: string | null;
    title?: string | null;
    baseRateAmount?: number | null;
  } | null;
  requestResponse?: {
    status?: string | null;
    profile?: string | null;
    deadlineAt?: string | null;
    answeredAt?: string | null;
    expiredAt?: string | null;
  } | null;
  adminCaseSnapshot?: {
    latestNote?: string | null;
    resolutionStatus?: ResolutionStatus | string | null;
    linkedTicketIds?: string[] | null;
    updatedAt?: string | null;
  } | null;
};

export type PaymentDocument = Record<string, unknown> & {
  paymentId?: string | null;
  id?: string | null;
  status?: string | null;
  amount?: number | null;
  currency?: string | null;
  processor?: string | null;
  method?: string | null;
  transactionId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeLatestChargeId?: string | null;
  stripeStatus?: string | null;
};

export type AuditEventItem = Record<string, unknown> & {
  eventId?: string;
  action?: string | null;
  actorUid?: string | null;
  actorRole?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  result?: string | null;
  statusFrom?: string | null;
  statusTo?: string | null;
  createdAt?: string | null;
  metadata?: Record<string, unknown> | null;
  context?: Record<string, unknown> | null;
};

export type BookingCase = {
  booking?: BookingDocument | null;
  payment?: PaymentDocument | null;
  review?: Record<string, unknown> | null;
  provider?: Record<string, unknown> | null;
  user?: Record<string, unknown> | null;
  conversation?: Record<string, unknown> | null;
  supportTickets?: Array<Record<string, unknown>>;
  recentAuditEvents?: AuditEventItem[];
};

export type BookingCaseResult = {
  bookingId?: string | null;
  status?: string | null;
  reason?: string | null;
  note?: string | null;
  resolutionStatus?: ResolutionStatus | string | null;
  linkedTicketIds?: string[] | null;
  updatedAt?: string | null;
};

export type BookingTimelineEvent = {
  id: string;
  title: string;
  at?: string | null;
  description?: string | null;
  technicalAction?: string | null;
};

export type BookingSummaryMetrics = {
  bookingStatusLabel: string;
  bookingStatusVariant: BadgeVariant;
  bookingDetail: string;
  paymentLabel: string;
  paymentDetail: string;
  paymentVariant: BadgeVariant;
  conversationLabel: string;
  conversationDetail: string;
  conversationVariant: BadgeVariant;
  supportLabel: string;
  supportDetail: string;
  supportVariant: BadgeVariant;
  providerResponseLabel: string;
  providerResponseDetail: string;
  providerResponseVariant: BadgeVariant;
};

const BOOKING_ACTIVITY_LABEL_MAP: Record<string, string> = {
  "booking.created": "Programare creată",
  "booking.create": "Programare creată",
  "booking.confirmed": "Programare confirmată",
  "booking.confirm": "Programare confirmată",
  "booking.rejected": "Programare respinsă",
  "booking.reject": "Programare respinsă",
  "booking.cancelled": "Programare anulată",
  "booking.cancel_by_admin": "Programare anulată de admin",
  "booking.completed": "Programare finalizată",
  "payment.succeeded": "Plată confirmată",
  "payment.stripe_webhook": "Plată confirmată",
  "payment.failed": "Plată eșuată",
};

const REQUEST_RESPONSE_LABELS: Record<string, string> = {
  answered: "Răspuns primit",
  pending: "În așteptare",
  expired: "Expirat",
};

const RESOLUTION_STATUS_LABELS: Record<string, string> = {
  open: "Deschis",
  in_progress: "În lucru",
  resolved: "Închis",
};

const CONVERSATION_STATUS_LABELS: Record<string, string> = {
  active: "Activă",
  archived: "Arhivată",
  closed: "Închisă",
};

const SUPPORT_STATUS_LABELS: Record<string, string> = {
  open: "Deschis",
  in_progress: "În lucru",
  resolved: "Rezolvat",
  closed: "Închis",
};

const SUPPORT_PRIORITY_LABELS: Record<string, string> = {
  low: "Scăzută",
  normal: "Normală",
  high: "Ridicată",
  urgent: "Urgentă",
};

export function formatValue(value: unknown, fallback = "Nu este completat") {
  const normalized = readString(value);
  return normalized || fallback;
}

export function formatCompactValue(value: unknown, fallback = "-") {
  const normalized = readString(value);
  return normalized || fallback;
}

export function getBookingFromCase(data?: BookingCase | null) {
  return data?.booking || null;
}

export function getBookingId(booking: BookingDocument | null | undefined, fallback = "") {
  return readString(booking?.bookingId) || fallback;
}

export function getPaymentFromCase(
  data?: BookingCase | null,
  booking?: BookingDocument | null
): PaymentDocument | null {
  const payment = data?.payment;
  if (payment && typeof payment === "object") {
    return payment;
  }
  const summary = booking?.paymentSummary;
  if (summary && typeof summary === "object") {
    return summary as PaymentDocument;
  }
  return null;
}

export function getUserDisplayName(
  booking: BookingDocument | null | undefined,
  user?: Record<string, unknown> | null
) {
  const userSnapshot = booking?.userSnapshot || {};
  return humanUserLabel({
    displayName: readString(userSnapshot.displayName) || readString(user?.displayName),
    email: readString(userSnapshot.email) || readString(user?.email),
    phoneNumber: readString(userSnapshot.phoneNumber) || readString(user?.phoneNumber),
  });
}

export function getProviderDisplayName(
  booking: BookingDocument | null | undefined,
  provider?: Record<string, unknown> | null
) {
  const providerSnapshot = booking?.providerSnapshot || {};
  const professionalProfile =
    provider && typeof provider.professionalProfile === "object"
      ? (provider.professionalProfile as Record<string, unknown>)
      : {};
  return humanProviderLabel({
    displayName:
      readString(providerSnapshot.displayName) || readString(professionalProfile.displayName),
    businessName: readString(professionalProfile.businessName),
    email: readString(providerSnapshot.email) || readString(provider?.email),
    phoneNumber: readString(provider?.phoneNumber),
  });
}

export function formatRequestNumber(booking?: BookingDocument | null) {
  const value = Number(booking?.requestNumber);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return `#${value}`;
}

const SUBSCRIPTION_FREQUENCY_LABELS: Record<string, string> = {
  weekly: "Săptămânal",
  biweekly: "La 2 săptămâni",
  monthly: "Lunar",
};

export function formatBookingTypeLabel(booking?: BookingDocument | null) {
  const type = readString(booking?.bookingType).toLowerCase();
  if (type === "subscription") {
    const frequency = readString(booking?.subscriptionFrequency).toLowerCase();
    const frequencyLabel = SUBSCRIPTION_FREQUENCY_LABELS[frequency];
    return frequencyLabel ? `Abonament · ${frequencyLabel}` : "Abonament";
  }
  return "Programare unică";
}

export function formatSubscriptionFrequencyLabel(frequency: unknown) {
  const normalized = readString(frequency).toLowerCase();
  return SUBSCRIPTION_FREQUENCY_LABELS[normalized] || formatCompactValue(frequency);
}

export function getServiceLocation(booking?: BookingDocument | null): BookingServiceLocation {
  const location = booking?.serviceLocation;
  if (location && typeof location === "object") {
    return location;
  }
  const fallbackAddress = readString(
    (booking?.userSnapshot as Record<string, unknown> | undefined)?.primaryLocation &&
      typeof (booking?.userSnapshot as Record<string, unknown>)?.primaryLocation === "object"
      ? ((booking?.userSnapshot as Record<string, unknown>).primaryLocation as Record<string, unknown>).formattedAddress
      : undefined
  );
  return { formattedAddress: fallbackAddress || null };
}

export function formatServiceAddress(booking?: BookingDocument | null) {
  const location = getServiceLocation(booking);
  const parts = [readString(location.formattedAddress)];
  const streetNumber = readString(location.streetNumber);
  const building = readString(location.building);
  if (streetNumber) parts.push(`Nr. ${streetNumber}`);
  if (building) parts.push(`Bloc ${building}`);
  return parts.filter(Boolean).join(" · ") || "Nu este completat";
}

export function formatAccessDetails(booking?: BookingDocument | null) {
  const location = getServiceLocation(booking);
  const parts: string[] = [];
  const apartment = readString(location.apartment);
  const floor = readString(location.floor);
  const entrance = readString(location.entrance);
  const intercom = readString(location.intercom);
  const accessDetails = readString(location.accessDetails);
  if (apartment) parts.push(`Ap. ${apartment}`);
  if (floor) parts.push(`Et. ${floor}`);
  if (entrance) parts.push(`Scara ${entrance}`);
  if (intercom) parts.push(`Interfon ${intercom}`);
  if (accessDetails) parts.push(accessDetails);
  return parts.length ? parts.join(" · ") : "Fără detalii de acces";
}

export function getBookingAddOns(booking?: BookingDocument | null): BookingAddOn[] {
  return Array.isArray(booking?.addOns) ? (booking?.addOns as BookingAddOn[]) : [];
}

export function formatAddOnPrice(addOn: BookingAddOn) {
  const amount = Number(addOn?.price);
  const currency = readString(addOn?.currency) || "RON";
  if (!Number.isFinite(amount) || amount < 0) {
    return "-";
  }
  return new Intl.NumberFormat("ro-RO", { style: "currency", currency }).format(amount);
}

export function getServiceName(booking?: BookingDocument | null) {
  return (
    readString(booking?.serviceSnapshot?.title) ||
    readString(booking?.serviceSnapshot?.name) ||
    "Programare"
  );
}

export function formatBookingStatusLabel(status: unknown) {
  const normalized = readString(status).toLowerCase();
  if (normalized === "requested" || normalized === "pending") {
    return "În așteptare";
  }
  if (normalized.startsWith("cancelled")) {
    return "Anulată";
  }
  return formatProviderBookingStatusLabel(status);
}

export function getBookingStatusVariant(status: unknown): BadgeVariant {
  const normalized = readString(status).toLowerCase();
  if (normalized === "paid" || normalized === "completed" || normalized === "confirmed") {
    return "success";
  }
  if (
    normalized === "failed" ||
    normalized === "rejected" ||
    normalized === "expired_unanswered" ||
    normalized.startsWith("cancelled")
  ) {
    return "danger";
  }
  if (normalized === "requested" || normalized === "reschedule_proposed" || normalized === "in_progress" || normalized === "pending") {
    return "warning";
  }
  return "outline";
}

export function formatBookingPaymentStatusLabel(status: unknown) {
  const normalized = readString(status).toLowerCase();
  if (normalized === "paid") {
    return "Plătită";
  }
  return formatPaymentStatusLabel(status);
}

export function formatRequestResponseStatus(status: unknown) {
  const normalized = readString(status).toLowerCase();
  return REQUEST_RESPONSE_LABELS[normalized] || formatCompactValue(status);
}

export function formatConversationStatus(status: unknown) {
  const normalized = readString(status).toLowerCase();
  return CONVERSATION_STATUS_LABELS[normalized] || formatCompactValue(status);
}

export function formatSupportStatus(status: unknown) {
  const normalized = readString(status).toLowerCase();
  return SUPPORT_STATUS_LABELS[normalized] || formatCompactValue(status);
}

export function formatSupportPriority(priority: unknown) {
  const normalized = readString(priority).toLowerCase();
  return SUPPORT_PRIORITY_LABELS[normalized] || formatCompactValue(priority);
}

export function formatResolutionStatusLabel(status: unknown) {
  const normalized = readString(status).toLowerCase();
  return RESOLUTION_STATUS_LABELS[normalized] || formatCompactValue(status);
}

export function formatBookingActivityLabel(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return "Activitate programare";
  }
  const cleaned = value.trim();
  if (BOOKING_ACTIVITY_LABEL_MAP[cleaned]) {
    return BOOKING_ACTIVITY_LABEL_MAP[cleaned];
  }
  if (cleaned.startsWith("payment.") || cleaned.includes("stripe") || cleaned.includes("webhook")) {
    return "Plată confirmată";
  }
  if (cleaned.startsWith("booking.")) {
    const suffix = cleaned.replace("booking.", "");
    return BOOKING_ACTIVITY_LABEL_MAP[`booking.${suffix}`] || "Programare actualizată";
  }
  return cleaned.replace(/_/g, " ").replace(/\./g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function parseMillis(value: unknown) {
  if (!value) return 0;
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatBookingAmount(payment?: PaymentDocument | null) {
  const amount = Number(payment?.amount);
  const currency = readString(payment?.currency) || "RON";
  if (!Number.isFinite(amount) || amount <= 0) {
    return "-";
  }
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatPricingContext(booking?: BookingDocument | null) {
  const pricing = booking?.pricingSnapshot || {};
  const requestDetails = booking?.requestDetails || {};
  const rate = Number(
    pricing.ratePerHourPerProfessional ?? booking?.serviceSnapshot?.baseRateAmount ?? 0
  );
  const hours = Math.max(
    1,
    Number(requestDetails.estimatedHours ?? pricing.estimatedHours ?? 1) || 1
  );

  if (!Number.isFinite(rate) || rate <= 0) {
    return `${hours}h`;
  }

  return `${hours}h × ${rate} RON`;
}

export function getOperationalBookingState(
  booking?: BookingDocument | null,
  payment?: PaymentDocument | null
) {
  const bookingStatus = readString(booking?.status).toLowerCase();
  const paymentStatus = readString(payment?.status || booking?.paymentSummary?.status).toLowerCase();
  if (bookingStatus === "confirmed" && (paymentStatus === "unpaid" || paymentStatus === "failed")) {
    return "Confirmată, în așteptarea plății";
  }
  return formatBookingStatusLabel(booking?.status);
}

export function formatSlaSummary(requestResponse?: BookingDocument["requestResponse"] | null) {
  if (!requestResponse?.deadlineAt) {
    return { label: "Fără termen", detail: "Nu există deadline configurat", variant: "outline" as const };
  }

  if (readString(requestResponse.status).toLowerCase() === "answered") {
    return { label: "Răspuns primit", detail: "Prestatorul a răspuns la cerere", variant: "success" as const };
  }

  const deadlineMs = parseMillis(requestResponse.deadlineAt);
  if (!deadlineMs) {
    return { label: "Termen invalid", detail: "Deadline indisponibil", variant: "outline" as const };
  }

  const diffMinutes = Math.round((deadlineMs - Date.now()) / 60_000);
  if (diffMinutes < 0) {
    return {
      label: "Întârziat",
      detail: `Întârziat cu ${Math.abs(diffMinutes)} min`,
      variant: "danger" as const,
    };
  }

  return {
    label: "În așteptare",
    detail: `${diffMinutes} min rămase`,
    variant: "warning" as const,
  };
}

export function getConversationId(bookingId: string, conversation?: Record<string, unknown> | null) {
  return readString(conversation?.conversationId) || `conv_bk_${bookingId}`;
}

export function getPaymentLookupId(
  payment?: PaymentDocument | null,
  bookingId?: string
) {
  return (
    readString(payment?.paymentId) ||
    readString(payment?.transactionId) ||
    readString(payment?.stripePaymentIntentId) ||
    bookingId ||
    ""
  );
}

export function getBookingSummaryMetrics(
  booking: BookingDocument,
  payment: PaymentDocument | null,
  conversation: Record<string, unknown> | null | undefined,
  supportTickets: Array<Record<string, unknown>>,
  requestResponse?: BookingDocument["requestResponse"] | null
): BookingSummaryMetrics {
  const operationalState = getOperationalBookingState(booking, payment);
  const paymentStatus = readString(payment?.status);
  const sla = formatSlaSummary(requestResponse);
  const supportCount = supportTickets.length;
  const conversationStatus = conversation
    ? formatConversationStatus(conversation.status)
    : "Necreată";

  return {
    bookingStatusLabel: operationalState,
    bookingStatusVariant: getBookingStatusVariant(booking.status),
    bookingDetail: formatBookingStatusLabel(booking.status),
    paymentLabel: formatBookingAmount(payment),
    paymentDetail: paymentStatus ? formatBookingPaymentStatusLabel(paymentStatus) : "Fără plată",
    paymentVariant: getPaymentStatusVariant(paymentStatus),
    conversationLabel: conversationStatus,
    conversationDetail: conversation ? "Conversație disponibilă" : "Conversație necreată",
    conversationVariant: conversation ? "secondary" : "outline",
    supportLabel: String(supportCount),
    supportDetail: supportCount === 1 ? "Tichet asociat" : "Tichete asociate",
    supportVariant: supportCount > 0 ? "warning" : "outline",
    providerResponseLabel: formatRequestResponseStatus(requestResponse?.status),
    providerResponseDetail: sla.detail,
    providerResponseVariant: sla.variant,
  };
}

function hasDate(value: unknown) {
  return typeof value === "string" && value.trim() && formatAdminDateTime(value) !== "-";
}

export function buildBookingTimelineEvents(
  booking: BookingDocument,
  auditEvents: AuditEventItem[]
): BookingTimelineEvent[] {
  const events: BookingTimelineEvent[] = [];

  if (hasDate(booking.scheduledStartAt)) {
    events.push({
      id: "booking-scheduled",
      title: "Programare planificată",
      at: booking.scheduledStartAt,
      description: getServiceName(booking),
    });
  }

  if (hasDate(booking.requestResponse?.answeredAt)) {
    events.push({
      id: "provider-answered",
      title: "Răspuns primit de la prestator",
      at: booking.requestResponse?.answeredAt,
      description: "Prestatorul a răspuns la cererea de programare.",
    });
  }

  auditEvents.forEach((event, index) => {
    const action = readString(event.action);
    events.push({
      id: readString(event.eventId) || `audit-${index}`,
      title: formatBookingActivityLabel(action),
      at: readString(event.createdAt) || null,
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

export function readBookingCaseResult(payload: unknown): BookingCaseResult | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const result = payload as Record<string, unknown>;
  const status = readString(result.status);
  const bookingId = readString(result.bookingId);
  if (!status && !bookingId) {
    return null;
  }
  return {
    bookingId: bookingId || null,
    status: status || null,
    reason: readString(result.reason) || null,
    note: readString(result.note) || null,
    resolutionStatus: readString(result.resolutionStatus) || null,
    linkedTicketIds: Array.isArray(result.linkedTicketIds)
      ? result.linkedTicketIds.map((item) => readString(item)).filter(Boolean)
      : [],
    updatedAt: readString(result.updatedAt) || null,
  };
}

export function mergeBookingCaseResult(
  booking: BookingDocument,
  result: BookingCaseResult
): BookingDocument {
  return {
    ...booking,
    status: result.status || booking.status,
    adminCaseSnapshot: {
      ...(booking.adminCaseSnapshot || {}),
      latestNote: result.note || result.reason || booking.adminCaseSnapshot?.latestNote || null,
      resolutionStatus:
        result.resolutionStatus || booking.adminCaseSnapshot?.resolutionStatus || "open",
      linkedTicketIds:
        result.linkedTicketIds || booking.adminCaseSnapshot?.linkedTicketIds || [],
      updatedAt: result.updatedAt || booking.adminCaseSnapshot?.updatedAt || null,
    },
  };
}

export function mergeBookingCaseData(data: BookingCase, result: BookingCaseResult): BookingCase {
  if (!data.booking) {
    return data;
  }
  return {
    ...data,
    booking: mergeBookingCaseResult(data.booking, result),
  };
}

export { formatPaymentStatusLabel, getPaymentStatusVariant, tabTriggerClass };
