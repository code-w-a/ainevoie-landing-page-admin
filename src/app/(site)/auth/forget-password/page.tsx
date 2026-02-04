"use client";

import { integrations, messages } from "@integrations-config";
import axios, { AxiosError } from "axios";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

export default function Page() {
  const [isLoading, setIsLoading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function onSubmit() {
    if (!integrations?.isAuthEnabled) {
      toast.error(messages?.auth);
      return;
    }

    if (!ref.current) return;

    setIsLoading(true);

    const data = { email: ref.current.value };

    try {
      const res = await axios.post("/api/forget-password/reset", data);

      toast.success(res.data);
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 404) {
          toast.error("Utilizatorul nu a fost găsit.");
        } else {
          toast.error("A apărut o eroare. Încearcă din nou.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="pt-[150px] pb-[110px] lg:pt-[220px]">
      <div className="container overflow-hidden lg:max-w-[1250px]">
        <div className="shadow-card dark:shadow-card-dark mx-auto w-full max-w-[520px] rounded-lg bg-[#F8FAFB] px-6 py-10 sm:p-[50px] dark:bg-[#15182A]">
          <div className="text-center">
            <h3 className="mb-[10px] text-2xl font-bold text-black sm:text-[28px] dark:text-white">
              Ai uitat parola?
            </h3>

            <p className="text-body mb-11 text-base">
              Introdu adresa de email asociată contului, iar noi îți trimitem un
              link pentru resetarea parolei.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            <div className="mb-5">
              <label
                htmlFor="email"
                className="mb-[10px] block text-sm text-black dark:text-white"
              >
                Email
              </label>

              <input
                ref={ref}
                type="email"
                placeholder="Introdu adresa de email"
                className="border-stroke text-body focus:border-primary focus:shadow-input dark:border-stroke-dark dark:focus:border-primary w-full rounded-md border bg-white px-6 py-3 text-base font-medium outline-hidden disabled:opacity-40 dark:bg-black dark:text-white"
                disabled={isLoading}
                required
              />
            </div>

            <button
              className="bg-primary hover:bg-primary/90 flex w-full justify-center rounded-md p-3 text-base font-medium text-white disabled:opacity-40"
              disabled={isLoading}
            >
              Trimite link-ul de resetare
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
