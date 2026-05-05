"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { InputGroup } from "@/components/ui/input-group";
import { Link } from "@/i18n/navigation";
import { passwordValidation } from "@/utils/validations";
import { integrations, messages } from "@integrations-config";
import axios, { AxiosError } from "axios";
import { useLocale, useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";

type Input = {
  fullName: string;
  email: string;
  password: string;
  privacyPolicy: boolean;
};

export function SignUpForm() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
  } = useForm<Input>();
  const privacyPolicyAccepted = watch("privacyPolicy");

  async function onSubmit({ privacyPolicy, ...payload }: Input) {
    if (!integrations?.isAuthEnabled) {
      toast.error(messages?.auth);
      return;
    }

    try {
      await axios.post(
        "/api/register",
        {
          ...payload,
          name: payload.fullName,
        },
        { headers: { "x-next-intl-locale": locale } }
      );

      toast.success(t("signUpSuccess"));
      reset();
    } catch (err) {
      const data =
        err instanceof AxiosError
          ? (err.response?.data as { error?: string } | undefined)
          : undefined;
      const serverMsg =
        typeof data?.error === "string" ? data.error : undefined;
      toast.error(serverMsg ?? t("signUpError"));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-5">
        <InputGroup
          label={t("fullNameLabel")}
          placeholder={t("fullNamePh")}
          required
          {...register("fullName", {
            required: t("fullNameRequired"),
          })}
          errorMessages={errors.fullName?.message}
        />
      </div>

      <div className="mb-5">
        <InputGroup
          type="email"
          label={t("emailLabel")}
          placeholder={t("emailPh")}
          required
          {...register("email", {
            required: t("emailRequired"),
            validate: (value) => value.includes("@") || t("emailInvalid"),
          })}
          errorMessages={errors.email?.message}
        />
      </div>

      <div className="mb-6">
        <InputGroup
          type="password"
          label={t("passwordLabel")}
          placeholder={t("passwordPhSignUp")}
          required
          {...register("password", {
            required: t("passwordRequired"),
            validate: (value) =>
              passwordValidation(value) || t("passwordRule"),
          })}
          errorMessages={errors.password?.message}
        />
      </div>

      <div className="mb-[30px]">
        <Controller
          control={control}
          name="privacyPolicy"
          rules={{ required: t("privacyRequired") }}
          render={({ field, fieldState }) => (
            <>
              <Checkbox
                name={field.name}
                onChange={(e) => field.onChange(e.target.checked)}
                defaultChecked={field.value}
                label={
                  <>
                    {t("privacyAgree")}{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {t("termsLink")}
                    </Link>
                    {t("andWith")}{" "}
                    <Link
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {t("privacyLink")}
                    </Link>
                  </>
                }
              />
              {fieldState.error && (
                <p className="mt-2 text-sm text-red-500">
                  {fieldState.error.message}
                </p>
              )}
            </>
          )}
        />
      </div>

      <button
        type="submit"
        disabled={!privacyPolicyAccepted}
        className="bg-primary hover:bg-primary/90 flex w-full justify-center rounded-md p-3 text-base font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {t("signUpSubmit")}
      </button>
    </form>
  );
}
