"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatAvailabilityDayLine,
  formatCurrency,
  formatServiceStatus,
  getServiceStatusVariant,
  type ProviderAvailabilityDay,
  type ProviderServiceItem,
} from "@/lib/adminProviderDetail";

export function ProviderServicesScheduleTab({
  services,
  availabilityDays,
  blockedDatesCount,
}: {
  services: ProviderServiceItem[];
  availabilityDays: ProviderAvailabilityDay[];
  blockedDatesCount: number;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Servicii</CardTitle>
          <CardDescription>Serviciile oferite de prestator.</CardDescription>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nu există servicii configurate.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nume serviciu</TableHead>
                  <TableHead>Tarif</TableHead>
                  <TableHead>Durată</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.serviceId}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>
                      {service.baseRateAmount
                        ? `${formatCurrency(service.baseRateAmount, service.baseRateCurrency)} / oră`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {service.estimatedDurationMinutes
                        ? `${service.estimatedDurationMinutes} min`
                        : "La rezervare"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getServiceStatusVariant(service.status)}>
                        {formatServiceStatus(service.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Program săptămânal</CardTitle>
          <CardDescription>Disponibilitatea prestatorului pe zile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {availabilityDays.length === 0 ? (
            <p className="text-sm text-muted-foreground">Programul nu este configurat.</p>
          ) : (
            <div className="space-y-2">
              {availabilityDays.map((day) => (
                <p key={day.dayKey} className="text-sm">
                  {formatAvailabilityDayLine(day)}
                </p>
              ))}
            </div>
          )}
          {blockedDatesCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {blockedDatesCount} {blockedDatesCount === 1 ? "zi blocată" : "zile blocate"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
