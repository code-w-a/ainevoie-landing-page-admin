"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import Image from "next/image";
import Link from "next/link";

import { getFirebaseAuth } from "@/lib/firebaseClient";
import { adminFetch, readAdminResponseError } from "@/components/admin/adminApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get("reason");
    if (reason === "forbidden") {
      setError("Contul autentificat nu are drepturi de admin.");
    }
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
      const session = await adminFetch("/api/admin/auth/session");
      if (!session.ok) {
        await signOut(auth);
        setError(
          await readAdminResponseError(
            session,
            "Contul nu are drepturi de admin."
          )
        );
        return;
      }
      router.replace("/admin");
    } catch (err) {
      setError("Autentificare eșuată. Verifică email și parola.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4">
          <Link href="/" className="mx-auto block w-fit" aria-label="Acasă">
            <Image
              width={190}
              height={40}
              src="/images/logo/logo.svg"
              alt="AInevoie"
              priority
              className="block dark:hidden"
              style={{ width: "auto", height: "auto" }}
            />
            <Image
              width={190}
              height={40}
              src="/images/logo/logo-white.svg"
              alt="AInevoie"
              priority
              className="hidden dark:block"
              style={{ width: "auto", height: "auto" }}
            />
          </Link>

          <div className="space-y-1 text-center">
            <CardTitle>Autentificare admin</CardTitle>
            <p className="text-sm text-muted-foreground">
              Intră în panoul de administrare.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="admin@ainevoie.ro"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Parolă</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error && <p className="text-sm text-rose-500">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Se autentifică..." : "Autentificare"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
