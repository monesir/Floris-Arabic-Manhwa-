import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type {
  DownloadJob,
  DownloadJobStatus,
  EnqueueDownloadInput,
} from "@contracts/downloads";

type DownloadJobRow = {
  jobId: string;
  sourceId: string;
  sourceTitleId: string;
  titleName: string;
  chapterId: string;
  chapterTitle: string;
  coverUrl: string | null;
  status: DownloadJobStatus;
  destinationType: "app_managed" | "external";
  destinationPath: string;
  totalFiles: number;
  completedFiles: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

const SELECT_DOWNLOAD_JOB = `
  SELECT
    job_id AS jobId,
    source_id AS sourceId,
    source_title_id AS sourceTitleId,
    title_name AS titleName,
    chapter_id AS chapterId,
    chapter_title AS chapterTitle,
    cover_url AS coverUrl,
    status,
    destination_type AS destinationType,
    destination_path AS destinationPath,
    total_files AS totalFiles,
    completed_files AS completedFiles,
    error_message AS errorMessage,
    created_at AS createdAt,
    updated_at AS updatedAt,
    completed_at AS completedAt
  FROM download_jobs
`;

function mapJob(row: DownloadJobRow): DownloadJob {
  return {
    ...row,
  };
}

export class DownloadJobRepository {
  constructor(private readonly database: DatabaseSync) {}

  resetRunningJobsToPending() {
    const now = new Date().toISOString();

    this.database
      .prepare(
        `
          UPDATE download_jobs
          SET
            status = 'pending',
            updated_at = ?,
            error_message = CASE
              WHEN error_message IS NULL OR error_message = '' THEN 'Interrupted by app restart.'
              ELSE error_message
            END
          WHERE status = 'running'
        `,
      )
      .run(now);
  }

  enqueue(input: EnqueueDownloadInput, destinationPath: string) {
    return this.enqueueWithDestination(input, "app_managed", destinationPath);
  }

  enqueueWithDestination(
    input: EnqueueDownloadInput,
    destinationType: "app_managed" | "external",
    destinationPath: string,
  ) {
    const now = new Date().toISOString();
    const jobId = randomUUID();

    this.database
      .prepare(
        `
          INSERT INTO download_jobs (
            job_id,
            source_id,
            source_title_id,
            title_name,
            chapter_id,
            chapter_title,
            cover_url,
            status,
            destination_type,
            destination_path,
            total_files,
            completed_files,
            error_message,
            created_at,
            updated_at,
            completed_at
          )
          VALUES (
            @jobId,
            @sourceId,
            @sourceTitleId,
            @titleName,
            @chapterId,
            @chapterTitle,
            @coverUrl,
            'pending',
            @destinationType,
            @destinationPath,
            0,
            0,
            NULL,
            @createdAt,
            @updatedAt,
            NULL
          )
        `,
      )
      .run({
        jobId,
        sourceId: input.sourceId,
        sourceTitleId: input.sourceTitleId,
        titleName: input.titleName,
        chapterId: input.chapterId,
        chapterTitle: input.chapterTitle,
        coverUrl: input.coverUrl,
        destinationType,
        destinationPath,
        createdAt: now,
        updatedAt: now,
      });

    return this.getById(jobId);
  }

  getById(jobId: string) {
    const row = this.database
      .prepare(
        `
          ${SELECT_DOWNLOAD_JOB}
          WHERE job_id = ?
        `,
      )
      .get(jobId) as DownloadJobRow | undefined;

    return row ? mapJob(row) : null;
  }

  listAll() {
    const rows = this.database
      .prepare(
        `
          ${SELECT_DOWNLOAD_JOB}
          ORDER BY created_at DESC
        `,
      )
      .all() as DownloadJobRow[];

    return rows.map(mapJob);
  }

  getNextPending() {
    const row = this.database
      .prepare(
        `
          ${SELECT_DOWNLOAD_JOB}
          WHERE status = 'pending'
          ORDER BY created_at ASC
          LIMIT 1
        `,
      )
      .get() as DownloadJobRow | undefined;

    return row ? mapJob(row) : null;
  }

  retry(jobId: string) {
    const now = new Date().toISOString();

    this.database
      .prepare(
        `
          UPDATE download_jobs
          SET
            status = 'pending',
            total_files = 0,
            completed_files = 0,
            error_message = NULL,
            completed_at = NULL,
            updated_at = ?
          WHERE job_id = ? AND status = 'failed'
        `,
      )
      .run(now, jobId);

    return this.getById(jobId);
  }

  updateStatus(
    jobId: string,
    status: DownloadJobStatus,
    patch?: Partial<Pick<DownloadJob, "totalFiles" | "completedFiles" | "errorMessage" | "completedAt">>,
  ) {
    const now = new Date().toISOString();

    this.database
      .prepare(
        `
          UPDATE download_jobs
          SET
            status = @status,
            total_files = COALESCE(@totalFiles, total_files),
            completed_files = COALESCE(@completedFiles, completed_files),
            error_message = @errorMessage,
            completed_at = @completedAt,
            updated_at = @updatedAt
          WHERE job_id = @jobId
        `,
      )
      .run({
        jobId,
        status,
        totalFiles: patch?.totalFiles ?? null,
        completedFiles: patch?.completedFiles ?? null,
        errorMessage: patch?.errorMessage ?? null,
        completedAt: patch?.completedAt ?? null,
        updatedAt: now,
      });

    return this.getById(jobId);
  }
}
