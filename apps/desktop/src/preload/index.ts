import { contextBridge, ipcRenderer } from "electron";
import type {
  AppLanguage,
  AppSettingsSnapshot,
} from "@contracts/settings";

contextBridge.exposeInMainWorld("appShell", {
  platform: process.platform,
  versions: {
    chrome: process.versions.chrome,
    electron: process.versions.electron,
    node: process.versions.node,
  },
});

contextBridge.exposeInMainWorld("appSettings", {
  get() {
    return ipcRenderer.invoke("settings:get") as Promise<AppSettingsSnapshot>;
  },
  setLanguage(language: AppLanguage) {
    return ipcRenderer.invoke(
      "settings:set-language",
      language,
    ) as Promise<AppSettingsSnapshot>;
  },
});
