"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatResolutionStatusLabel,
  getAvailableUserActions,
  type ResolutionStatus,
  type UserStateAction,
} from "@/lib/adminUserDetail";

export function UserAccountManagementCard({
  accountStatus,
  reason,
  note,
  resolutionStatus,
  pending,
  actionError,
  onReasonChange,
  onNoteChange,
  onResolutionStatusChange,
  onSubmit,
}: {
  accountStatus: string;
  reason: string;
  note: string;
  resolutionStatus: ResolutionStatus;
  pending: boolean;
  actionError: string | null;
  onReasonChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onResolutionStatusChange: (value: ResolutionStatus) => void;
  onSubmit: (action: UserStateAction) => void;
}) {
  const availableActions = getAvailableUserActions(accountStatus);
  const primaryAction = availableActions[0];
  const isDisable = primaryAction === "disable";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestionare cont</CardTitle>
        <CardDescription>
          Poți dezactiva temporar contul dacă există o problemă de securitate, abuz sau solicitare
          internă.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Motiv dezactivare
            </label>
            <input
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              placeholder={isDisable ? "Obligatoriu la dezactivare" : "Opțional"}
              value={reason}
              disabled={pending || !isDisable}
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
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {primaryAction && (
            <Button
              variant={isDisable ? "destructive" : "default"}
              disabled={pending || (isDisable && !reason.trim())}
              onClick={() => onSubmit(primaryAction)}
            >
              {isDisable ? "Dezactivează cont" : "Reactivează cont"}
            </Button>
          )}
          <p className="text-sm text-muted-foreground">
            Status caz curent: {formatResolutionStatusLabel(resolutionStatus)}
          </p>
        </div>

        {actionError && <p className="text-sm text-rose-500">{actionError}</p>}
      </CardContent>
    </Card>
  );
}
