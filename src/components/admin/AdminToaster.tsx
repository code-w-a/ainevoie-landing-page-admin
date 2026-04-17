"use client";

import { Toaster } from "react-hot-toast";

export function AdminToaster() {
  return (
    <div className="z-[99999]">
      <Toaster
        position="bottom-right"
        containerStyle={{ bottom: 20, right: 16 }}
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          className: "admin-toast",
          style: {
            borderRadius: "12px",
            padding: "12px 16px",
            fontSize: "14px",
            fontWeight: 600,
            lineHeight: 1.35,
            maxWidth: "min(420px, calc(100vw - 32px))",
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.18)",
          },
          success: {
            className: "admin-toast admin-toast--success",
            style: {
              background: "#15803d",
              color: "#ffffff",
              border: "none",
            },
            iconTheme: {
              primary: "#ffffff",
              secondary: "#15803d",
            },
          },
          error: {
            className: "admin-toast admin-toast--error",
            style: {
              background: "#b91c1c",
              color: "#ffffff",
              border: "none",
            },
            iconTheme: {
              primary: "#ffffff",
              secondary: "#b91c1c",
            },
          },
          loading: {
            className: "admin-toast admin-toast--loading",
            style: {
              background: "#334155",
              color: "#f8fafc",
              border: "none",
            },
          },
        }}
      />
    </div>
  );
}
