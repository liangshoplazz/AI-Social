import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RegisterClient from "@/components/auth/RegisterClient";

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/app");
  }

  return <RegisterClient />;
}
