import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginClient from "@/components/auth/LoginClient";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/app");
  }

  return <LoginClient />;
}
