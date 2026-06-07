"use client";

import { AlertTriangle, CheckCircle2, CircleDashed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  checklistStateMeta,
  formatBooleanBadge,
  formatValue,
  getProviderLaunchContactConsentState,
  getProviderLegalConsentState,
  providerLegalStatusLabel,
  type ChecklistState,
  type ProviderDocument,
} from "@/lib/adminProviderDetail";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";
import { FieldValue } from "../shared/FieldValue";

type ChecklistItem = {
  title: string;
  detail: string;
  state: ChecklistState;
  badge: string;
};

export function ProviderVerificationTab({
  provider,
  checklist,
  locationLabel,
}: {
  provider: ProviderDocument;
  checklist: ChecklistItem[];
  locationLabel: string;
}) {
  const payoutDetails = provider.payoutDetails || null;
  const legalConsentState = getProviderLegalConsentState(provider);
  const legalConsentMeta =
    legalConsentState === "accepted"
      ? { label: "Acceptat", variant: "success" as const }
      : legalConsentState === "partial"
        ? { label: "Parțial", variant: "warning" as const }
        : { label: "Lipsă", variant: "outline" as const };
  const launchContactMeta =
    getProviderLaunchContactConsentState(provider) === "accepted"
      ? { label: "Da", variant: "success" as const }
      : getProviderLaunchContactConsentState(provider) === "declined"
        ? { label: "Nu", variant: "secondary" as const }
        : { label: "Lipsă", variant: "outline" as const };
  const accountantMeta = formatBooleanBadge(
    provider.hasAccountant === "yes" ? true : provider.hasAccountant === "no" ? false : null,
    { yes: "Da", no: "Nu", missing: provider.hasAccountant === "unsure" ? "Încă nu" : "Lipsă" }
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Checklist aprobare</CardTitle>
          <CardDescription>Elementele necesare înainte de aprobare.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {checklist.map((item) => {
            const meta = checklistStateMeta[item.state];
            const Icon =
              item.state === "complete" ? CheckCircle2 : item.state === "review" ? CircleDashed : AlertTriangle;
            return (
              <div key={item.title} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.iconClassName}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
                <Badge variant={item.state === "complete" ? "success" : item.state === "review" ? "warning" : meta.variant}>
                  {item.badge || meta.label}
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Date firmă și consimțăminte</CardTitle>
          <CardDescription>Informații juridice și acceptări legale.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FieldValue
            label="Statut juridic"
            value={
              provider.legalStatus
                ? providerLegalStatusLabel[provider.legalStatus] || provider.legalStatus
                : "Nu este completat"
            }
          />
          <FieldValue label="CUI" value={formatValue(provider.cui)} />
          <FieldValue label="Nr. Registrul Comerțului" value={formatValue(provider.tradeRegisterNumber)} />
          <FieldValue label="Denumire firmă" value={formatValue(provider.companyName || provider.professionalProfile?.businessName)} />
          <FieldValue label="Estimare înființare" value={formatValue(provider.estimatedSetupTimeline)} />
          <FieldValue label="Are contabil" value={<Badge variant={accountantMeta.variant}>{accountantMeta.label}</Badge>} />
          <FieldValue
            label="Termeni acceptați"
            value={formatAdminDateTime(provider.termsAcceptedAt)}
          />
          <FieldValue
            label="Politică acceptată"
            value={formatAdminDateTime(provider.privacyAcceptedAt)}
          />
          <FieldValue
            label="Status consimțăminte"
            value={<Badge variant={legalConsentMeta.variant}>{legalConsentMeta.label}</Badge>}
          />
          <FieldValue label="Acord contact lansare" value={<Badge variant={launchContactMeta.variant}>{launchContactMeta.label}</Badge>} />
          <FieldValue label="Județ / oraș" value={locationLabel} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Date bancare pentru plăți</CardTitle>
          <CardDescription>Informații folosite pentru transferul manual către prestator.</CardDescription>
        </CardHeader>
        <CardContent>
          {payoutDetails?.iban && payoutDetails?.accountHolderName && payoutDetails?.bankName ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FieldValue label="Titular cont" value={formatValue(payoutDetails.accountHolderName)} />
              <FieldValue label="Bancă" value={formatValue(payoutDetails.bankName)} />
              <FieldValue label="IBAN" value={formatValue(payoutDetails.iban)} />
              <FieldValue label="Actualizat la" value={formatAdminDateTime(payoutDetails.updatedAt)} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Prestatorul nu a salvat încă datele bancare pentru plăți.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
