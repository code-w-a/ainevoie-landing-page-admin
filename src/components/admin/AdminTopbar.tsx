"use client";

import { Search, Bell } from "lucide-react";

import AdminUserMenu from "@/components/admin/AdminUserMenu";
import { Input } from "@/components/ui/input";

export default function AdminTopbar() {
  return (
    <header className="border-b border-border bg-background/90 px-6 py-4 backdrop-blur md:px-8">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4">
        <div className="flex w-full max-w-md items-center gap-2 rounded-lg border border-border bg-background px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            className="border-none bg-transparent px-0 focus-visible:ring-0"
            placeholder="Căutare"
          />
        </div>

        <div className="flex items-center gap-3">
          <button className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:bg-muted">
            <Bell className="h-4 w-4" />
          </button>
          <AdminUserMenu />
        </div>
      </div>
    </header>
  );
}
