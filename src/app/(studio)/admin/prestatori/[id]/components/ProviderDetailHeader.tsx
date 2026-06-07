"use client";

import Link from "next/link";
import {
  AlertTriangle,
  BriefcaseBusiness,
  ChevronLeft,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  RotateCcw,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  formatValue,
  getAvailableActions,
  getDisplayName,
  getLocationLabel,
  getSimplifiedStatusLabel,
  getSimplifiedStatusVariant,
  getSpecialization,
  type ProviderDocument,
  type ReviewAction,
} from "@/lib/adminProviderDetail";
import { AvatarPreview } from "./shared/AvatarPreview";

export function ProviderDetailHeader({
  provider,
  status,
  avatarPreviewUrl,
  avatarPreviewLoading,
  saving,
  deleting,
  isSuperAdmin,
  resyncingDirectory,
  actionError,
  resyncError,
  avatarPreviewError,
  onApprove,
  onReject,
  onAction,
  onDelete,
  onResync,
}: {
  provider: ProviderDocument;
  status: string;
  avatarPreviewUrl: string | null;
  avatarPreviewLoading: boolean;
  saving: boolean;
  deleting: boolean;
  isSuperAdmin: boolean;
  resyncingDirectory: boolean;
  actionError: string | null;
  resyncError: string | null;
  avatarPreviewError: string | null;
  onApprove: () => void;
  onReject: () => void;
  onAction: (action: ReviewAction) => void;
  onDelete: () => void;
  onResync: () => void;
}) {
  const displayName = getDisplayName(provider);
  const specialization = getSpecialization(provider);
  const locationLabel = getLocationLabel(provider);
  const availableActions = getAvailableActions(status);
  const canApprove = availableActions.includes("approve");
  const canReject = availableActions.includes("reject");
  const secondaryActions = availableActions.filter((action) => action !== "approve" && action !== "reject");

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <AvatarPreview
              src={avatarPreviewUrl}
              loading={avatarPreviewLoading}
              name={displayName}
              size="sm"
            />
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="break-words text-2xl font-semibold tracking-tight">{displayName}</h1>
                <Badge variant={getSimplifiedStatusVariant(status)}>
                  {getSimplifiedStatusLabel(status)}
                </Badge>
              </div>
              <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <span className="flex min-w-0 items-center gap-2">
                  <BriefcaseBusiness className="h-4 w-4 shrink-0" />
                  <span className="truncate">{formatValue(specialization)}</span>
                </span>
                <span className="flex min-w-0 items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">{locationLabel}</span>
                </span>
                <span className="flex min-w-0 items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{formatValue(provider.email)}</span>
                </span>
                {(provider.phoneNumber || provider.phone) && (
                  <span className="flex min-w-0 items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span className="truncate">{formatValue(provider.phoneNumber || provider.phone)}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 lg:items-end">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
              <Link href="/admin/prestatori">
                <ChevronLeft className="h-4 w-4" />
                Înapoi la listă
              </Link>
            </Button>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {canApprove && (
                <Button disabled={saving} onClick={onApprove}>
                  <ShieldCheck className="h-4 w-4" />
                  Aprobă furnizor
                </Button>
              )}
              {canReject && (
                <Button variant="outline" disabled={saving} onClick={onReject}>
                  <XCircle className="h-4 w-4" />
                  Respinge
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={saving && deleting}>
                    <MoreHorizontal className="h-4 w-4" />
                    Mai multe
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {secondaryActions.map((action) => (
                    <DropdownMenuItem
                      key={action}
                      onClick={() => onAction(action)}
                      className={action === "suspend" ? "text-amber-700" : undefined}
                    >
                      {action === "suspend" ? (
                        <AlertTriangle className="mr-2 h-4 w-4" />
                      ) : (
                        <RotateCcw className="mr-2 h-4 w-4" />
                      )}
                      {action === "suspend" ? "Suspendă" : "Reactivează"}
                    </DropdownMenuItem>
                  ))}
                  {secondaryActions.length > 0 && <DropdownMenuSeparator />}
                  {isSuperAdmin && (
                    <DropdownMenuItem
                      disabled={resyncingDirectory}
                      onClick={onResync}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      {resyncingDirectory ? "Se resincronizează..." : "Resync profil public"}
                    </DropdownMenuItem>
                  )}
                  {isSuperAdmin && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    disabled={deleting}
                    onClick={onDelete}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Șterge prestator
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {actionError && <p className="mt-4 text-sm text-rose-500">{actionError}</p>}
        {resyncError && <p className="mt-4 text-sm text-rose-500">{resyncError}</p>}
        {avatarPreviewError && <p className="mt-4 text-sm text-amber-700">{avatarPreviewError}</p>}
      </CardContent>
    </Card>
  );
}
