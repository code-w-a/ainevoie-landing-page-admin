import toast from "react-hot-toast";

/** Toast galben (avertisment) — același colț și animație ca restul admin. */
export function adminToastWarning(message: string) {
  return toast(message, {
    duration: 4500,
    className: "admin-toast admin-toast--warning",
    icon: "⚠",
    style: {
      background: "#ca8a04",
      color: "#1c1917",
      border: "none",
    },
  });
}
