"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  actionMeta,
  humanizeApprovalReason,
  type ReviewAction,
} from "@/lib/adminProviderDetail";

export function ReviewDecisionDialog({
  action,
  open,
  loading,
  error,
  approvalWarnings,
  onOpenChange,
  onConfirm,
}: {
  action: ReviewAction | null;
  open: boolean;
  loading: boolean;
  error: string | null;
  approvalWarnings: string[];
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string, overrideIncompleteProfile: boolean) => Promise<boolean>;
}) {
  const [reason, setReason] = useState("");
  const [overrideIncompleteProfile, setOverrideIncompleteProfile] = useState(false);
  const requiresReason = action === "reject" || action === "suspend";
  const requiresOverride = action === "approve" && approvalWarnings.length > 0;
  const meta = action ? actionMeta[action] : null;
  const friendlyWarnings = approvalWarnings.map(humanizeApprovalReason);

  useEffect(() => {
    if (open) {
      setReason("");
      setOverrideIncompleteProfile(false);
    }
  }, [open, action]);

  if (!meta || !action) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(event) => loading && event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{meta.title}</DialogTitle>
          <DialogDescription>{meta.description}</DialogDescription>
        </DialogHeader>
        {requiresReason && (
          <div>
            <label className="mb-2 inline-block text-sm font-medium">Motiv</label>
            <textarea
              className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={reason}
              disabled={loading}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Notează pe scurt motivul deciziei..."
            />
          </div>
        )}
        {requiresOverride && (
          <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <div>
              <p className="font-medium">Profil incomplet</p>
              <p className="mt-1">
                Profilul nu este complet. Pentru aprobare, confirmă că vrei să continui oricum. Lipsesc:
              </p>
            </div>
            <ul className="list-disc space-y-1 pl-5">
              {friendlyWarnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-1 size-4"
                checked={overrideIncompleteProfile}
                disabled={loading}
                onChange={(event) => setOverrideIncompleteProfile(event.target.checked)}
              />
              <span>Confirm că aprob profilul chiar dacă nu este complet.</span>
            </label>
          </div>
        )}
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" disabled={loading} onClick={() => onOpenChange(false)}>
            Anulează
          </Button>
          <Button
            type="button"
            variant={meta.destructive ? "destructive" : "default"}
            disabled={loading || (requiresReason && !reason.trim()) || (requiresOverride && !overrideIncompleteProfile)}
            onClick={async () => {
              const done = await onConfirm(reason, requiresOverride ? overrideIncompleteProfile : false);
              if (done) onOpenChange(false);
            }}
          >
            {loading ? "Se procesează..." : meta.label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
