import { mkdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { getDatabase } from "@db/database";
import { DownloadJobRepository } from "@db/repositories/download-job-repository";
import type { DownloadJob, DownloadQueueSummary, EnqueueDownloadInput } from "@contracts/downloads";
import { getSourceChapterPages } from "@services/sources/source-registry";

let appManagedDownloadsRoot = "";
let isProcessingQueue = false;

function sanitizeSegment(value: string) {
  return value
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100) || "untitled";
}

function getRepository() {
  return new DownloadJobRepository(getDatabase());
}

function ensureInitialized() {
  if (!appManagedDownloadsRoot) {
    throw new Error("Download service accessed before initialization.");
  }
}

function safeFileNameFromUrl(url: string, index: number) {
  try {
    const parsed = new URL(url);
    const name = basename(parsed.pathname) || `page-${index + 1}.jpg`;
    return `${String(index + 1).padStart(3, "0")}-${sanitizeSegment(name)}`;
  } catch {
    return `${String(index + 1).padStart(3, "0")}-page.jpg`;
  }
}

async function processJob(job: DownloadJob) {
  const repository = getRepository();
  const pages = await getSourceChapterPages(job.sourceId, job.sourceTitleId, job.chapterId);
  const chapterDirectory = join(
    job.destinationPath,
    sanitizeSegment(job.titleName),
    sanitizeSegment(job.chapterTitle),
  );

  mkdirSync(chapterDirectory, { recursive: true });

  repository.updateStatus(job.jobId, "running", {
    totalFiles: pages.length,
    completedFiles: 0,
    errorMessage: null,
    completedAt: null,
  });

  for (const [index, page] of pages.entries()) {
    const response = await fetch(page.imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to download page ${index + 1}: ${response.status}`);
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    const filePath = join(chapterDirectory, safeFileNameFromUrl(page.imageUrl, index));
    writeFileSync(filePath, bytes);

    repository.updateStatus(job.jobId, "running", {
      totalFiles: pages.length,
      completedFiles: index + 1,
      errorMessage: null,
      completedAt: null,
    });
  }

  const completedAt = new Date().toISOString();
  repository.updateStatus(job.jobId, "completed", {
    totalFiles: pages.length,
    completedFiles: pages.length,
    errorMessage: null,
    completedAt,
  });
}

async function processQueue() {
  ensureInitialized();

  if (isProcessingQueue) {
    return;
  }

  isProcessingQueue = true;

  try {
    const repository = getRepository();
    let nextJob = repository.getNextPending();

    while (nextJob) {
      try {
        await processJob(nextJob);
      } catch (error: unknown) {
        repository.updateStatus(nextJob.jobId, "failed", {
          errorMessage: error instanceof Error ? error.message : "Download failed.",
          completedAt: null,
        });
      }

      nextJob = repository.getNextPending();
    }
  } finally {
    isProcessingQueue = false;
  }
}

export function initializeDownloadService(userDataPath: string) {
  appManagedDownloadsRoot = join(userDataPath, "downloads");
  mkdirSync(appManagedDownloadsRoot, { recursive: true });
  getRepository().resetRunningJobsToPending();
  void processQueue();
}

export function enqueueDownload(input: EnqueueDownloadInput) {
  ensureInitialized();
  const repository = getRepository();
  const job = repository.enqueue(input, appManagedDownloadsRoot);
  void processQueue();
  return job;
}

export function listDownloadJobs() {
  return getRepository().listAll();
}

export function getDownloadQueueSummary(): DownloadQueueSummary {
  const jobs = listDownloadJobs();

  return {
    total: jobs.length,
    pending: jobs.filter((job) => job.status === "pending").length,
    running: jobs.filter((job) => job.status === "running").length,
    paused: jobs.filter((job) => job.status === "paused").length,
    completed: jobs.filter((job) => job.status === "completed").length,
    failed: jobs.filter((job) => job.status === "failed").length,
  };
}
