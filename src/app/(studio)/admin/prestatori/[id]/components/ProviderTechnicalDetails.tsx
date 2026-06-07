"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DRIFT_SPECIALIZATION_ISSUE,
  formatCompactValue,
  getPublicPreviewDrift,
  normalizeBlockedDates,
  normalizeProviderServices,
  readString,
  type ProviderCase,
  type ProviderDocument,
} from "@/lib/adminProviderDetail";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";
import { FieldValue } from "./shared/FieldValue";

export function ProviderTechnicalDetails({
  provider,
  providerId,
  data,
  isSuperAdmin,
  resyncingDirectory,
  onResync,
}: {
  provider: ProviderDocument;
  providerId: string;
  data: ProviderCase;
  isSuperAdmin: boolean;
  resyncingDirectory: boolean;
  onResync: () => void;
}) {
  const publicPreviewDrift = getPublicPreviewDrift(
    provider,
    data.providerDirectory || null,
    data.services,
    data.availability || null
  );
  const visibleIssues = isSuperAdmin
    ? publicPreviewDrift.issues
    : publicPreviewDrift.issues.filter((issue) => issue !== DRIFT_SPECIALIZATION_ISSUE);
  const blockedDates = normalizeBlockedDates(data.availability || null);
  const services = normalizeProviderServices(data.services);
  const auditEvents = data.recentAuditEvents || [];

  return (
    <details id="provider-technical-details" className="rounded-lg border border-border bg-muted/20">
      <summary className="cursor-pointer px-6 py-4 text-sm font-medium text-muted-foreground hover:text-foreground">
        Detalii tehnice
      </summary>
      <div className="space-y-6 border-t border-border px-6 py-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FieldValue label="Provider ID" value={providerId} />
          <FieldValue label="User ID" value={formatCompactValue(provider.uid || provider.id)} />
          <FieldValue label="Creat la" value={formatAdminDateTime(provider.createdAt)} />
          <FieldValue label="Actualizat la" value={formatAdminDateTime(provider.updatedAt)} />
          <FieldValue label="Publicat la" value={formatAdminDateTime(provider.lastPublishedAt)} />
          <FieldValue label="Sursă înscriere" value={formatCompactValue(provider.source)} />
        </div>

        <div className="rounded-lg border border-border p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Sincronizare profil public</p>
              <p className="text-xs text-muted-foreground">
                {publicPreviewDrift.hasDrift
                  ? "Profilul public diferă de datele curente."
                  : "Profilul public este aliniat."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={publicPreviewDrift.hasDrift ? "warning" : "success"}>
                {publicPreviewDrift.hasDrift ? "Nealiniat" : "Aliniat"}
              </Badge>
              {isSuperAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={resyncingDirectory}
                  onClick={onResync}
                >
                  <RotateCcw className="h-4 w-4" />
                  Resync
                </Button>
              )}
            </div>
          </div>
          {visibleIssues.length > 0 && (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {visibleIssues.map((issue) => (
                <li key={issue}>- {issue}</li>
              ))}
            </ul>
          )}
        </div>

        {isSuperAdmin && (
          <div className="rounded-lg border border-border p-4">
            <p className="mb-2 text-sm font-medium">Profil public (JSON)</p>
            <pre className="max-h-[360px] overflow-auto rounded-md bg-muted/40 p-3 text-xs">
              {JSON.stringify(data.providerDirectory || null, null, 2)}
            </pre>
          </div>
        )}

        {services.length > 0 && (
          <div className="rounded-lg border border-border p-4">
            <p className="mb-2 text-sm font-medium">Service IDs</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {services.map((service) => (
                <li key={service.serviceId}>
                  {service.name}: {service.serviceId}
                </li>
              ))}
            </ul>
          </div>
        )}

        {blockedDates.length > 0 && (
          <div className="rounded-lg border border-border p-4">
            <p className="mb-2 text-sm font-medium">Zile blocate ({blockedDates.length})</p>
            <div className="flex flex-wrap gap-2">
              {blockedDates.map((item) => (
                <span key={item.id} className="rounded-md bg-muted px-2 py-1 text-xs">
                  {item.dateKey}
                </span>
              ))}
            </div>
          </div>
        )}

        {auditEvents.length > 0 && (
          <div className="rounded-lg border border-border p-4">
            <p className="mb-2 text-sm font-medium">Evenimente audit</p>
            <div className="space-y-2">
              {auditEvents.map((event, index) => (
                <div key={String(event.eventId || index)} className="rounded-md bg-muted/30 p-3 text-xs">
                  <p className="font-medium">{readString(event.action) || "—"}</p>
                  <p className="text-muted-foreground">
                    Actor: {readString(event.actorUid) || "—"} · {formatAdminDateTime(event.createdAt)}
                  </p>
                  <p className="text-muted-foreground">
                    Resource: {readString(event.resourceType)} / {readString(event.resourceId)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {provider.professionalProfile?.avatarPath && (
          <FieldValue label="Avatar path" value={provider.professionalProfile.avatarPath} />
        )}
        {provider.documents?.identity?.storagePath && (
          <FieldValue label="Identity storage path" value={provider.documents.identity.storagePath} />
        )}
        {provider.documents?.professional?.storagePath && (
          <FieldValue label="Professional storage path" value={provider.documents.professional.storagePath} />
        )}
      </div>
    </details>
  );
}
