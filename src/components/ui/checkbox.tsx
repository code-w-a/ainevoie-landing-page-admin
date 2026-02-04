"use client";

import { CheckMarkIcon } from "@/assets/icons";
import { type InputHTMLAttributes, useId } from "react";

type PropsType = {
  label?: React.ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "id">;

export function Checkbox({ label, ...props }: PropsType) {
  const inputId = useId();

  return (
    <label htmlFor={inputId} className="text-body flex gap-2.5">
      <input id={inputId} type="checkbox" className="peer sr-only" {...props} />

      <span className="group flex h-[1lh] shrink-0 items-center">
        <span className="border-stroke dark:border-stroke-dark group-peer-checked:bg-primary flex size-[22px] shrink-0 items-center justify-center rounded-sm border-[.7px]">
          <CheckMarkIcon className="hidden group-peer-checked:block" />
        </span>
      </span>

      {label && <span>{label}</span>}
    </label>
  );
}
