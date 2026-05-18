import { ipcMain } from "electron";
import type { DownloadJob, DownloadQueueSummary, EnqueueDownloadInput } from "@contracts/downloads";
import {
  enqueueDownload,
  getDownloadQueueSummary,
  listDownloadJobs,
} from "@services/downloads/download-service";

const ENQUEUE_DOWNLOAD_CHANNEL = "downloads:enqueue";
const LIST_DOWNLOAD_JOBS_CHANNEL = "downloads:list";
const GET_DOWNLOAD_SUMMARY_CHANNEL = "downloads:get-summary";

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
}
