import { useEffect, useState } from "react";
import type { LibraryUpdateItem } from "@contracts/library";
import { listLibraryUpdates, refreshLibraryUpdates } from "@renderer/shared/library-store";
import { CachedImage } from "@renderer/shared/CachedImage";

export function UpdatesPage() {
  const [updates, setUpdates] = useState<LibraryUpdateItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    void listLibraryUpdates()
      .then((items) => {
        setUpdates(items);
        setStatus("ready");
      })
      .catch((nextError: unknown) => {
        setStatus("error");
        setError(nextError instanceof Error ? nextError.message : "Failed to load updates.");
      });
  }, []);

  function handleRefresh() {
    setIsRefreshing(true);
    setError(null);

    void refreshLibraryUpdates()
      .then((summary) => {
        setUpdates(summary.updates);
        setStatus("ready");
      })
      .catch((nextError: unknown) => {
        setStatus("error");
        setError(nextError instanceof Error ? nextError.message : "Failed to refresh updates.");
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  }

  return (
    <section className="page">
      <header className="page__header page__header--split">
        <div>
          <div className="page__eyebrow">Updates</div>
          <h1 className="page__title page__title--compact">Tracked refreshes</h1>
        </div>
        <button
          type="button"
          className="browse-search__button"
          disabled={isRefreshing}
          onClick={handleRefresh}
        >
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      <section className="page__panel">
        {status === "loading" ? <p className="browse-message">Loading tracked updates...</p> : null}
        {error ? <p className="browse-message browse-message--error">{error}</p> : null}
        {status === "ready" && updates.length === 0 ? (
          <p className="browse-message">
            No new chapters are currently tracked. Run a refresh after saving titles to the library.
          </p>
        ) : null}

        <div className="updates-list">
          {updates.map((update) => (
            <article className="updates-card" key={update.libraryEntryId}>
              <div className="updates-card__cover-wrap">
                {update.coverUrl ? (
                  <CachedImage className="updates-card__cover" src={update.coverUrl} alt={update.titleName} />
                ) : (
                  <div className="updates-card__cover updates-card__cover--empty">No cover</div>
                )}
              </div>
              <div className="updates-card__body">
                <div className="updates-card__topline">
                  <span className="browse-pill">{update.sourceId}</span>
                  <span className="library-update-badge library-update-badge--inline">
                    {update.pendingUpdateCount}
                  </span>
                </div>
                <h2 className="updates-card__title">{update.titleName}</h2>
                <p className="updates-card__meta">
                  Latest detected chapter: {update.latestDetectedChapterTitle ?? update.latestDetectedChapterId ?? "Unknown"}
                </p>
                <p className="updates-card__meta">
                  Last checked: {update.lastUpdateCheckedAt ? new Date(update.lastUpdateCheckedAt).toLocaleString() : "Never"}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
