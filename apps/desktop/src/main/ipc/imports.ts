import { BrowserWindow, dialog, ipcMain, type OpenDialogOptions } from "electron";
import type { ImportResult } from "@contracts/imports";
import {
  importCbzFromPath,
  importFolderFromPath,
  importPdfFromPath,
} from "@services/imports/import-service";

const IMPORT_FOLDER_CHANNEL = "imports:folder";
const IMPORT_CBZ_CHANNEL = "imports:cbz";
const IMPORT_PDF_CHANNEL = "imports:pdf";

async function openDialog(options: OpenDialogOptions) {
  const focusedWindow = BrowserWindow.getFocusedWindow() ?? null;
  return focusedWindow
    ? dialog.showOpenDialog(focusedWindow, options)
    : dialog.showOpenDialog(options);
}

export function registerImportsIpc() {
  ipcMain.handle(IMPORT_FOLDER_CHANNEL, async (): Promise<ImportResult | null> => {
    const result = await openDialog({
      properties: ["openDirectory"],
    });

    if (result.canceled || !result.filePaths[0]) {
      return null;
    }

    return importFolderFromPath(result.filePaths[0]);
  });

  ipcMain.handle(IMPORT_CBZ_CHANNEL, async (): Promise<ImportResult | null> => {
    const result = await openDialog({
      properties: ["openFile"],
      filters: [{ name: "Comic Book Zip", extensions: ["cbz"] }],
    });

    if (result.canceled || !result.filePaths[0]) {
      return null;
    }

    return importCbzFromPath(result.filePaths[0]);
  });

  ipcMain.handle(IMPORT_PDF_CHANNEL, async (): Promise<ImportResult | null> => {
    const result = await openDialog({
      properties: ["openFile"],
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });

    if (result.canceled || !result.filePaths[0]) {
      return null;
    }

    return importPdfFromPath(result.filePaths[0]);
  });
}
