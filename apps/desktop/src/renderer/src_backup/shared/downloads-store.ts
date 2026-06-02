import type {
  DownloadJob,
  DownloadQueueSummary,
  DownloadSettingsSnapshot,
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

export function getDownloadSettings() {
  return window.downloadsStore.getSettings() as Promise<DownloadSettingsSnapshot>;
}

export function setDownloadDestinationType(destinationType: "app_managed" | "external") {
  return window.downloadsStore.setDestinationType(destinationType) as Promise<DownloadSettingsSnapshot>;
}

export function pickExternalDownloadDirectory() {
  return window.downloadsStore.pickExternalDirectory() as Promise<DownloadSettingsSnapshot>;
}

export function retryDownload(jobId: string) {
  return window.downloadsStore.retry(jobId) as Promise<DownloadJob | null>;
}
