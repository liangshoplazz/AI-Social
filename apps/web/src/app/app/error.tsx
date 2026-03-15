"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 会出现在浏览器 console；如果你开了 Sentry 也能从这里接
    console.error("App route error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border bg-background p-6 space-y-3">
        <div className="text-lg font-semibold">页面发生错误</div>
        <div className="text-sm text-muted-foreground">
          请打开浏览器控制台查看具体报错信息（Console）。
        </div>

        <div className="rounded-lg border bg-muted p-3 text-xs whitespace-pre-wrap break-words">
          {String(error?.message || error)}
          {error?.digest ? `\n\ndigest: ${error.digest}` : ""}
        </div>

        <button
          type="button"
          onClick={reset}
          className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
        >
          重试
        </button>
      </div>
    </div>
  );
}
