export type DownloadJobStatus =
  | "pending"
  | "running"
  | "paused"
  | "completed"
  | "failed";

export type DownloadDestinationType = "app_managed" | "external";

export type DownloadJob = {
  jobId: string;
  sourceId: string;
  sourceTitleId: string;
  titleName: string;
  chapterId: string;
  chapterTitle: string;
  coverUrl: string | null;
  status: DownloadJobStatus;
  destinationType: DownloadDestinationType;
  destinationPath: string;
  totalFiles: number;
  completedFiles: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type EnqueueDownloadInput = {
  sourceId: string;
  sourceTitleId: string;
  titleName: string;
  chapterId: string;
  chapterTitle: string;
  coverUrl: string | null;
};

export type DownloadQueueSummary = {
  total: number;
  pending: number;
  running: number;
  paused: number;
  completed: number;
  failed: number;
};

export type DownloadSettingsSnapshot = {
  preferredDestinationType: DownloadDestinationType;
  externalDestinationPath: string | null;
  appManagedPath: string;
};
