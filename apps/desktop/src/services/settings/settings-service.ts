import { getDatabase } from "@db/database";
import { SettingsRepository } from "@db/repositories/settings-repository";
import {
  DEFAULT_APP_LANGUAGE,
  appLanguageSchema,
  appSettingsSnapshotSchema,
  type AppLanguage,
  type AppSettingsSnapshot,
} from "@contracts/settings";

function getRepository() {
  return new SettingsRepository(getDatabase());
}

export function bootstrapSettingsState() {
  const repository = getRepository();

  if (!repository.getLanguage()) {
    repository.setLanguage(DEFAULT_APP_LANGUAGE);
  }
}

export function getAppSettingsSnapshot(): AppSettingsSnapshot {
  const repository = getRepository();
  const language = appLanguageSchema.catch(DEFAULT_APP_LANGUAGE).parse(repository.getLanguage());

  return appSettingsSnapshotSchema.parse({
    language,
  });
}

export function updateLanguage(language: AppLanguage): AppSettingsSnapshot {
  const nextLanguage = appLanguageSchema.parse(language);
  const repository = getRepository();

  repository.setLanguage(nextLanguage);

  return getAppSettingsSnapshot();
}
