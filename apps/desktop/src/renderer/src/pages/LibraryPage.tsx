import { useEffect, useMemo, useState } from "react";
import type { LibraryEntry } from "@contracts/library";
import type { SourceCatalogItem } from "@contracts/source";
import { listLibraryEntries } from "@renderer/shared/library-store";
import { getSourceCatalog } from "@renderer/shared/source-registry";

export function LibraryPage() {
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [catalog, setCatalog] = useState<SourceCatalogItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus("loading");
    setError(null);

    void Promise.all([listLibraryEntries(), getSourceCatalog()])
      .then(([libraryEntries, sourceCatalog]) => {
        setEntries(libraryEntries);
        setCatalog(sourceCatalog);
        setStatus("ready");
      })
      .catch((nextError: unknown) => {
        setStatus("error");
        setError(nextError instanceof Error ? nextError.message : "Failed to load local library.");
      });
  }, []);

  const sourceLabels = useMemo(
    () =>
      new Map(
        catalog.map((source) => [
          source.metadata.sourceId,
          source.metadata.displayName,
        ]),
      ),
    [catalog],
  );

  return (
    <div className="page">
      <section className="page__hero">
        <span className="page__eyebrow">Local collection</span>
        <h1 className="page__title">Saved titles now persist in the app library</h1>
        <p className="page__copy">
          This is the first real library surface. It reflects titles added from the browse workflow using the locked identity model built around `library_entry_id`, `source_id`, and `source_title_id`.
        </p>
        <div className="page__grid">
          <div className="page__card">
            <div className="page__card-label">Entries</div>
            <div className="page__card-value">{entries.length}</div>
          </div>
          <div className="page__card">
            <div className="page__card-label">Persistence</div>
            <div className="page__card-value">SQLite local-first</div>
          </div>
          <div className="page__card">
            <div className="page__card-label">State</div>
            <div className="page__card-value">{status === "ready" ? "Live" : status}</div>
          </div>
        </div>
      </section>

      <section className="page__panel">
        <h2 className="page__panel-title">Saved library entries</h2>
        <p className="page__panel-copy">
          Phase 2 keeps this surface intentionally minimal. Phase 3 expands it into a richer library with filters, statuses, favorites, custom lists, and update indicators.
        </p>

        {status === "loading" ? <p className="browse-message">Loading local library…</p> : null}
        {error ? <p className="browse-message browse-message--error">{error}</p> : null}

        {status === "ready" && entries.length === 0 ? (
          <p className="browse-message">
            No titles are saved yet. Add a title from the Browse route to populate the local library.
          </p>
        ) : null}

        <div className="library-grid">
          {entries.map((entry) => (
            <article className="library-card" key={entry.libraryEntryId}>
              <div className="library-card__accent">
                {entry.titleName
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0] ?? "")
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="library-card__body">
                <div className="library-card__topline">
                  <span className="browse-pill">{sourceLabels.get(entry.sourceId) ?? entry.sourceId}</span>
                  <span className="library-card__stamp">
                    {new Date(entry.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="library-card__title">{entry.titleName}</h3>
                <p className="library-card__meta">Title ID: {entry.sourceTitleId}</p>
                <p className="library-card__meta">Slug: {entry.sourceTitleSlug ?? "No slug stored"}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
