import { ipcMain, dialog } from "electron";
import { parseTachiyomiBackup } from "@services/backup/tachiyomi-parser";
import type { TachiyomiBackupResult } from "@contracts/backup";

export function registerBackupIpc() {
  ipcMain.handle("backup:open-tachiyomi", (): TachiyomiBackupResult | null => {
    const filePaths = dialog.showOpenDialogSync({
      title: "Select Tachiyomi Backup",
      properties: ["openFile"],
      filters: [{ name: "Tachiyomi Backup", extensions: ["tachibk"] }],
    });

    if (!filePaths || filePaths.length === 0) {
      return null;
    }

    try {
      return parseTachiyomiBackup(filePaths[0]);
    } catch (error) {
      console.error("Failed to parse Tachiyomi backup:", error);
      return null;
    }
  });
}
