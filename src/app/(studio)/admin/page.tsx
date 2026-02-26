"use client";

import Link from "next/link";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAdminData } from "@/components/admin/useAdminData";
import {
  adminCommonLabels,
  campaignStatusLabel,
  logLevelLabel,
} from "@/lib/adminLabels";

type OverviewResponse = {
  stats: {
    activeSubscribers: number;
    unsubscribed: number;
    bounced: number;
    complaint: number;
    suppressed: number;
    campaignsSent: number;
    campaignsSentWithErrors: number;
  };
  campaigns: Array<any>;
  logs: Array<any>;
};

export default function AdminOverviewPage() {
  const { data, loading, error } =
    useAdminData<OverviewResponse>("/api/admin/newsletter/overview");

  const overviewStats = useMemo(() => {
    if (!data?.stats) {
      return [];
    }

    return [
      {
        label: "Abonați activi",
        value: data.stats.activeSubscribers,
        note: "eligibili la trimitere",
      },
      {
        label: "Dezabonați",
        value: data.stats.unsubscribed,
        note: "consimțământ retras",
      },
      {
        label: "Campanii trimise",
        value: `${data.stats.campaignsSent} (+${data.stats.campaignsSentWithErrors} cu erori)`,
        note: "istoric livrare",
      },
    ];
  }, [data]);

  const campaigns = data?.campaigns ?? [];
  const logs = data?.logs ?? [];
  const campaignNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const campaign of campaigns) {
      const id = typeof campaign?.id === "string" ? campaign.id : "";
      const label =
        (typeof campaign?.subject === "string" && campaign.subject.trim()) ||
        (typeof campaign?.name === "string" && campaign.name.trim()) ||
        "";
      if (id && label) {
        map.set(id, label);
      }
    }
    return map;
  }, [campaigns]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Sumar newsletter</h1>
          <p className="text-sm text-muted-foreground">
            Draft → Test → Schedule/Send → Report.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/campaigns">Campanie nouă</Link>
        </Button>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">
          {adminCommonLabels.loadingOverview}
        </p>
      )}
      {error && <p className="text-sm text-rose-500">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewStats.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-2xl">{item.value}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {item.note}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Campanii recente</CardTitle>
            <CardDescription>
              Ultimele campanii create, programate sau trimise.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanie</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Destinatari</TableHead>
                  <TableHead>Trimise</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => {
                  const status =
                    typeof campaign.status === "string" ?
                      campaign.status.toLowerCase() :
                      "";
                  const badgeVariant =
                    status === "sent" ?
                      "success" :
                      ["queued", "scheduled", "sending"].includes(status) ?
                        "warning" :
                        ["sent_with_errors", "failed", "canceled"].includes(status) ?
                          "danger" :
                          "outline";

                  return (
                    <TableRow key={campaign.id || campaign.name}>
                      <TableCell className="font-medium">
                        {campaign.subject || campaign.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant}>{campaignStatusLabel(campaign.status)}</Badge>
                      </TableCell>
                      <TableCell>{campaign.stats?.total ?? campaign.recipients ?? "-"}</TableCell>
                      <TableCell>{campaign.stats?.sent ?? campaign.sent ?? "-"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ultimele loguri</CardTitle>
            <CardDescription>Evenimente recente din pipeline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {logs.map((log, index) => (
              <div
                key={`${log.message || log.id}-${index}`}
                className="rounded-lg border border-border p-3"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {log.campaignId ?
                      campaignNameById.get(log.campaignId) || log.campaignId
                    : "General"}
                  </span>
                  <Badge variant={log.level === "error" ? "danger" : "secondary"}>
                    {logLevelLabel(log.level)}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{log.message}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {log.createdAt || ""}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
