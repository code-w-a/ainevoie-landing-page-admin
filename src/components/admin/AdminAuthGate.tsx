"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { getFirebaseAuth } from "@/lib/firebaseClient";
import { adminFetch } from "@/components/admin/adminApi";

export default function AdminAuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (pathname === "/admin/login") {
        setReady(true);
        return;
      }

      if (!user) {
        router.replace("/admin/login");
        return;
      }

      const res = await adminFetch("/api/admin/auth/session");
      if (!res.ok) {
        await signOut(auth);
        router.replace("/admin/login");
        return;
      }

      setReady(true);
    });

    return () => unsub();
  }, [router, pathname]);

  if (!ready && pathname !== "/admin/login") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Verific sesiunea...
      </div>
    );
  }

  return <>{children}</>;
}
