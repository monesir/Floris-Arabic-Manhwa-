import type { PluginListItem } from "@contracts/plugin";

export type PluginRegistrySnapshot = {
  pluginDirectory: string;
  plugins: PluginListItem[];
};

export async function getPluginRegistryState(): Promise<PluginRegistrySnapshot> {
  return window.pluginRegistry.getState();
}

export async function rescanPluginRegistry(): Promise<PluginRegistrySnapshot> {
  return window.pluginRegistry.rescan();
}
