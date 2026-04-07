import ResetPassword from "@/components/Auth/ResetPassword";
import { routing } from "@/i18n/routing";
import axios from "axios";
import { redirect } from "next/navigation";

type PropsType = {
  params: Promise<{ locale: string; token: string }>;
};

function forgetPasswordPath(locale: string) {
  return locale === routing.defaultLocale
    ? "/auth/forget-password"
    : `/${locale}/auth/forget-password`;
}

export default async function Page(props: PropsType) {
  const { locale, token } = await props.params;

  let userEmail: string;

  try {
    userEmail = await verifyToken(token, locale);
  } catch {
    redirect(forgetPasswordPath(locale));
  }

  return <ResetPassword userEmail={userEmail} />;
}

const verifyToken = async (token: string, locale: string) => {
  const res = await axios.post(
    "/api/forget-password/verify-token",
    { token },
    { headers: { "x-next-intl-locale": locale } }
  );

  return res.data.email as string;
};
