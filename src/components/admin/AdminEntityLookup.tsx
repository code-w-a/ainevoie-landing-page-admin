"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LookupEntityType = "user" | "provider" | "admin" | "booking" | "supportTicket";

type LookupItem = {
  id: string;
  primaryText: string;
  secondaryText: string | null;
  secondaryId: string | null;
  entityType: LookupEntityType;
};

type LookupResponse = {
  items?: LookupItem[];
};

type AdminEntityLookupProps = {
  value: string;
  onValueChange: (nextValue: string, item?: LookupItem | null) => void;
  entityType: LookupEntityType | LookupEntityType[];
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
};

function readLabel(item: LookupItem) {
  const secondary = item.secondaryText || item.secondaryId || "";
  return secondary ? `${item.primaryText} · ${secondary}` : item.primaryText;
}

export function AdminEntityLookup({
  value,
  onValueChange,
  entityType,
  placeholder = "Caută după nume, email, telefon sau ID",
  disabled,
  allowClear = true,
}: AdminEntityLookupProps) {
  const [query, setQuery] = useState(value || "");
  const [items, setItems] = useState<LookupItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedItemRef = useRef<LookupItem | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const entityTypeParam = useMemo(
    () => (Array.isArray(entityType) ? entityType.join(",") : entityType),
    [entityType]
  );

  useEffect(() => {
    if (!wrapperRef.current) {
      return;
    }

    function onMouseDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  useEffect(() => {
    if (value && selectedItemRef.current?.id === value) {
      setQuery(readLabel(selectedItemRef.current));
      return;
    }

    if (!value) {
      selectedItemRef.current = null;
      setQuery("");
      return;
    }

    setQuery(value);

    let cancelled = false;
    void (async () => {
      try {
        const response = await adminFetch(
          `/api/admin/lookups?entityType=${encodeURIComponent(entityTypeParam)}&id=${encodeURIComponent(value)}&limit=1`,
          { cache: "no-store" }
        );
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as LookupResponse;
        const resolved = Array.isArray(payload.items)
          ? payload.items.find((item) => item.id === value) || payload.items[0]
          : null;
        if (cancelled || !resolved) {
          return;
        }
        selectedItemRef.current = resolved;
        setQuery(readLabel(resolved));
      } catch {
        // leave raw value as fallback
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [entityTypeParam, value]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminFetch(
          `/api/admin/lookups?entityType=${encodeURIComponent(entityTypeParam)}&q=${encodeURIComponent(trimmedQuery)}&limit=8`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error(await readAdminResponseError(response, "Lookup indisponibil."));
        }

        const payload = (await response.json()) as LookupResponse;
        setItems(Array.isArray(payload.items) ? payload.items : []);
        setOpen(true);
      } catch (err) {
        setItems([]);
        setError(err instanceof Error ? err.message : "Lookup indisponibil.");
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [entityTypeParam, query]);

  function selectItem(item: LookupItem) {
    selectedItemRef.current = item;
    setQuery(readLabel(item));
    onValueChange(item.id, item);
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 pr-9"
          placeholder={placeholder}
          value={query}
          disabled={disabled}
          onFocus={() => {
            if (items.length || error) {
              setOpen(true);
            }
          }}
          onChange={(event) => {
            const nextValue = event.target.value;
            setQuery(nextValue);
            if (selectedItemRef.current && nextValue !== readLabel(selectedItemRef.current)) {
              selectedItemRef.current = null;
              onValueChange("");
            }
          }}
        />
        {allowClear && value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-7 w-7"
            disabled={disabled}
            onClick={() => {
              selectedItemRef.current = null;
              setQuery("");
              setItems([]);
              setOpen(false);
              onValueChange("");
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-30 max-h-64 overflow-y-auto rounded-md border border-border bg-background shadow-lg">
          <div className="border-b border-border px-3 py-2 text-xs text-muted-foreground">
            {loading
              ? "Caut..."
              : error
                ? error
                : items.length
                  ? `${items.length} rezultate`
                  : "Niciun rezultat"}
          </div>

          {items.map((item) => (
            <button
              type="button"
              key={`${item.entityType}:${item.id}`}
              className="block w-full px-3 py-2 text-left hover:bg-muted"
              onClick={() => selectItem(item)}
            >
              <p className="truncate text-sm font-medium">{item.primaryText}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[item.secondaryText, item.secondaryId || item.id].filter(Boolean).join(" · ")}
              </p>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
