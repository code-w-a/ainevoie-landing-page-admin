"use client";

import { InputGroup } from "@/components/ui/input-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@/i18n/navigation";
import { passwordValidation } from "@/utils/validations";
import { integrations, messages } from "@integrations-config";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";

type Input = {
  email: string;
  password: string;
  keepSignedIn: boolean;
};

export function SignInForm() {
  const t = useTranslations("Auth");
  const {
    handleSubmit,
    control,
    register,
    reset,
    formState: { errors },
  } = useForm<Input>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(data: Input) {
    if (!integrations?.isAuthEnabled) {
      toast.error(messages?.auth);
      return;
    }

    signIn("credentials", { ...data, redirect: false }).then((callback) => {
      if (callback?.error) {
        toast.error(callback.error);
      }

      if (callback?.ok && !callback?.error) {
        toast.success(t("signInSuccess"));
        reset();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-5">
        <InputGroup
          type="email"
          label={t("emailLabel")}
          placeholder={t("emailPh")}
          errorMessages={errors?.email?.message}
          {...register("email", {
            required: true,
            validate: (value) => value.includes("@") || t("emailInvalid"),
          })}
        />
      </div>

      <div className="mb-6">
        <InputGroup
          type="password"
          label={t("passwordLabel")}
          placeholder={t("passwordPhSignIn")}
          errorMessages={errors?.password?.message}
          {...register("password", {
            required: true,
            validate: (value) =>
              passwordValidation(value) || t("passwordRule"),
          })}
        />
      </div>

      <div className="mb-[30px] flex flex-wrap justify-between">
        <Controller
          control={control}
          name="keepSignedIn"
          render={({ field }) => (
            <Checkbox
              label={t("keepSignedIn")}
              name={field.name}
              onChange={(e) => field.onChange(e.target.checked)}
              defaultChecked={field.value}
            />
          )}
        />

        <Link
          href="/auth/forget-password"
          className="text-primary hover:underline sm:text-right"
        >
          {t("forgotPassword")}
        </Link>
      </div>

      <button className="bg-primary hover:bg-primary/90 flex w-full justify-center rounded-md p-3 text-base font-medium text-white">
        {t("signInSubmit")}
      </button>
    </form>
  );
}
