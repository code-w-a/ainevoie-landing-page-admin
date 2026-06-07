"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { BookingTimelineEvent } from "@/lib/adminBookingDetail";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";

export function BookingActivityTab({ timelineEvents }: { timelineEvents: BookingTimelineEvent[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activitate</CardTitle>
        <CardDescription>Evenimentele importante legate de această programare.</CardDescription>
      </CardHeader>
      <CardContent>
        {timelineEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nu există activitate recentă.</p>
        ) : (
          <div className="space-y-3">
            {timelineEvents.map((event) => (
              <div key={event.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{formatAdminDateTime(event.at)}</p>
                </div>
                {event.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
                )}
                {event.technicalAction && (
                  <p className="mt-2 text-xs text-muted-foreground/80">{event.technicalAction}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
