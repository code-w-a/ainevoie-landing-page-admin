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

export function DeleteProviderDialog({
  providerId,
  providerName,
  open,
  loading,
  error,
  onOpenChange,
  onConfirm,
}: {
  providerId: string;
  providerName: string;
  open: boolean;
  loading: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<boolean>;
}) {
  const [confirmation, setConfirmation] = useState("");
  const canConfirm = confirmation.trim() === providerId;

  useEffect(() => {
    if (open) setConfirmation("");
  }, [open, providerId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(event) => loading && event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Șterge definitiv prestatorul</DialogTitle>
          <DialogDescription>
            Această acțiune șterge contul, profilul, serviciile și documentele prestatorului.
            Istoricul de programări rămâne păstrat.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
          <p className="font-medium">{providerName}</p>
        </div>
        <div>
          <label className="mb-2 inline-block text-sm font-medium">
            Tastează codul intern pentru confirmare
          </label>
          <input
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={confirmation}
            disabled={loading}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={providerId}
          />
        </div>
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" disabled={loading} onClick={() => onOpenChange(false)}>
            Anulează
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={loading || !canConfirm}
            onClick={async () => {
              const done = await onConfirm();
              if (done) onOpenChange(false);
            }}
          >
            {loading ? "Se șterge..." : "Șterge definitiv"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
