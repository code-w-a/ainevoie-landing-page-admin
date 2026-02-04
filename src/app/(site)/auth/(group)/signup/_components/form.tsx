import { Checkbox } from "@/components/ui/checkbox";
import { InputGroup } from "@/components/ui/input-group";
import { passwordValidation } from "@/utils/validations";
import { integrations, messages } from "@integrations-config";
import axios from "axios";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";

type Input = {
  fullName: string;
  email: string;
  password: string;
  privacyPolicy: boolean;
};

export function SignUpForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<Input>();

  async function onSubmit({ privacyPolicy, ...payload }: Input) {
    if (!integrations?.isAuthEnabled) {
      toast.error(messages?.auth);
      return;
    }

    try {
      await axios.post("/api/register", {
        ...payload,
        name: payload.fullName,
      });

      toast.success("Contul a fost creat cu succes");
      reset();
    } catch (error) {
      toast.error("A apărut o eroare. Încearcă din nou.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-5">
        <InputGroup
          label="Nume complet"
          placeholder="Nume și prenume"
          required
          {...register("fullName", { required: "Numele complet este obligatoriu" })}
          errorMessages={errors.fullName?.message}
        />
      </div>

      <div className="mb-5">
        <InputGroup
          type="email"
          label="Email"
          placeholder="Introdu adresa de email"
          required
          {...register("email", {
            required: "Emailul este obligatoriu",
            validate: (value) => value.includes("@") || "Adresă de email invalidă",
          })}
          errorMessages={errors.email?.message}
        />
      </div>

      <div className="mb-6">
        <InputGroup
          type="password"
          label="Parolă"
          placeholder="Alege o parolă"
          required
          {...register("password", {
            required: "Parola este obligatorie",
            validate: (value) =>
              passwordValidation(value) ||
              "Parola trebuie să conțină cel puțin o literă mare, o literă mică, o cifră și un caracter special",
          })}
          errorMessages={errors.password?.message}
        />
      </div>

      <div className="mb-[30px]">
        <Controller
          control={control}
          name="privacyPolicy"
          rules={{ required: "Trebuie să fii de acord cu termenii și condițiile" }}
          render={({ field, fieldState }) => (
            <>
              <Checkbox
                name={field.name}
                onChange={(e) => field.onChange(e.target.checked)}
                defaultChecked={field.value}
                label={
                  <>
                    Prin crearea contului ești de acord cu{" "}
                    <Link
                      href="#"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Termenii și condițiile
                    </Link>
                    , precum și cu{" "}
                    <Link
                      href="#"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Politica de confidențialitate
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

      <button className="bg-primary hover:bg-primary/90 flex w-full justify-center rounded-md p-3 text-base font-medium text-white">
        Creează cont
      </button>
    </form>
  );
}
