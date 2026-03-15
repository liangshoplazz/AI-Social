import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppClient from "@/components/app/AppClient";

export default async function AppPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  return <AppClient />;
}
