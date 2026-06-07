"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProviderPublicSyncBanner({
  issues,
  isSuperAdmin,
  resyncingDirectory,
  onResync,
  onOpenTechnicalDetails,
}: {
  issues: string[];
  isSuperAdmin: boolean;
  resyncingDirectory: boolean;
  onResync: () => void;
  onOpenTechnicalDetails: () => void;
}) {
  if (!issues.length) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="space-y-2">
          <p className="font-medium">Profilul public nu este sincronizat</p>
          <ul className="space-y-1 text-amber-900">
            {issues.slice(0, 2).map((issue) => (
              <li key={issue}>- {issue}</li>
            ))}
          </ul>
          <button
            type="button"
            className="text-xs underline underline-offset-2"
            onClick={onOpenTechnicalDetails}
          >
            Vezi detalii tehnice
          </button>
        </div>
      </div>
      <div className="shrink-0">
        {isSuperAdmin ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={resyncingDirectory}
            onClick={onResync}
          >
            <RotateCcw className="h-4 w-4" />
            {resyncingDirectory ? "Se resincronizează..." : "Resync profil public"}
          </Button>
        ) : (
          <p className="text-xs text-amber-800">Contactează echipa tehnică pentru sincronizare.</p>
        )}
      </div>
    </div>
  );
}
