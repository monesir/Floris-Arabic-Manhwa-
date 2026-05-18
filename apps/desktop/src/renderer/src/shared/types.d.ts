import type { PluginListItem } from "@contracts/plugin";
import type {
  AppLanguage,
  AppSettingsSnapshot,
} from "@contracts/settings";

export {};

declare module "*.css";

declare global {
  interface Window {
    appShell: {
      platform: NodeJS.Platform;
      versions: {
        chrome: string;
        electron: string;
        node: string;
      };
    };
    appSettings: {
      get: () => Promise<AppSettingsSnapshot>;
      setLanguage: (language: AppLanguage) => Promise<AppSettingsSnapshot>;
    };
    pluginRegistry: {
      getState: () => Promise<{
        pluginDirectory: string;
        plugins: PluginListItem[];
      }>;
    };
  }
}
