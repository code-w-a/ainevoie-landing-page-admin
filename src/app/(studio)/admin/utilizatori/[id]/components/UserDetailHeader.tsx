"use client";

import Link from "next/link";
import { ChevronLeft, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatCompactValue,
  getAccountStatusLabel,
  getAccountStatusVariant,
  getLegalConsentLabel,
  getLegalConsentVariant,
  getLatestActivityAt,
  getUserDisplayName,
  type AuditEventItem,
  type BookingListItem,
  type UserDocument,
} from "@/lib/adminUserDetail";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";

export function UserDetailHeader({
  user,
  recentBookings,
  recentAuditEvents,
}: {
  user: UserDocument;
  recentBookings: BookingListItem[];
  recentAuditEvents: AuditEventItem[];
}) {
  const accountStatus = user.accountStatus === "disabled" ? "disabled" : "active";
  const latestActivityAt = getLatestActivityAt(user, recentBookings, recentAuditEvents);

  return (
    <Card>
      <CardContent className="p-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/utilizatori">
            <ChevronLeft className="h-4 w-4" />
            Înapoi la utilizatori
          </Link>
        </Button>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{getUserDisplayName(user)}</h1>
              <Badge variant={getAccountStatusVariant(accountStatus)}>
                {getAccountStatusLabel(accountStatus)}
              </Badge>
              <Badge variant={getLegalConsentVariant(user.legalConsentState)}>
                Consimțăminte: {getLegalConsentLabel(user.legalConsentState)}
              </Badge>
            </div>

            <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <span className="flex min-w-0 items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">{formatCompactValue(user.email, "Fără email")}</span>
              </span>
              {user.phoneNumber && (
                <span className="flex min-w-0 items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span className="truncate">{user.phoneNumber}</span>
                </span>
              )}
              <span className="sm:col-span-2">
                Ultima activitate: {formatAdminDateTime(latestActivityAt)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
