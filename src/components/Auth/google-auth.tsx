"use client";

import { GoogleIcon } from "@/assets/icons";
import { signIn } from "next-auth/react";

type PropsType = {
  label: string;
};

export function GoogleAuth({ label }: PropsType) {
  return (
    <button
      onClick={() => signIn("google")}
      className="border-stroke text-body hover:text-primary dark:border-stroke-dark dark:bg-dark flex w-full items-center justify-center gap-3 rounded-md border bg-white p-3 text-base font-medium"
    >
      <GoogleIcon />

      <span>{label}</span>
    </button>
  );
}
