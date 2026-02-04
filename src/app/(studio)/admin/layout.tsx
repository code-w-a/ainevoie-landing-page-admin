import AdminGateShell from "@/components/admin/AdminGateShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminGateShell>{children}</AdminGateShell>;
}
