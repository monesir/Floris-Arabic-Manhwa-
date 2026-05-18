import type {
  DownloadJob,
  DownloadQueueSummary,
  EnqueueDownloadInput,
} from "@contracts/downloads";

export function enqueueDownload(input: EnqueueDownloadInput) {
  return window.downloadsStore.enqueue(input) as Promise<DownloadJob | null>;
}

export function listDownloadJobs() {
  return window.downloadsStore.list() as Promise<DownloadJob[]>;
}

export function getDownloadQueueSummary() {
  return window.downloadsStore.getSummary() as Promise<DownloadQueueSummary>;
}
