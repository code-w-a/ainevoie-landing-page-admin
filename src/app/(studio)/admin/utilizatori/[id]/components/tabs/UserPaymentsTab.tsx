"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { UserPaymentItem } from "@/lib/adminUserDetail";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";

export function UserPaymentsTab({ payments }: { payments: UserPaymentItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plăți</CardTitle>
        <CardDescription>Plățile recente asociate programărilor utilizatorului.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Sumă</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Serviciu</TableHead>
              <TableHead>Metodă</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  Nu există plăți recente.
                </TableCell>
              </TableRow>
            )}
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{formatAdminDateTime(payment.at)}</TableCell>
                <TableCell>{payment.amountLabel}</TableCell>
                <TableCell>
                  <Badge variant={payment.statusVariant}>{payment.statusLabel}</Badge>
                </TableCell>
                <TableCell>{payment.serviceName}</TableCell>
                <TableCell>{payment.methodLabel}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
