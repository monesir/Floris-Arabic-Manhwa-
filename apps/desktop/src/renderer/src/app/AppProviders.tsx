import type { PropsWithChildren } from "react";
import { LanguageProvider } from "@renderer/features/settings/language-context";

export function AppProviders({ children }: PropsWithChildren) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
