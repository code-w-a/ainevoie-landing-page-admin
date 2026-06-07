"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldValue } from "@/app/(studio)/admin/prestatori/[id]/components/shared/FieldValue";
import { formatValue, type UserDocument } from "@/lib/adminUserDetail";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";

export function UserPresentationTab({ user }: { user: UserDocument }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Prezentare</CardTitle>
        <CardDescription>Informațiile principale ale utilizatorului.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FieldValue label="Nume" value={formatValue(user.displayName)} />
        <FieldValue label="Email" value={formatValue(user.email)} />
        <FieldValue label="Telefon" value={formatValue(user.phoneNumber)} />
        <FieldValue
          label="Adresă / localitate"
          value={formatValue(user.primaryLocation?.formattedAddress)}
        />
        <FieldValue label="Limbă" value={formatValue(user.locale)} />
        <FieldValue label="Cont creat la" value={formatAdminDateTime(user.createdAt)} />
        <FieldValue label="Ultimul login" value={formatAdminDateTime(user.lastLoginAt)} />
      </CardContent>
    </Card>
  );
}
