"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DocumentPreviewDialog({
  open,
  title,
  previewUrl,
  loading,
  error,
  onOpenChange,
}: {
  open: boolean;
  title: string;
  previewUrl: string | null;
  loading: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title || "Document"}</DialogTitle>
          <DialogDescription>Document disponibil doar pentru administratori.</DialogDescription>
        </DialogHeader>
        <div className="flex min-h-[320px] items-center justify-center rounded-md border border-border bg-muted/30 p-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Se încarcă documentul...</p>
          ) : error ? (
            <p className="text-sm text-rose-500">{error}</p>
          ) : previewUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={title || "Document prestator"}
                className="max-h-[70vh] max-w-full rounded-sm object-contain"
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Documentul nu poate fi încărcat.</p>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={!previewUrl}
            onClick={() => {
              if (previewUrl) {
                window.open(previewUrl, "_blank", "noopener,noreferrer");
              }
            }}
          >
            <ExternalLink className="h-4 w-4" />
            Deschide în tab nou
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Închide
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
