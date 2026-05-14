"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAdminData } from "@/components/admin/useAdminData";
import { AdminTableSkeleton } from "@/components/admin/AdminSkeletonLayouts";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type LegalConsentState = "accepted" | "partial" | "missing";

type UserListItem = {
  userId?: string;
  id?: string;
  accountStatus?: string | null;
  displayName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  locale?: string | null;
  primaryLocationLabel?: string | null;
  legalConsentState?: LegalConsentState | string | null;
  createdAt?: string | null;
  lastLoginAt?: string | null;
};

type UsersResponse = {
  total?: number;
  items: UserListItem[];
};

function getUserId(item: UserListItem) {
  return item.userId || item.id || "";
}

function getLegalConsentMeta(state?: string | null) {
  if (state === "accepted") {
    return { label: "Acceptat", variant: "success" as const };
  }
  if (state === "partial") {
    return { label: "Parțial", variant: "warning" as const };
  }
  return { label: "Lipsă", variant: "outline" as const };
}

function getAccountStatusMeta(status?: string | null) {
  if (status === "disabled") {
    return { label: "Dezactivat", variant: "danger" as const };
  }
  return { label: "Activ", variant: "success" as const };
}

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(timer);
  }, [q]);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", "100");
    if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
    return `/api/admin/users?${params.toString()}`;
  }, [debouncedQ]);

  const { data, loading, error } = useAdminData<UsersResponse>(endpoint);
  const items = data?.items || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Utilizatori</h1>
        <p className="text-sm text-muted-foreground">
          Conturi de tip utilizator și statusul consimțămintelor legale.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Căutare</CardTitle>
          <CardDescription>Caută după nume, email, telefon, locație sau ID.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Căutare utilizator"
            value={q}
            disabled={loading}
            onChange={(event) => setQ(event.target.value)}
          />
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => setQ("")}
          >
            Resetează
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista utilizatori</CardTitle>
          <CardDescription>{data?.total ?? items.length} rezultate</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-sm text-rose-500">{error}</p>}

          {loading ?
            <AdminTableSkeleton rows={10} columns={7} />
          : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilizator</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status cont</TableHead>
                  <TableHead>Consimțăminte</TableHead>
                  <TableHead>Locație</TableHead>
                  <TableHead>Activitate</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                      Nu există utilizatori pentru filtrele curente.
                    </TableCell>
                  </TableRow>
                )}
                {items.map((item) => {
                  const userId = getUserId(item);
                  const legalMeta = getLegalConsentMeta(item.legalConsentState);
                  const accountMeta = getAccountStatusMeta(item.accountStatus);

                  return (
                    <TableRow key={userId || item.email || item.phoneNumber}>
                      <TableCell>
                        <div className="font-medium">{item.displayName || userId || "-"}</div>
                        <div className="text-xs text-muted-foreground">{userId || "-"}</div>
                      </TableCell>
                      <TableCell>
                        <div>{item.email || "-"}</div>
                        <div className="text-xs text-muted-foreground">{item.phoneNumber || "-"}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={accountMeta.variant}>{accountMeta.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={legalMeta.variant}>{legalMeta.label}</Badge>
                      </TableCell>
                      <TableCell>{item.primaryLocationLabel || "-"}</TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          <div>Creat: {formatAdminDateTime(item.createdAt)}</div>
                          <div>Login: {formatAdminDateTime(item.lastLoginAt)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" asChild disabled={!userId}>
                          <Link href={`/admin/utilizatori/${userId}`}>
                            <FileText className="mr-2 h-4 w-4" />
                            Detalii
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          }
        </CardContent>
      </Card>
    </div>
  );
}
