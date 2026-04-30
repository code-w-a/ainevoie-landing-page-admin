"use client";

import { usePathname } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import AdminAuthGate from "@/components/admin/AdminAuthGate";

export default function AdminGateShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <AdminAuthGate>
      <AdminShell>{children}</AdminShell>
    </AdminAuthGate>
  );
}
