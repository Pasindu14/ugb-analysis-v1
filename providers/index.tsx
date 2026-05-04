"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";
import { QueryProvider } from "./query-provider";
import { AuthSessionProvider } from "./session-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NuqsAdapter>
      <AuthSessionProvider>
        <QueryProvider>{children}</QueryProvider>
      </AuthSessionProvider>
    </NuqsAdapter>
  );
}
