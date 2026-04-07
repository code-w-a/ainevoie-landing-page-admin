"use client";
import { RightArrowIcon } from "@/assets/icons";
import { integrations, messages } from "@integrations-config";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { InputGroup } from "../ui/input-group";

type Input = {
  email: string;
};

export function MagicLinkForm() {
  const t = useTranslations("Auth");
  const { register, handleSubmit, formState, reset } = useForm<Input>();

  async function onSubmit(data: Input) {
    if (!integrations?.isAuthEnabled) {
      toast.error(messages?.auth);
      return;
    }

    signIn("email", {
      redirect: false,
      email: data?.email,
    })
      .then((callback) => {
        if (callback?.ok) {
          toast.success(t("magicLinkSent"));
          reset();
        }
      })
      .catch((error) => {
        toast.error(error);
      });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <InputGroup
        type="email"
        placeholder={t("magicEmailPh")}
        {...register("email", {
          required: true,
          validate: (value) => value.includes("@") || t("emailInvalid"),
        })}
        errorMessages={formState.errors.email?.message}
      />

      <button className="mx-auto mt-6 flex items-center justify-center gap-2.5 rounded-full bg-black px-6 py-3 font-medium text-white duration-300 ease-in-out hover:bg-[#2C3149] dark:bg-[#292E45] dark:hover:bg-[#2C3149]">
        {t("magicLinkSubmit")}
        <RightArrowIcon aria-hidden />
      </button>
    </form>
  );
}
