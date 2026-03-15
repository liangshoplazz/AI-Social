"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  className?: string;
};

export default function LogoutButton({ className = "" }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    try {
      setLoading(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={
        className ||
        "hidden rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 sm:inline-flex"
      }
    >
      {loading ? "退出中..." : "退出登录"}
    </button>
  );
}
