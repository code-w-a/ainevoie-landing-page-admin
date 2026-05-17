"use client";

import { useEffect, useMemo, useState } from "react";

type BulkDeleteFailure = {
  id: string;
  message: string;
};

export type AdminBulkDeleteResult = {
  successIds: string[];
  failures: BulkDeleteFailure[];
};

export function useAdminBulkSelection(pageIds: string[], resetDeps: unknown[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelectedIds(new Set());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps);

  const allSelected = useMemo(
    () => pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id)),
    [pageIds, selectedIds]
  );

  function toggleSelectAll(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        pageIds.forEach((id) => next.add(id));
      } else {
        pageIds.forEach((id) => next.delete(id));
      }
      return next;
    });
  }

  function toggleRow(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    allSelected,
    setSelectedIds,
    toggleSelectAll,
    toggleRow,
    clearSelection,
  };
}

export async function runAdminBulkDelete(
  ids: string[],
  deleteOne: (id: string) => Promise<{ ok: true } | { ok: false; message: string }>,
  concurrency = 4
): Promise<AdminBulkDeleteResult> {
  const queue = [...ids];
  const successIds: string[] = [];
  const failures: BulkDeleteFailure[] = [];
  const workers = Math.max(1, Math.min(concurrency, queue.length));

  await Promise.all(
    Array.from({ length: workers }).map(async () => {
      while (queue.length > 0) {
        const id = queue.shift();
        if (!id) {
          continue;
        }
        const result = await deleteOne(id);
        if (result.ok) {
          successIds.push(id);
        } else {
          failures.push({ id, message: result.message });
        }
      }
    })
  );

  return { successIds, failures };
}
