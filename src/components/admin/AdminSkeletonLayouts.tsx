import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

type AdminTableSkeletonProps = {
  rows?: number;
  columns?: number;
};

export function AdminTableSkeleton({ rows = 8, columns = 4 }: AdminTableSkeletonProps) {
  const safeRows = Math.min(50, Math.max(1, rows));
  const safeCols = Math.min(12, Math.max(1, columns));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({ length: safeCols }).map((_, colIndex) => (
            <TableHead key={colIndex}>
              <Skeleton className="h-4 w-24" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: safeRows }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: safeCols }).map((_, colIndex) => (
              <TableCell key={colIndex}>
                <Skeleton
                  className={`h-4 ${colIndex === 0 ? "w-[min(100%,14rem)]" : "w-16"}`}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

type AdminStatCardsSkeletonProps = {
  count?: number;
};

export function AdminStatCardsSkeleton({ count = 4 }: AdminStatCardsSkeletonProps) {
  const n = Math.min(8, Math.max(1, count));
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: n }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-2 h-8 w-20" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-3 w-full max-w-[12rem]" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

type AdminLogStackSkeletonProps = {
  lines?: number;
};

/** Skeleton blocks similar to stacked log entries in overview / side panels. */
export function AdminLogStackSkeleton({ lines = 5 }: AdminLogStackSkeletonProps) {
  const n = Math.min(12, Math.max(1, lines));
  return (
    <div className="space-y-3">
      {Array.from({ length: n }).map((_, index) => (
        <div key={index} className="rounded-lg border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
          </div>
          <Skeleton className="mt-2 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-2/3" />
          <Skeleton className="mt-2 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

type AdminFormGridSkeletonProps = {
  fields?: number;
};

/** Two-column-ish grid of label + input placeholders (settings-style forms). */
export function AdminFormGridSkeleton({ fields = 6 }: AdminFormGridSkeletonProps) {
  const n = Math.min(20, Math.max(2, fields));
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: n }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

type AdminPageHeaderSkeletonProps = {
  showAction?: boolean;
};

export function AdminPageHeaderSkeleton({ showAction = true }: AdminPageHeaderSkeletonProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      {showAction ? <Skeleton className="h-9 w-36 shrink-0" /> : null}
    </div>
  );
}

type AdminKpiRowSkeletonProps = {
  count?: number;
};

/** Small KPI / stat boxes (e.g. raport campanie). */
export function AdminKpiRowSkeleton({ count = 5 }: AdminKpiRowSkeletonProps) {
  const n = Math.min(8, Math.max(1, count));
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: n }).map((_, index) => (
        <div key={index} className="space-y-2 rounded-md border p-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-14" />
        </div>
      ))}
    </div>
  );
}
