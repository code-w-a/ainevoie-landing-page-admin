"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAdminData } from "@/components/admin/useAdminData";
import { adminFetch } from "@/components/admin/adminApi";

export default function SettingsPage() {
  const { data, loading, error, reload } = useAdminData<{
    item: Record<string, any> | null;
  }>("/api/admin/newsletter/settings");
  const [formState, setFormState] = useState({
    fromName: "",
    fromEmail: "",
    replyTo: "",
    baseUrl: "",
    maxPerSecond: "",
    maxConcurrent: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.item) {
      setFormState({
        fromName: data.item.fromName || "",
        fromEmail: data.item.fromEmail || "",
        replyTo: data.item.replyTo || "",
        baseUrl: data.item.baseUrl || "",
        maxPerSecond: data.item.maxPerSecond?.toString() || "",
        maxConcurrent: data.item.maxConcurrent?.toString() || "",
      });
    }
  }, [data]);

  async function handleSave() {
    setSaving(true);
    try {
      await adminFetch("/api/admin/newsletter/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formState,
          maxPerSecond: Number(formState.maxPerSecond || 0),
          maxConcurrent: Number(formState.maxConcurrent || 0),
        }),
      });
      reload();
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configurații de bază pentru newsletter.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sender profile</CardTitle>
          <CardDescription>Datele folosite la trimitere.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {loading && (
            <p className="text-sm text-muted-foreground">Loading settings...</p>
          )}
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <div className="space-y-2">
            <label className="text-sm font-medium">From name</label>
            <Input
              placeholder="AInevoie"
              value={formState.fromName}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  fromName: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">From email</label>
            <Input
              placeholder="contact@ainevoie.ro"
              value={formState.fromEmail}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  fromEmail: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reply-to</label>
            <Input
              placeholder="support@ainevoie.ro"
              value={formState.replyTo}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  replyTo: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Public base URL</label>
            <Input
              placeholder="https://ainevoie.ro"
              value={formState.baseUrl}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  baseUrl: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Max per second</label>
            <Input
              placeholder="5"
              value={formState.maxPerSecond}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  maxPerSecond: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Max concurrent</label>
            <Input
              placeholder="50"
              value={formState.maxConcurrent}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  maxConcurrent: event.target.value,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </div>
  );
}
