"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import toast from "react-hot-toast";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getFirebaseAuth } from "@/lib/firebaseClient";

export default function AdminUserMenu() {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      setEmail(user?.email ?? null);
    });
    return () => unsub();
  }, []);

  async function handleSignOut() {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
      router.replace("/admin/login");
    } catch {
      toast.error("Nu am putut te deconecta. Încearcă din nou.");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1.5 text-sm"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              A
            </span>
            <span className="hidden text-xs text-muted-foreground md:block">
              Admin
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Admin</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setProfileOpen(true)}>
            <User className="mr-2 h-4 w-4" />
            Profil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => void handleSignOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Deconectare
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profil admin</DialogTitle>
            <DialogDescription>
              Datele contului tău de administrator.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 text-sm">
            <p>
              <span className="font-medium text-muted-foreground">Email: </span>
              {email ?? "—"}
            </p>
            <p className="text-muted-foreground">
              Ești autentificat cu un cont care are drepturi de administrator.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="default" onClick={() => setProfileOpen(false)}>
              Închide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
