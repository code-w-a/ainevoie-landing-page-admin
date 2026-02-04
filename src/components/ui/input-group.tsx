"use client";

import { InputHTMLAttributes, useId } from "react";

type PropsType = {
  label?: string;
  errorMessages?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "id">;

export function InputGroup({ label, errorMessages, ...props }: PropsType) {
  const inputId = useId();

  return (
    <fieldset>
      {label && (
        <label htmlFor={inputId} className="mb-2.5 inline-block text-sm">
          {label}
        </label>
      )}

      <input
        id={inputId}
        className="border-stroke text-body focus:border-primary focus:shadow-input dark:border-stroke-dark dark:focus:border-primary w-full rounded-md border bg-white px-6 py-3 text-base font-medium outline-hidden dark:bg-black dark:text-white"
        {...props}
      />

      {errorMessages && (
        <p className="mt-2 text-xs text-red-500">{errorMessages}</p>
      )}
    </fieldset>
  );
}
