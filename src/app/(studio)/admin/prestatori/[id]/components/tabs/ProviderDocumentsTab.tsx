"use client";

import { FileCheck2, FileSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  canViewProviderDocument,
  formatCompactValue,
  formatReviewAction,
  getDocumentDisplayName,
  getDocumentMeta,
  getSimplifiedStatusLabel,
  getSimplifiedStatusVariant,
  type ProviderDocument,
  type ProviderDocumentFile,
  type ProviderDocumentType,
} from "@/lib/adminProviderDetail";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";
import { FieldValue } from "../shared/FieldValue";

export function ProviderDocumentsTab({
  provider,
  status,
  publicationLabel,
  publicationVariant,
  onViewDocument,
}: {
  provider: ProviderDocument;
  status: string;
  publicationLabel: string;
  publicationVariant: "success" | "outline";
  onViewDocument: (type: ProviderDocumentType, title: string) => void;
}) {
  const documents = [
    {
      type: "identity" as const,
      title: "Document identitate",
      doc: provider.documents?.identity,
    },
    {
      type: "professional" as const,
      title: "Document profesional",
      doc: provider.documents?.professional,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Documente</CardTitle>
          <CardDescription>Documentele încărcate de prestator.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {documents.map(({ type, title, doc }) => (
            <DocumentRow
              key={type}
              title={title}
              doc={doc}
              meta={getDocumentMeta(doc)}
              onView={() => onViewDocument(type, title)}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Publicare</CardTitle>
          <CardDescription>Statusul de publicare al prestatorului.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FieldValue
            label="Status"
            value={
              <Badge variant={getSimplifiedStatusVariant(status)}>
                {getSimplifiedStatusLabel(status)}
              </Badge>
            }
          />
          <FieldValue
            label="Ultima decizie"
            value={formatReviewAction(provider.adminReview?.action)}
          />
          <FieldValue
            label="Data ultimei decizii"
            value={formatAdminDateTime(provider.adminReview?.reviewedAt || provider.reviewState?.lastReviewedAt)}
          />
          <FieldValue
            label="Motiv"
            value={formatCompactValue(provider.adminReview?.reason || provider.suspension?.reason)}
          />
          <FieldValue
            label="Publicat la"
            value={formatAdminDateTime(provider.lastPublishedAt)}
          />
          <FieldValue
            label="Vizibilitate în aplicație"
            value={<Badge variant={publicationVariant}>{publicationLabel}</Badge>}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function DocumentRow({
  title,
  doc,
  meta,
  onView,
}: {
  title: string;
  doc?: ProviderDocumentFile | null;
  meta: ReturnType<typeof getDocumentMeta>;
  onView: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{getDocumentDisplayName(doc)}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Încărcat: {formatAdminDateTime(doc?.uploadedAt)}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Badge variant={meta.variant}>
          <FileCheck2 className="h-3.5 w-3.5" />
          {meta.label}
        </Badge>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canViewProviderDocument(doc)}
          onClick={onView}
        >
          <FileSearch className="h-4 w-4" />
          Vezi document
        </Button>
      </div>
    </div>
  );
}
