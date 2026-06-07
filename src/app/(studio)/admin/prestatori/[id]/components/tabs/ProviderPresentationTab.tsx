"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCurrency,
  formatValue,
  getCoverageText,
  getDisplayName,
  getLocationLabel,
  getSpecialization,
  readNumber,
  readString,
  type ProviderDocument,
} from "@/lib/adminProviderDetail";
import { AvatarPreview } from "../shared/AvatarPreview";
import { FieldValue } from "../shared/FieldValue";

export function ProviderPresentationTab({
  provider,
  providerDirectory,
  avatarPreviewUrl,
  avatarPreviewLoading,
}: {
  provider: ProviderDocument;
  providerDirectory?: Record<string, unknown> | null;
  avatarPreviewUrl: string | null;
  avatarPreviewLoading: boolean;
}) {
  const displayName = getDisplayName(provider);
  const profile = provider.professionalProfile || {};
  const specialization = getSpecialization(provider);
  const locationLabel = getLocationLabel(provider);
  const coverageText = getCoverageText(provider);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prezentare publică</CardTitle>
          <CardDescription>Informațiile pe care le văd clienții în aplicație.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
          <div>
            <AvatarPreview
              src={avatarPreviewUrl}
              loading={avatarPreviewLoading}
              name={displayName}
            />
            {avatarPreviewUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() => window.open(avatarPreviewUrl, "_blank", "noopener,noreferrer")}
              >
                <ExternalLink className="h-4 w-4" />
                Deschide imaginea
              </Button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldValue label="Nume public" value={formatValue(profile.displayName || readString(providerDirectory?.displayName))} />
            <FieldValue label="Categorie" value={formatValue(readString(providerDirectory?.categoryPrimary) || specialization)} />
            <FieldValue label="Localitate" value={locationLabel} />
            <FieldValue label="Zonă" value={formatValue(readString(providerDirectory?.coverageAreaText) || coverageText)} />
            <FieldValue
              label="Tarif"
              value={formatCurrency(
                readNumber(providerDirectory?.baseRateAmount) ?? profile.baseRateAmount,
                readString(providerDirectory?.baseRateCurrency) || profile.baseRateCurrency
              )}
            />
            <FieldValue
              label="Program"
              value={formatValue(readString(providerDirectory?.availabilitySummary) || profile.availabilitySummary)}
            />
            <div className="sm:col-span-2">
              <FieldValue label="Descriere" value={formatValue(profile.shortBio)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
