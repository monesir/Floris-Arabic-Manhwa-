import type {
  AppLanguage,
  AppSettingsSnapshot,
} from "@contracts/settings";

export async function getAppSettings() {
  return window.appSettings.get();
}

export async function setAppLanguage(language: AppLanguage): Promise<AppSettingsSnapshot> {
  return window.appSettings.setLanguage(language);
}
