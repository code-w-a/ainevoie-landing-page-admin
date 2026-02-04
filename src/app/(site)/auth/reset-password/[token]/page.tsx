import ResetPassword from "@/components/Auth/ResetPassword";
import axios from "axios";
import { redirect } from "next/navigation";
import toast from "react-hot-toast";

type PropsType = {
  params: Promise<{ token: string }>;
};

export default async function Page(props: PropsType) {
  const params = await props.params;

  let userEmail;

  try {
    userEmail = await verifyToken(params.token);
  } catch (error) {
    toast.error("Token is invalid or has expired. Please request a new one.");
    redirect("/auth/forget-password");
  }

  return <ResetPassword userEmail={userEmail} />;
}

const verifyToken = async (token: string) => {
  const res = await axios.post("/api/forget-password/verify-token", {
    token,
  });

  return res.data.email;
};
