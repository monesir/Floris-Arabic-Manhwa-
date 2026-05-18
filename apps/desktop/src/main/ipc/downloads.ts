import { BrowserWindow, dialog, ipcMain, type OpenDialogOptions } from "electron";
import type {
  DownloadJob,
  DownloadQueueSummary,
  DownloadSettingsSnapshot,
  EnqueueDownloadInput,
} from "@contracts/downloads";
import {
  enqueueDownload,
  getDownloadSettings,
  getDownloadQueueSummary,
  listDownloadJobs,
  retryDownload,
  updateDownloadDestinationType,
  updateExternalDownloadPath,
} from "@services/downloads/download-service";

const ENQUEUE_DOWNLOAD_CHANNEL = "downloads:enqueue";
const LIST_DOWNLOAD_JOBS_CHANNEL = "downloads:list";
const GET_DOWNLOAD_SUMMARY_CHANNEL = "downloads:get-summary";
const GET_DOWNLOAD_SETTINGS_CHANNEL = "downloads:get-settings";
const SET_DOWNLOAD_DESTINATION_TYPE_CHANNEL = "downloads:set-destination-type";
const PICK_EXTERNAL_DOWNLOAD_DIRECTORY_CHANNEL = "downloads:pick-external-directory";
const RETRY_DOWNLOAD_CHANNEL = "downloads:retry";

export function registerDownloadsIpc() {
  ipcMain.handle(
    ENQUEUE_DOWNLOAD_CHANNEL,
    (_, input: EnqueueDownloadInput): DownloadJob | null => enqueueDownload(input),
  );
  ipcMain.handle(
    LIST_DOWNLOAD_JOBS_CHANNEL,
    (): DownloadJob[] => listDownloadJobs(),
  );
  ipcMain.handle(
    GET_DOWNLOAD_SUMMARY_CHANNEL,
    (): DownloadQueueSummary => getDownloadQueueSummary(),
  );
  ipcMain.handle(
    GET_DOWNLOAD_SETTINGS_CHANNEL,
    (): DownloadSettingsSnapshot => getDownloadSettings(),
  );
  ipcMain.handle(
    SET_DOWNLOAD_DESTINATION_TYPE_CHANNEL,
    (_, destinationType: "app_managed" | "external"): DownloadSettingsSnapshot =>
      updateDownloadDestinationType(destinationType),
  );
  ipcMain.handle(
    PICK_EXTERNAL_DOWNLOAD_DIRECTORY_CHANNEL,
    async (): Promise<DownloadSettingsSnapshot> => {
      const focusedWindow = BrowserWindow.getFocusedWindow() ?? null;
      const options: OpenDialogOptions = {
        properties: ["openDirectory", "createDirectory"],
      };
      const result = focusedWindow
        ? await dialog.showOpenDialog(focusedWindow, options)
        : await dialog.showOpenDialog(options);

      if (!result.canceled && result.filePaths[0]) {
        return updateExternalDownloadPath(result.filePaths[0]);
      }

      return getDownloadSettings();
    },
  );
  ipcMain.handle(
    RETRY_DOWNLOAD_CHANNEL,
    (_, jobId: string): DownloadJob | null => retryDownload(jobId),
  );
}
