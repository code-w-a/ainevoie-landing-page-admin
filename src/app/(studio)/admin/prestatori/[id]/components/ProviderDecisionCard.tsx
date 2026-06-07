"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ProviderApprovalSummary } from "@/lib/adminProviderDetail";

export function ProviderDecisionCard({ summary }: { summary: ProviderApprovalSummary }) {
  const Icon = summary.canApprove ? CheckCircle2 : AlertTriangle;

  return (
    <Card
      className={
        summary.canApprove
          ? "border-emerald-200 bg-emerald-50/60"
          : "border-amber-200 bg-amber-50/60"
      }
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Icon
            className={`mt-0.5 h-6 w-6 shrink-0 ${
              summary.canApprove ? "text-emerald-600" : "text-amber-600"
            }`}
          />
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <h2 className="text-lg font-semibold">{summary.headline}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{summary.nextAction}</p>
            </div>
            {summary.missingItems.length > 0 && (
              <ul className="space-y-1.5 text-sm">
                {summary.missingItems.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
