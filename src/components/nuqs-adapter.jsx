"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";

export function NuqsAdapterWrapper({ children }) {
  return <NuqsAdapter>{children}</NuqsAdapter>;
}
