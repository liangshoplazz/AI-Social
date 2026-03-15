"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import type { Platform } from "@/lib/spg-types";

type Ctx = {
  showMedia: boolean;
  setShowMedia: (v: boolean) => void;
  defaultExpandedPlatforms: Set<Platform>;
};

const MediaPrefsContext = createContext<Ctx | null>(null);

export function MediaPrefsProvider(props: {
  children: React.ReactNode;
  initialShowMedia?: boolean;
  defaultExpandedPlatforms?: Set<Platform>;
}) {
  const [showMedia, setShowMedia] = useState(props.initialShowMedia ?? true);

  const defaultExpandedPlatforms = useMemo(() => {
    return props.defaultExpandedPlatforms ?? new Set<Platform>();
  }, [props.defaultExpandedPlatforms]);

  const value = useMemo(
    () => ({ showMedia, setShowMedia, defaultExpandedPlatforms }),
    [showMedia, defaultExpandedPlatforms]
  );

  return <MediaPrefsContext.Provider value={value}>{props.children}</MediaPrefsContext.Provider>;
}

export function useMediaPrefs() {
  const ctx = useContext(MediaPrefsContext);
  if (!ctx) {
    return {
      showMedia: true,
      setShowMedia: (_v: boolean) => {},
      defaultExpandedPlatforms: new Set<Platform>(),
    } as Ctx;
  }
  return ctx;
}
