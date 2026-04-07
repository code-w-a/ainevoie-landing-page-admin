const STORAGE_KEY = "ainevoid-admin-notifications-seen";
const MAX_IDS_PER_CATEGORY = 300;

export type AdminNotificationsSeen = {
  subscriberIds: string[];
  providerIds: string[];
};

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function parseStored(raw: string | null): AdminNotificationsSeen {
  if (!raw) {
    return { subscriberIds: [], providerIds: [] };
  }
  try {
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== "object") {
      return { subscriberIds: [], providerIds: [] };
    }
    const rec = o as Record<string, unknown>;
    const subscriberIds = Array.isArray(rec.subscriberIds) ?
      rec.subscriberIds.filter((x): x is string => typeof x === "string")
    : [];
    const providerIds = Array.isArray(rec.providerIds) ?
      rec.providerIds.filter((x): x is string => typeof x === "string")
    : [];
    return { subscriberIds, providerIds };
  } catch {
    return { subscriberIds: [], providerIds: [] };
  }
}

/** Append unique ids in order; drop oldest when over cap (FIFO). */
function appendIdsOrdered(current: string[], additions: string[]): string[] {
  const next = [...current];
  for (const id of additions) {
    if (id && !next.includes(id)) {
      next.push(id);
    }
  }
  while (next.length > MAX_IDS_PER_CATEGORY) {
    next.shift();
  }
  return next;
}

export function loadSeen(): AdminNotificationsSeen {
  if (!isBrowser()) {
    return { subscriberIds: [], providerIds: [] };
  }
  return parseStored(window.localStorage.getItem(STORAGE_KEY));
}

export function saveSeen(seen: AdminNotificationsSeen): void {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
  } catch {
    // quota / private mode
  }
}

export function markSubscribersSeen(ids: string[]): AdminNotificationsSeen {
  const prev = loadSeen();
  const next: AdminNotificationsSeen = {
    ...prev,
    subscriberIds: appendIdsOrdered(prev.subscriberIds, ids),
  };
  saveSeen(next);
  return next;
}

export function markProvidersSeen(ids: string[]): AdminNotificationsSeen {
  const prev = loadSeen();
  const next: AdminNotificationsSeen = {
    ...prev,
    providerIds: appendIdsOrdered(prev.providerIds, ids),
  };
  saveSeen(next);
  return next;
}

export function markAllSeen(ids: {
  subscriberIds: string[];
  providerIds: string[];
}): AdminNotificationsSeen {
  const prev = loadSeen();
  const next: AdminNotificationsSeen = {
    subscriberIds: appendIdsOrdered(prev.subscriberIds, ids.subscriberIds),
    providerIds: appendIdsOrdered(prev.providerIds, ids.providerIds),
  };
  saveSeen(next);
  return next;
}
