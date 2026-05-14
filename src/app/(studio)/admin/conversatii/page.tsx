"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Flag, MessageCircle, RefreshCcw, Search, Shield, ShieldOff } from "lucide-react";
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
import { AdminTableSkeleton } from "@/components/admin/AdminSkeletonLayouts";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ModerationStatus = "none" | "flagged" | "under_review" | "resolved";

type ConversationListItem = {
  conversationId: string;
  type: string;
  status: string;
  bookingId: string | null;
  userId: string | null;
  providerId: string | null;
  lastMessage: {
    preview: string | null;
    createdAt: string | null;
  } | null;
  moderationStatus: ModerationStatus;
  moderationNote: string | null;
  updatedAt: string | null;
};

type ConversationListResponse = {
  items: ConversationListItem[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
};

type ConversationParticipant = {
  membershipId: string;
  uid: string;
  role: string;
  blockedAt: string | null;
  blockedBy: {
    uid: string | null;
    role: string | null;
  } | null;
  blockReason: string | null;
  unreadCount: number;
  lastMessageAt: string | null;
};

type ConversationDetailResponse = {
  item: ConversationListItem;
  participants: ConversationParticipant[];
};

type ConversationMessage = {
  messageId: string;
  senderUid: string | null;
  senderRole: string | null;
  type: string;
  body: string;
  status: string;
  createdAt: string | null;
};

type ConversationMessagesResponse = {
  items: ConversationMessage[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
};

const moderationStatuses: ModerationStatus[] = ["none", "flagged", "under_review", "resolved"];
const conversationTypes = ["all", "direct", "booking"];
const conversationStatuses = ["all", "active", "closed"];

function label(value?: string | null) {
  return value ? value.replaceAll("_", " ") : "-";
}

function moderationVariant(status: string) {
  if (status === "flagged") return "danger";
  if (status === "under_review") return "warning";
  if (status === "resolved") return "success";
  return "outline";
}

function statusVariant(status: string) {
  if (status === "active") return "success";
  if (status === "closed") return "secondary";
  return "outline";
}

export default function AdminConversationsPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [userId, setUserId] = useState("");
  const [providerId, setProviderId] = useState("");

  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [moderationStatus, setModerationStatus] = useState<ModerationStatus>("none");
  const [moderationNote, setModerationNote] = useState("");
  const [savingModeration, setSavingModeration] = useState(false);

  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [messagesCursor, setMessagesCursor] = useState<string | null>(null);
  const [messagesHasMore, setMessagesHasMore] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const [participantReasons, setParticipantReasons] = useState<Record<string, string>>({});
  const [pendingParticipantUid, setPendingParticipantUid] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(timer);
  }, [q]);

  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", "20");
    if (debouncedQ) params.set("q", debouncedQ);
    if (status !== "all") params.set("status", status);
    if (type !== "all") params.set("type", type);
    if (userId.trim()) params.set("userId", userId.trim());
    if (providerId.trim()) params.set("providerId", providerId.trim());
    return params;
  }, [debouncedQ, providerId, status, type, userId]);

  const baseEndpoint = useMemo(
    () => `/api/admin/conversations?${searchParams.toString()}`,
    [searchParams]
  );

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadConversations(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseEndpoint]);

  useEffect(() => {
    if (!selectedConversationId) {
      setDetail(null);
      setMessages([]);
      setMessagesCursor(null);
      setMessagesHasMore(false);
      return;
    }
    void loadDetail(selectedConversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId]);

  async function loadConversations(reset: boolean) {
    setLoadingMore(true);
    setActionError(null);
    if (reset) {
      setError(null);
    }

    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("limit", "20");
      if (!reset && nextCursor) {
        params.set("cursor", nextCursor);
      }

      const response = await adminFetch(`/api/admin/conversations?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(await readAdminResponseError(response, "Nu am putut încărca conversațiile."));
      }

      const payload = (await response.json()) as ConversationListResponse;
      const loadedItems = Array.isArray(payload.items) ? payload.items : [];

      setItems((current) => {
        if (reset) {
          return loadedItems;
        }

        const seen = new Set(current.map((item) => item.conversationId));
        const merged = [...current];
        loadedItems.forEach((item) => {
          if (!seen.has(item.conversationId)) {
            merged.push(item);
            seen.add(item.conversationId);
          }
        });
        return merged;
      });

      setNextCursor(payload.page?.nextCursor || null);
      setHasMore(Boolean(payload.page?.hasMore));

      if (reset && loadedItems.length > 0) {
        setSelectedConversationId((current) => current || loadedItems[0].conversationId);
      }
      if (reset && loadedItems.length === 0) {
        setSelectedConversationId(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nu am putut încărca conversațiile.";
      if (reset) {
        setError(message);
      } else {
        setActionError(message);
      }
      if (reset) {
        setItems([]);
        setNextCursor(null);
        setHasMore(false);
      }
    } finally {
      setLoadingMore(false);
    }
  }

  async function loadDetail(conversationId: string) {
    setDetailLoading(true);
    setDetailError(null);
    setActionError(null);

    try {
      const response = await adminFetch(`/api/admin/conversations/${encodeURIComponent(conversationId)}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await readAdminResponseError(response, "Nu am putut încărca conversația."));
      }

      const payload = (await response.json()) as ConversationDetailResponse;
      setDetail(payload);
      setModerationStatus(payload.item.moderationStatus || "none");
      setModerationNote(payload.item.moderationNote || "");
      setParticipantReasons({});
      setMessages([]);
      setMessagesCursor(null);
      setMessagesHasMore(false);
      setMessagesError(null);
    } catch (err) {
      setDetail(null);
      setDetailError(err instanceof Error ? err.message : "Nu am putut încărca conversația.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function loadMessages(reset: boolean) {
    if (!selectedConversationId) {
      return;
    }

    setMessagesLoading(true);
    setMessagesError(null);

    try {
      const params = new URLSearchParams();
      params.set("limit", "30");
      if (!reset && messagesCursor) {
        params.set("cursor", messagesCursor);
      }

      const response = await adminFetch(
        `/api/admin/conversations/${encodeURIComponent(selectedConversationId)}/messages?${params.toString()}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(await readAdminResponseError(response, "Nu am putut încărca mesajele."));
      }

      const payload = (await response.json()) as ConversationMessagesResponse;
      const loadedItems = Array.isArray(payload.items) ? payload.items : [];

      setMessages((current) => (reset ? loadedItems : [...current, ...loadedItems]));
      setMessagesCursor(payload.page?.nextCursor || null);
      setMessagesHasMore(Boolean(payload.page?.hasMore));
    } catch (err) {
      setMessagesError(err instanceof Error ? err.message : "Nu am putut încărca mesajele.");
      if (reset) {
        setMessages([]);
        setMessagesCursor(null);
        setMessagesHasMore(false);
      }
    } finally {
      setMessagesLoading(false);
    }
  }

  async function saveModeration() {
    if (!selectedConversationId) {
      return;
    }

    setSavingModeration(true);
    setActionError(null);

    try {
      const response = await adminFetch(
        `/api/admin/conversations/${encodeURIComponent(selectedConversationId)}/moderation`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: moderationStatus,
            note: moderationNote,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          await readAdminResponseError(response, "Nu am putut salva moderarea conversației.")
        );
      }

      await loadDetail(selectedConversationId);
      await loadConversations(true);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Nu am putut salva moderarea conversației."
      );
    } finally {
      setSavingModeration(false);
    }
  }

  async function toggleParticipantBlock(participant: ConversationParticipant) {
    if (!selectedConversationId) {
      return;
    }

    setPendingParticipantUid(participant.uid);
    setActionError(null);

    try {
      const shouldBlock = !participant.blockedAt;
      const response = await adminFetch(
        `/api/admin/conversations/${encodeURIComponent(selectedConversationId)}/participants/${encodeURIComponent(participant.uid)}/block`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blocked: shouldBlock,
            reason: shouldBlock ? (participantReasons[participant.uid] || "") : "",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(await readAdminResponseError(response, "Nu am putut actualiza participantul."));
      }

      await loadDetail(selectedConversationId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Nu am putut actualiza participantul.");
    } finally {
      setPendingParticipantUid(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Conversații</h1>
        <p className="text-sm text-muted-foreground">
          Investigație dispute chat: listă paginată, timeline read-only la cerere și moderare cost-efficient.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtre</CardTitle>
          <CardDescription>
            Căutare ID-only în conversații (`conversationId`, `bookingId`, `userId`, `providerId`).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Căutare ID"
              value={q}
              disabled={loadingMore}
              onChange={(event) => setQ(event.target.value)}
            />
          </div>

          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            disabled={loadingMore}
          >
            {conversationStatuses.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "Toate statusurile" : label(item)}
              </option>
            ))}
          </select>

          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
            value={type}
            onChange={(event) => setType(event.target.value)}
            disabled={loadingMore}
          >
            {conversationTypes.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "Toate tipurile" : label(item)}
              </option>
            ))}
          </select>

          <Input
            placeholder="User ID"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            disabled={loadingMore}
          />

          <Input
            placeholder="Provider ID"
            value={providerId}
            onChange={(event) => setProviderId(event.target.value)}
            disabled={loadingMore}
          />

          <Button
            type="button"
            variant="outline"
            className="md:col-span-2"
            onClick={() => {
              void loadConversations(true);
            }}
            disabled={loadingMore}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh manual
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listă conversații</CardTitle>
          <CardDescription>
            Fără auto-load mesaje: detaliul și timeline-ul se încarcă doar la selectare.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-3 text-sm text-rose-500">{error}</p>}
          {actionError && <p className="mb-3 text-sm text-rose-500">{actionError}</p>}

          {loadingMore && items.length === 0 ? (
            <AdminTableSkeleton rows={8} columns={9} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conversație</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Ultimul mesaj</TableHead>
                  <TableHead>Moderare</TableHead>
                  <TableHead>Actualizat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-sm text-muted-foreground">
                      Nu există conversații pentru filtrele selectate.
                    </TableCell>
                  </TableRow>
                )}

                {items.map((item) => {
                  const isSelected = selectedConversationId === item.conversationId;
                  return (
                    <TableRow
                      key={item.conversationId}
                      className={isSelected ? "bg-primary/5" : ""}
                      onClick={() => setSelectedConversationId(item.conversationId)}
                    >
                      <TableCell className="font-medium">{item.conversationId}</TableCell>
                      <TableCell>{label(item.type)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(item.status)}>{label(item.status)}</Badge>
                      </TableCell>
                      <TableCell>
                        {item.bookingId ? (
                          <Link className="text-primary hover:underline" href={`/admin/programari/${encodeURIComponent(item.bookingId)}`}>
                            {item.bookingId}
                          </Link>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {item.userId ? (
                          <Link className="text-primary hover:underline" href={`/admin/utilizatori/${encodeURIComponent(item.userId)}`}>
                            {item.userId}
                          </Link>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {item.providerId ? (
                          <Link className="text-primary hover:underline" href={`/admin/prestatori/${encodeURIComponent(item.providerId)}`}>
                            {item.providerId}
                          </Link>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        <p className="truncate text-sm">{item.lastMessage?.preview || "-"}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatAdminDateTime(item.lastMessage?.createdAt)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={moderationVariant(item.moderationStatus)}>
                          {label(item.moderationStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatAdminDateTime(item.updatedAt)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {hasMore && (
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => void loadConversations(false)}
                disabled={loadingMore}
              >
                Load more
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detaliu conversație</CardTitle>
          <CardDescription>
            Moderare conversație + block participant per conversație, apoi timeline read-only la cerere.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!selectedConversationId && (
            <p className="text-sm text-muted-foreground">
              Selectează o conversație din listă pentru detalii.
            </p>
          )}

          {detailLoading && <AdminTableSkeleton rows={4} columns={4} />}
          {detailError && <p className="text-sm text-rose-500">{detailError}</p>}

          {detail && (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Conversation ID</p>
                  <p className="text-sm font-medium">{detail.item.conversationId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={statusVariant(detail.item.status)}>{label(detail.item.status)}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tip</p>
                  <p className="text-sm">{label(detail.item.type)}</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Moderare</p>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={moderationStatus}
                    onChange={(event) => setModerationStatus(event.target.value as ModerationStatus)}
                    disabled={savingModeration}
                  >
                    {moderationStatuses.map((item) => (
                      <option key={item} value={item}>
                        {label(item)}
                      </option>
                    ))}
                  </select>
                  <textarea
                    className="min-h-[96px] w-full rounded-md border border-input bg-background p-3 text-sm"
                    value={moderationNote}
                    maxLength={2000}
                    disabled={savingModeration}
                    onChange={(event) => setModerationNote(event.target.value)}
                    placeholder="Notă internă de moderare"
                  />
                  <Button type="button" onClick={() => void saveModeration()} disabled={savingModeration}>
                    <Flag className="mr-2 h-4 w-4" />
                    Salvează moderare
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Participanți</p>
                  {detail.participants.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nu există membership-uri pentru această conversație.</p>
                  ) : (
                    <div className="space-y-3">
                      {detail.participants.map((participant) => {
                        const isBlocked = Boolean(participant.blockedAt);
                        return (
                          <div key={participant.membershipId} className="rounded-md border border-border p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium">
                                  {participant.uid} <span className="text-muted-foreground">({participant.role})</span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  unread: {participant.unreadCount} · last: {formatAdminDateTime(participant.lastMessageAt)}
                                </p>
                                {isBlocked ? (
                                  <p className="text-xs text-rose-600">
                                    blocked {formatAdminDateTime(participant.blockedAt)}
                                  </p>
                                ) : null}
                              </div>
                              <Badge variant={isBlocked ? "danger" : "outline"}>
                                {isBlocked ? "blocked" : "active"}
                              </Badge>
                            </div>

                            <div className="mt-3 flex flex-col gap-2 md:flex-row">
                              <Input
                                placeholder="Reason"
                                value={participantReasons[participant.uid] || ""}
                                onChange={(event) =>
                                  setParticipantReasons((current) => ({
                                    ...current,
                                    [participant.uid]: event.target.value,
                                  }))
                                }
                                disabled={pendingParticipantUid === participant.uid}
                              />
                              <Button
                                type="button"
                                variant={isBlocked ? "outline" : "destructive"}
                                onClick={() => void toggleParticipantBlock(participant)}
                                disabled={pendingParticipantUid === participant.uid}
                              >
                                {isBlocked ? (
                                  <>
                                    <ShieldOff className="mr-2 h-4 w-4" />
                                    Unblock
                                  </>
                                ) : (
                                  <>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Block
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Timeline mesaje (read-only)</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void loadMessages(true)}
                      disabled={messagesLoading}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {messages.length ? "Refresh mesaje" : "Load mesaje"}
                    </Button>
                  </div>
                </div>

                {messagesError && (
                  <div className="flex items-center gap-2 text-sm text-rose-500">
                    <AlertCircle className="h-4 w-4" />
                    {messagesError}
                  </div>
                )}

                {messagesLoading && messages.length === 0 ? (
                  <AdminTableSkeleton rows={6} columns={4} />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mesaj</TableHead>
                        <TableHead>Sender</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Creat la</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {messages.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-sm text-muted-foreground">
                            Timeline-ul nu este încărcat. Apasă `Load mesaje`.
                          </TableCell>
                        </TableRow>
                      )}
                      {messages.map((message) => (
                        <TableRow key={message.messageId}>
                          <TableCell className="max-w-[420px]">
                            <p className="truncate text-sm">{message.body || "-"}</p>
                            <p className="text-xs text-muted-foreground">{message.messageId}</p>
                          </TableCell>
                          <TableCell>
                            {message.senderUid || "-"}
                            {message.senderRole ? (
                              <span className="ml-1 text-xs text-muted-foreground">({message.senderRole})</span>
                            ) : null}
                          </TableCell>
                          <TableCell>{label(message.status)}</TableCell>
                          <TableCell>{formatAdminDateTime(message.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {messagesHasMore && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void loadMessages(false)}
                    disabled={messagesLoading}
                  >
                    Load more mesaje
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
