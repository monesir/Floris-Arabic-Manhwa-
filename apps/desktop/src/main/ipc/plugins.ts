import { ipcMain } from "electron";
import { getPluginRegistryState } from "@services/plugins/plugin-registry";

const GET_PLUGIN_STATE_CHANNEL = "plugins:get-state";

export function registerPluginIpc(userDataPath: string) {
  ipcMain.handle(GET_PLUGIN_STATE_CHANNEL, () => getPluginRegistryState(userDataPath));
}

