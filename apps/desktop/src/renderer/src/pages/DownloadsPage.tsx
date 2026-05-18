import { useEffect, useState } from "react";
import type {
  DownloadJob,
  DownloadQueueSummary,
  DownloadSettingsSnapshot,
} from "@contracts/downloads";
import {
  getDownloadSettings,
  getDownloadQueueSummary,
  listDownloadJobs,
  pickExternalDownloadDirectory,
  retryDownload,
  setDownloadDestinationType,
} from "@renderer/shared/downloads-store";

export function DownloadsPage() {
  const [jobs, setJobs] = useState<DownloadJob[]>([]);
  const [summary, setSummary] = useState<DownloadQueueSummary | null>(null);
  const [settings, setSettings] = useState<DownloadSettingsSnapshot | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);

  function refreshDownloads() {
    setStatus("loading");
    setError(null);

    void Promise.all([listDownloadJobs(), getDownloadQueueSummary(), getDownloadSettings()])
      .then(([nextJobs, nextSummary, nextSettings]) => {
        setJobs(nextJobs);
        setSummary(nextSummary);
        setSettings(nextSettings);
        setStatus("ready");
      })
      .catch((nextError: unknown) => {
        setStatus("error");
        setError(nextError instanceof Error ? nextError.message : "Failed to load download queue.");
      });
  }

  useEffect(() => {
    refreshDownloads();
  }, []);

  function handleChangeDestinationType(destinationType: "app_managed" | "external") {
    setError(null);

    void setDownloadDestinationType(destinationType)
      .then((nextSettings) => {
        setSettings(nextSettings);
      })
      .catch((nextError: unknown) => {
        setError(nextError instanceof Error ? nextError.message : "Failed to update destination type.");
      });
  }

  function handlePickExternalDirectory() {
    setError(null);

    void pickExternalDownloadDirectory()
      .then((nextSettings) => {
        setSettings(nextSettings);
      })
      .catch((nextError: unknown) => {
        setError(nextError instanceof Error ? nextError.message : "Failed to choose external directory.");
      });
  }

  function handleRetry(jobId: string) {
    setPendingJobId(jobId);
    setError(null);

    void retryDownload(jobId)
      .then(() => refreshDownloads())
      .catch((nextError: unknown) => {
        setError(nextError instanceof Error ? nextError.message : "Failed to retry download job.");
      })
      .finally(() => {
        setPendingJobId(null);
      });
  }

  return (
    <section className="page">
      <header className="page__header page__header--split">
        <div>
          <div className="page__eyebrow">Offline lane</div>
          <h1 className="page__title page__title--compact">Downloads</h1>
          <p className="page__copy">
            App-managed chapter downloads now persist locally and materialize into the user-data downloads directory.
          </p>
        </div>
        <button
          type="button"
          className="browse-search__button"
          onClick={refreshDownloads}
        >
          Refresh
        </button>
      </header>

      <div className="page__grid">
        <div className="page__card">
          <div className="page__card-label">Total jobs</div>
          <div className="page__card-value">{summary?.total ?? "--"}</div>
        </div>
        <div className="page__card">
          <div className="page__card-label">Pending / running</div>
          <div className="page__card-value">
            {(summary?.pending ?? 0) + (summary?.running ?? 0)}
          </div>
        </div>
        <div className="page__card">
          <div className="page__card-label">Completed / failed</div>
          <div className="page__card-value">
            {(summary?.completed ?? 0)} / {(summary?.failed ?? 0)}
          </div>
        </div>
      </div>

      <section className="page__panel">
        <div className="library-toolbar__header">
          <div>
            <h2 className="page__panel-title">Download destination</h2>
            <p className="page__panel-copy">
              Downloads can stay inside app-managed storage or be written into an external folder.
            </p>
          </div>
        </div>
        <div className="library-toolbar__grid">
          <label className="library-field">
            <span className="library-field__label">Destination mode</span>
            <select
              className="browse-controls__select"
              value={settings?.preferredDestinationType ?? "app_managed"}
              onChange={(event) =>
                handleChangeDestinationType(event.target.value as "app_managed" | "external")
              }
            >
              <option value="app_managed">App-managed</option>
              <option value="external">External folder</option>
            </select>
          </label>

          <label className="library-field">
            <span className="library-field__label">App-managed path</span>
            <div className="page__pill">{settings?.appManagedPath ?? "--"}</div>
          </label>

          <label className="library-field">
            <span className="library-field__label">External path</span>
            <div className="browse-chapter-row__actions-inline">
              <div className="page__pill">
                {settings?.externalDestinationPath ?? "Not selected"}
              </div>
              <button
                type="button"
                className="browse-search__button browse-search__button--ghost"
                onClick={handlePickExternalDirectory}
              >
                Choose folder
              </button>
            </div>
          </label>
        </div>
      </section>

      <section className="page__panel">
        {status === "loading" ? <p className="browse-message">Loading download queue...</p> : null}
        {error ? <p className="browse-message browse-message--error">{error}</p> : null}
        {status === "ready" && jobs.length === 0 ? (
          <p className="browse-message">
            No chapter downloads have been queued yet. Use the title details page to enqueue readable chapters.
          </p>
        ) : null}

        <div className="updates-list">
          {jobs.map((job) => (
            <article className="updates-card" key={job.jobId}>
              <div className="updates-card__cover-wrap">
                {job.coverUrl ? (
                  <img className="updates-card__cover" src={job.coverUrl} alt={job.titleName} />
                ) : (
                  <div className="updates-card__cover updates-card__cover--empty">No cover</div>
                )}
              </div>
              <div className="updates-card__body">
                <div className="updates-card__topline">
                  <span className="browse-pill">{job.status}</span>
                  <span className="page__pill">
                    {job.completedFiles}/{job.totalFiles || "--"}
                  </span>
                </div>
                <h2 className="updates-card__title">{job.titleName}</h2>
                <p className="updates-card__meta">Chapter: {job.chapterTitle}</p>
                <p className="updates-card__meta">Destination: {job.destinationPath}</p>
                <p className="updates-card__meta">
                  Updated: {new Date(job.updatedAt).toLocaleString()}
                </p>
                {job.status === "failed" ? (
                  <button
                    type="button"
                    className="browse-search__button browse-search__button--ghost"
                    disabled={pendingJobId === job.jobId}
                    onClick={() => handleRetry(job.jobId)}
                  >
                    {pendingJobId === job.jobId ? "Retrying..." : "Retry"}
                  </button>
                ) : null}
                {job.errorMessage ? (
                  <p className="browse-message browse-message--error">{job.errorMessage}</p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
