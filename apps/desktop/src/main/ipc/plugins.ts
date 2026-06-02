import { app, ipcMain } from "electron";
import { getPluginRegistryState, refreshPluginRegistry } from "@services/plugins/plugin-registry";

const GET_PLUGIN_STATE_CHANNEL = "plugins:get-state";
const RESCAN_PLUGIN_STATE_CHANNEL = "plugins:rescan";

export function registerPluginIpc(userDataPath: string) {
  ipcMain.handle(GET_PLUGIN_STATE_CHANNEL, () => getPluginRegistryState(userDataPath));
  ipcMain.handle(RESCAN_PLUGIN_STATE_CHANNEL, () => refreshPluginRegistry(userDataPath, app.getVersion()));
}
