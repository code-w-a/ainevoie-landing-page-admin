"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldValue } from "@/app/(studio)/admin/prestatori/[id]/components/shared/FieldValue";
import {
  formatLegalConsentSource,
  getLegalConsentLabel,
  getLegalConsentVariant,
  type UserDocument,
} from "@/lib/adminUserDetail";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";

export function UserConsentsTab({ user }: { user: UserDocument }) {
  const consentVariant = getLegalConsentVariant(user.legalConsentState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consimțăminte</CardTitle>
        <CardDescription>Acceptările legale salvate la crearea contului.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FieldValue
          label="Termeni și condiții"
          value={formatAdminDateTime(user.termsAcceptedAt)}
        />
        <FieldValue label="Versiune termeni" value={user.termsVersion || "Nu este completat"} />
        <FieldValue
          label="Politică de confidențialitate"
          value={formatAdminDateTime(user.privacyAcceptedAt)}
        />
        <FieldValue label="Versiune politică" value={user.privacyVersion || "Nu este completat"} />
        <FieldValue
          label="Status consimțăminte"
          value={<Badge variant={consentVariant}>{getLegalConsentLabel(user.legalConsentState)}</Badge>}
        />
        <FieldValue
          label="Sursă acceptare"
          value={formatLegalConsentSource(user.legalConsentSource)}
        />
      </CardContent>
    </Card>
  );
}
