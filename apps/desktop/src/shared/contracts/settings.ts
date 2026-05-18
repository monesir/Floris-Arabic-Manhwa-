import { z } from "zod";

export const appLanguageSchema = z.enum(["en", "ar"]);

export type AppLanguage = z.infer<typeof appLanguageSchema>;

export const appSettingsSnapshotSchema = z.object({
  language: appLanguageSchema,
});

export type AppSettingsSnapshot = z.infer<typeof appSettingsSnapshotSchema>;

export const DEFAULT_APP_LANGUAGE: AppLanguage = "en";

