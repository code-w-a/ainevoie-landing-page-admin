"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/components/admin/adminApi";

export function useAdminData<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminFetch(endpoint, { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Cererea a eșuat");
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError("Nu am putut încărca datele.");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}
