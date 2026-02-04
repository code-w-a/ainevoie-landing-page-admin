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

export default function AdminOverviewPage() {
  const { data, loading, error } = useAdminData<{
    stats: {
      activeSubscribers: number;
      unsubscribed: number;
      campaignsSent: number;
      avgOpenRate: number;
    };
    campaigns: Array<any>;
    logs: Array<any>;
  }>("/api/admin/newsletter/overview");

  const overviewStats = useMemo(() => {
    if (!data?.stats) {
      return [];
    }
    return [
      {
        label: "Active subscribers",
        value: data.stats.activeSubscribers,
        change: "",
        note: "current",
      },
      {
        label: "Unsubscribed",
        value: data.stats.unsubscribed,
        change: "",
        note: "current",
      },
      {
        label: "Campaigns sent",
        value: data.stats.campaignsSent,
        change: "",
        note: "latest",
      },
      {
        label: "Avg. open rate",
        value: data.stats.avgOpenRate ? `${data.stats.avgOpenRate}%` : "N/A",
        change: "",
        note: "placeholder",
      },
    ];
  }, [data]);

  const campaigns = data?.campaigns ?? [];
  const logs = data?.logs ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Newsletter Overview</h1>
          <p className="text-sm text-muted-foreground">
            Rezumat rapid al performanței newsletterului.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/campaigns">New campaign</Link>
        </Button>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Loading overview...</p>
      )}
      {error && <p className="text-sm text-rose-500">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewStats.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-2xl">{item.value}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{item.note}</span>
              <span className="text-foreground">{item.change}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent campaigns</CardTitle>
            <CardDescription>Ultimele campanii trimise sau în pregătire.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id || campaign.name}>
                    <TableCell className="font-medium">
                      {campaign.subject || campaign.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          campaign.status === "sent" || campaign.status === "Sent"
                            ? "success"
                            : campaign.status === "queued" || campaign.status === "Queued"
                              ? "warning"
                              : "outline"
                        }
                      >
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{campaign.stats?.total ?? campaign.recipients ?? "-"}</TableCell>
                    <TableCell>{campaign.stats?.sent ?? campaign.sent ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest logs</CardTitle>
            <CardDescription>Ultimele evenimente de trimitere.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {logs.map((log, index) => (
              <div
                key={`${log.message || log.id}-${index}`}
                className="rounded-lg border border-border p-3"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{log.campaignId || "General"}</span>
                  <Badge
                    variant={log.level === "error" ? "danger" : "secondary"}
                  >
                    {log.level}
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
