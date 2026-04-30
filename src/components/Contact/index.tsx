"use client";

import { FormEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";

const CONTACT_REQUEST_TIMEOUT_MS = 30000;

const Contact = () => {
  const t = useTranslations("Contact");
  const locale = useLocale();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      company: String(formData.get("company") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      message: String(formData.get("message") || "").trim(),
      locale,
    };

    if (!payload.name) {
      setStatus("error");
      setError(t("nameRequired"));
      toast.error(t("nameRequired"));
      return;
    }
    if (!payload.email) {
      setStatus("error");
      setError(t("emailRequired"));
      toast.error(t("emailRequired"));
      return;
    }
    if (!payload.email.includes("@")) {
      setStatus("error");
      setError(t("emailInvalid"));
      toast.error(t("emailInvalid"));
      return;
    }
    if (!payload.message) {
      setStatus("error");
      setError(t("messageRequired"));
      toast.error(t("messageRequired"));
      return;
    }

    const form = event.currentTarget;
    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => {
      abortController.abort();
    }, CONTACT_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        const message =
          typeof body?.error === "string" && body.error.trim()
            ? body.error
            : t("sendError");
        setStatus("error");
        setError(message);
        toast.error(message);
        return;
      }

      form.reset();
      setStatus("sent");
      toast.success(t("sendSuccess"));
    } catch {
      setStatus("error");
      setError(t("sendError"));
      toast.error(t("sendError"));
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  return (
    <>
      <section id="support" className="pt-[100px] pb-[110px]">
        <div className="container">
          <div
            className="wow fadeInUp mx-auto mb-10 max-w-[690px] text-center"
            data-wow-delay=".2s"
          >
            <h2 className="mb-4 text-3xl font-bold text-black sm:text-4xl md:text-[44px] md:leading-tight dark:text-white">
              {t("title")}
            </h2>
            <p className="text-body text-base">{t("subtitle")}</p>
          </div>
        </div>

        <div className="container">
          <div
            className="wow fadeInUp shadow-card dark:shadow-card-dark mx-auto w-full max-w-[925px] rounded-lg bg-[#F8FAFB] px-8 py-10 sm:px-10 dark:bg-[#15182B]"
            data-wow-delay=".3s"
          >
            <form onSubmit={handleSubmit}>
              <div className="-mx-[22px] flex flex-wrap">
                <div className="w-full px-[22px] md:w-1/2">
                  <div className="mb-8">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      placeholder={t("namePh")}
                      required
                      className="border-stroke text-body focus:border-primary dark:focus:border-primary w-full rounded-sm border bg-white px-[30px] py-4 text-base outline-hidden dark:border-[#34374A] dark:bg-[#2A2E44]"
                    />
                  </div>
                </div>

                <div className="w-full px-[22px] md:w-1/2">
                  <div className="mb-8">
                    <input
                      type="text"
                      name="company"
                      id="company"
                      placeholder={t("companyPh")}
                      className="border-stroke text-body focus:border-primary dark:focus:border-primary w-full rounded-sm border bg-white px-[30px] py-4 text-base outline-hidden dark:border-[#34374A] dark:bg-[#2A2E44]"
                    />
                  </div>
                </div>

                <div className="w-full px-[22px] md:w-1/2">
                  <div className="mb-8">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      placeholder={t("emailPh")}
                      required
                      className="border-stroke text-body focus:border-primary dark:focus:border-primary w-full rounded-sm border bg-white px-[30px] py-4 text-base outline-hidden dark:border-[#34374A] dark:bg-[#2A2E44]"
                    />
                  </div>
                </div>

                <div className="w-full px-[22px] md:w-1/2">
                  <div className="mb-8">
                    <input
                      type="text"
                      name="phone"
                      id="phone"
                      placeholder={t("phonePh")}
                      className="border-stroke text-body focus:border-primary dark:focus:border-primary w-full rounded-sm border bg-white px-[30px] py-4 text-base outline-hidden dark:border-[#34374A] dark:bg-[#2A2E44]"
                    />
                  </div>
                </div>

                <div className="w-full px-[22px]">
                  <div className="mb-8">
                    <textarea
                      rows={6}
                      name="message"
                      id="message"
                      placeholder={t("messagePh")}
                      required
                      className="border-stroke text-body focus:border-primary dark:focus:border-primary w-full rounded-sm border bg-white px-[30px] py-4 text-base outline-hidden dark:border-[#34374A] dark:bg-[#2A2E44]"
                    ></textarea>
                  </div>
                </div>

                <div className="w-full px-[22px]">
                  <div className="text-center">
                    <p className="text-body mb-5 text-center text-base">
                      {t("consent")}
                    </p>
                    <button
                      type="submit"
                      disabled={status === "sending"}
                      className="bg-primary hover:bg-primary/90 inline-block rounded-md px-11 py-[14px] text-base font-medium text-white"
                    >
                      {status === "sending" ? t("sending") : t("submit")}
                    </button>
                    {status === "sent" && (
                      <p className="mt-4 text-sm font-medium text-green-600 dark:text-green-400">
                        {t("sendSuccess")}
                      </p>
                    )}
                    {status === "error" && error && (
                      <p className="mt-4 text-sm font-medium text-red-600 dark:text-red-400">
                        {error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;
