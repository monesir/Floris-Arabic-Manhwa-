import { ipcMain } from "electron";
import { appLanguageSchema } from "@contracts/settings";
import {
  getAppSettingsSnapshot,
  updateLanguage,
} from "@services/settings/settings-service";

const GET_SETTINGS_CHANNEL = "settings:get";
const SET_LANGUAGE_CHANNEL = "settings:set-language";

export function registerSettingsIpc() {
  ipcMain.handle(GET_SETTINGS_CHANNEL, () => getAppSettingsSnapshot());
  ipcMain.handle(SET_LANGUAGE_CHANNEL, (_event, language: unknown) =>
    updateLanguage(appLanguageSchema.parse(language)),
  );
}
