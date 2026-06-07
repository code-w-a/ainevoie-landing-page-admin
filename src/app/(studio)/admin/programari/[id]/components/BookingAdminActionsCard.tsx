"use client";

import { AdminEntityLookup } from "@/components/admin/AdminEntityLookup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatResolutionStatusLabel,
  type ResolutionStatus,
} from "@/lib/adminBookingDetail";

export function BookingAdminActionsCard({
  reason,
  note,
  resolutionStatus,
  linkedTicketId,
  pending,
  actionError,
  onReasonChange,
  onNoteChange,
  onResolutionStatusChange,
  onLinkedTicketChange,
  onCancel,
  onSaveCase,
}: {
  reason: string;
  note: string;
  resolutionStatus: ResolutionStatus;
  linkedTicketId: string;
  pending: boolean;
  actionError: string | null;
  onReasonChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onResolutionStatusChange: (value: ResolutionStatus) => void;
  onLinkedTicketChange: (value: string) => void;
  onCancel: () => void;
  onSaveCase: () => void;
}) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle>Acțiuni administrative</CardTitle>
        <CardDescription>
          Folosește această secțiune doar când este nevoie de o intervenție internă: anulare,
          notă de caz sau legătura unui tichet de suport.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Motiv anulare
            </label>
            <input
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              placeholder="Obligatoriu la anulare"
              value={reason}
              disabled={pending}
              onChange={(event) => onReasonChange(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Notă internă
            </label>
            <input
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              placeholder="Notă pentru echipa internă"
              value={note}
              disabled={pending}
              onChange={(event) => onNoteChange(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status caz
            </label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={resolutionStatus}
              disabled={pending}
              onChange={(event) =>
                onResolutionStatusChange(event.target.value as ResolutionStatus)
              }
            >
              <option value="open">Deschis</option>
              <option value="in_progress">În lucru</option>
              <option value="resolved">Închis</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tichet suport asociat
            </label>
            <AdminEntityLookup
              value={linkedTicketId}
              entityType="supportTicket"
              disabled={pending}
              placeholder="Caută tichet suport"
              onValueChange={onLinkedTicketChange}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="destructive"
            disabled={pending || !reason.trim()}
            onClick={onCancel}
          >
            Anulează programarea
          </Button>
          <Button variant="outline" disabled={pending} onClick={onSaveCase}>
            Salvează nota cazului
          </Button>
          <p className="text-sm text-muted-foreground">
            Status caz curent: {formatResolutionStatusLabel(resolutionStatus)}
          </p>
        </div>

        {actionError && <p className="text-sm text-rose-500">{actionError}</p>}
      </CardContent>
    </Card>
  );
}
