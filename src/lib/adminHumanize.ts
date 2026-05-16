export function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export function humanUserLabel(source: {
  displayName?: unknown;
  email?: unknown;
  phoneNumber?: unknown;
  phone?: unknown;
}, fallback = "Utilizator necunoscut") {
  return (
    readString(source.displayName)
    || readString(source.email)
    || readString(source.phoneNumber)
    || readString(source.phone)
    || fallback
  );
}

export function humanProviderLabel(source: {
  displayName?: unknown;
  businessName?: unknown;
  email?: unknown;
  phoneNumber?: unknown;
  professionalProfile?: unknown;
}, fallback = "Prestator necunoscut") {
  const profile = source.professionalProfile && typeof source.professionalProfile === "object"
    ? source.professionalProfile as Record<string, unknown>
    : {};
  return (
    readString(profile.displayName)
    || readString(profile.businessName)
    || readString(source.displayName)
    || readString(source.businessName)
    || readString(source.email)
    || readString(source.phoneNumber)
    || fallback
  );
}

export function humanAdminLabel(source: {
  displayName?: unknown;
  email?: unknown;
}, fallback = "Admin necunoscut") {
  return readString(source.displayName) || readString(source.email) || fallback;
}

export function humanBookingLabel(source: {
  serviceName?: unknown;
  userLabel?: unknown;
  providerLabel?: unknown;
}, fallback = "Programare") {
  const serviceName = readString(source.serviceName);
  const userLabel = readString(source.userLabel);
  const providerLabel = readString(source.providerLabel);
  if (serviceName && userLabel && providerLabel) {
    return `${serviceName} · ${userLabel} → ${providerLabel}`;
  }
  if (serviceName) {
    return `${fallback} · ${serviceName}`;
  }
  if (userLabel && providerLabel) {
    return `${fallback} · ${userLabel} → ${providerLabel}`;
  }
  return fallback;
}

