"use client";

import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";

export function DeleteProviderDialog({
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
  return (
    <AdminConfirmDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (loading) return;
        onOpenChange(nextOpen);
      }}
      title="Ștergi definitiv prestatorul?"
      description={
        <div className="space-y-2">
          <p>
            Prestator: <strong>{providerName || "—"}</strong>. Această acțiune șterge
            contul, profilul, serviciile și documentele prestatorului. Istoricul de
            programări rămâne păstrat.
          </p>
          {error ? <p className="text-sm text-rose-500">{error}</p> : null}
        </div>
      }
      confirmLabel="Șterge definitiv"
      variant="destructive"
      confirmDisabled={loading}
      onConfirm={onConfirm}
    />
  );
}
