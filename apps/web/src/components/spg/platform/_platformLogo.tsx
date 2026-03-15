import React from "react";
import type { Platform } from "@/lib/spg-types";

export function PlatformLogo({ platform, className }: { platform: Platform; className?: string }) {
  // monochrome-ish official-like placeholders (stable, no external assets)
  switch (platform) {
    case "instagram":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2zm9 2h-9A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4z"/>
          <path d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2.1a2.9 2.9 0 1 0 0 5.8 2.9 2.9 0 0 0 0-5.8z"/>
          <circle cx="17.6" cy="6.4" r="1.1"/>
        </svg>
      );
    case "facebook":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H8v-3h2.4V9.7c0-2.4 1.4-3.7 3.6-3.7 1 0 2 .2 2 .2v2.2h-1.2c-1.2 0-1.6.8-1.6 1.5V12H16l-.4 3h-2.6v7A10 10 0 0 0 22 12z"/>
        </svg>
      );
    case "x":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.9 2H22l-6.8 7.8L23 22h-6.6l-5.1-6.6L5.6 22H2.5l7.3-8.4L1 2h6.7l4.6 6 6.6-6zM17 19.7h1.7L7 4.2H5.2L17 19.7z"/>
        </svg>
      );
    case "pinterest":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.6-6.7s-.4-.8-.4-2c0-1.9 1.1-3.3 2.5-3.3 1.2 0 1.7.9 1.7 1.9 0 1.2-.7 2.9-1.1 4.5-.3 1.3.7 2.3 1.9 2.3 2.3 0 4-2.9 4-6.3 0-2.6-1.7-4.6-5-4.6-3.6 0-5.8 2.7-5.8 5.8 0 1 .4 2 .9 2.6.1.1.1.2.1.4l-.3 1.2c-.1.4-.3.5-.7.3-1.3-.6-2.1-2.4-2.1-4.4 0-3.3 2.7-7.2 8.3-7.2 4.5 0 7.5 3.2 7.5 6.7 0 4.6-2.6 8-6.5 8-1.3 0-2.5-.7-2.9-1.6l-1 4c-.4 1.4-1.2 2.9-1.8 3.9A10 10 0 0 0 12 2z"/>
        </svg>
      );
  }
}
