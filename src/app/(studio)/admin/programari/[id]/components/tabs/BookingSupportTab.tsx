"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldValue } from "@/app/(studio)/admin/prestatori/[id]/components/shared/FieldValue";
import {
  formatConversationStatus,
  formatCompactValue,
  formatSupportPriority,
  formatSupportStatus,
  formatValue,
} from "@/lib/adminBookingDetail";
import { humanUserLabel } from "@/lib/adminHumanize";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";

export function BookingSupportTab({
  conversation,
  conversationId,
  supportTickets,
  review,
}: {
  conversation?: Record<string, unknown> | null;
  conversationId: string;
  supportTickets: Array<Record<string, unknown>>;
  review?: Record<string, unknown> | null;
}) {
  const lastMessage =
    conversation?.lastMessage && typeof conversation.lastMessage === "object"
      ? (conversation.lastMessage as Record<string, unknown>)
      : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Conversație</CardTitle>
          <CardDescription>Mesajele dintre client și prestator pentru această programare.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {conversation ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldValue
                label="Status"
                value={formatConversationStatus(conversation.status)}
              />
              <FieldValue
                label="Moderare"
                value={formatCompactValue(
                  (conversation.adminModeration as Record<string, unknown> | undefined)?.status
                )}
              />
              <FieldValue
                label="Ultimul mesaj"
                value={formatValue(lastMessage?.preview)}
              />
              <FieldValue
                label="Actualizat"
                value={formatAdminDateTime(conversation.updatedAt)}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nu există încă o conversație activă pentru această programare.
            </p>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/conversatii?conversationId=${encodeURIComponent(conversationId)}`}>
              Deschide conversația
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suport</CardTitle>
          <CardDescription>Tichetele de suport asociate programării.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {supportTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nu există tichete asociate.</p>
          ) : (
            supportTickets.map((ticket) => (
              <Link
                key={String(ticket.ticketId)}
                href={`/admin/suport?q=${encodeURIComponent(String(ticket.ticketId))}`}
                className="block rounded-lg border border-border p-4 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium">
                    {String(ticket.subject || ticket.ticketId)}
                  </p>
                  <Badge variant="outline">{formatSupportPriority(ticket.priority)}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatSupportStatus(ticket.status)} ·{" "}
                  {humanUserLabel(
                    {
                      displayName: (ticket.requesterSnapshot as Record<string, unknown> | undefined)
                        ?.displayName as string | undefined,
                      email: (ticket.requesterSnapshot as Record<string, unknown> | undefined)
                        ?.email as string | undefined,
                    },
                    "Solicitant necunoscut"
                  )}
                </p>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      {review ? (
        <Card>
          <CardHeader>
            <CardTitle>Recenzie</CardTitle>
            <CardDescription>Feedback-ul lăsat după programare.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FieldValue label="Rating" value={String(review.rating ?? "-")} />
            <FieldValue label="Status" value={formatCompactValue(review.status)} />
            <FieldValue label="Creat la" value={formatAdminDateTime(review.createdAt)} />
            <div className="sm:col-span-2 lg:col-span-3">
              <FieldValue
                label="Comentariu"
                value={formatValue(review.comment || review.body)}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
