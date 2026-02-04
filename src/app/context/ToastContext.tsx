"use client";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

const ToasterContext = () => {
  const [position, setPosition] = useState<"bottom-right" | "bottom-center">(
    "bottom-right"
  );

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 640px)");
    const apply = () => setPosition(mql.matches ? "bottom-center" : "bottom-right");
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  return (
    <div className="z-99999">
      <Toaster
        position={position}
        reverseOrder={false}
        toastOptions={{
          duration: 3500,
          className: "ainevoie-toast",
          style: {
            background: "var(--color-card)",
            color: "var(--color-foreground)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-card)",
            borderRadius: "14px",
            padding: "12px 14px",
          },
          success: {
            iconTheme: {
              primary: "var(--color-primary)",
              secondary: "var(--color-primary-foreground)",
            },
          },
          error: {
            iconTheme: {
              primary: "var(--color-destructive)",
              secondary: "var(--color-destructive-foreground)",
            },
          },
        }}
      />
    </div>
  );
};

export default ToasterContext;
