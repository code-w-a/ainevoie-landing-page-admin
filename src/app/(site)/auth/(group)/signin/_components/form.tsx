"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { InputGroup } from "@/components/ui/input-group";
import { passwordValidation } from "@/utils/validations";
import { integrations, messages } from "@integrations-config";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";

type Input = {
  email: string;
  password: string;
  keepSignedIn: boolean;
};

export function SignInForm() {
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
        toast.success("Te-ai autentificat cu succes");
        reset();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-5">
        <InputGroup
          type="email"
          label="Email"
          placeholder="Introdu adresa de email"
          errorMessages={errors?.email?.message}
          {...register("email", {
            required: true,
            validate: (value) => value.includes("@") || "Adresă de email invalidă",
          })}
        />
      </div>

      <div className="mb-6">
        <InputGroup
          type="password"
          label="Parolă"
          placeholder="Introdu parola"
          errorMessages={errors?.password?.message}
          {...register("password", {
            required: true,
            validate: (value) =>
              passwordValidation(value) ||
              "Parola trebuie să conțină cel puțin o literă mare, o literă mică, o cifră și un caracter special",
          })}
        />
      </div>

      <div className="mb-[30px] flex flex-wrap justify-between">
        <Controller
          control={control}
          name="keepSignedIn"
          render={({ field }) => (
            <Checkbox
              label="Păstrează-mă autentificat"
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
          Ai uitat parola?
        </Link>
      </div>

      <button className="bg-primary hover:bg-primary/90 flex w-full justify-center rounded-md p-3 text-base font-medium text-white">
        Intră în cont
      </button>
    </form>
  );
}
