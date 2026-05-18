import { startTransition, useEffect, useMemo, useState, type FormEvent } from "react";
import type {
  SourceCatalogItem,
  SourceChapterAvailability,
  SourceChapterSummary,
  SourceTitleDetails,
  SourceTitleSummary,
} from "@contracts/source";
import {
  browseSourceTitles,
  getSourceCatalog,
  getSourceTitle,
  searchSourceTitles,
} from "@renderer/shared/source-registry";
import { addLibraryEntry, listLibraryEntries } from "@renderer/shared/library-store";
import { getReaderState } from "@renderer/shared/reader-store";
import { useNavigate, useSearchParams } from "react-router-dom";

type BrowseResultsState = {
  items: SourceTitleSummary[];
  page: number;
  hasNextPage: boolean;
} | null;

type DetailState = {
  details: SourceTitleDetails;
  chapters: SourceChapterSummary[];
} | null;

function availabilityLabel(availability: SourceChapterAvailability) {
  if (availability === "locked") {
    return "Locked";
  }

  if (availability === "unavailable") {
    return "Unavailable";
  }

  return "Readable";
}

export function BrowseWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [catalog, setCatalog] = useState<SourceCatalogItem[]>([]);
  const [results, setResults] = useState<BrowseResultsState>(null);
  const [detail, setDetail] = useState<DetailState>(null);
  const [queryDraft, setQueryDraft] = useState(searchParams.get("query") ?? "");
  const [catalogStatus, setCatalogStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [resultsStatus, setResultsStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [detailStatus, setDetailStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [libraryState, setLibraryState] = useState<Record<string, string>>({});
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [libraryNotice, setLibraryNotice] = useState<string | null>(null);
  const [isSavingToLibrary, setIsSavingToLibrary] = useState(false);
  const [readerState, setReaderState] = useState<{ progressChapterId: string | null; libraryEntryId: string | null } | null>(null);
  const navigate = useNavigate();

  const sourceId = searchParams.get("source");
  const activeQuery = searchParams.get("query") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const titleId = searchParams.get("title");

  const activeSource = useMemo(
    () => catalog.find((source) => source.metadata.sourceId === sourceId) ?? null,
    [catalog, sourceId],
  );

  useEffect(() => {
    setCatalogStatus("loading");
    setCatalogError(null);

    void getSourceCatalog()
      .then((nextCatalog) => {
        setCatalog(nextCatalog);
        setCatalogStatus("ready");

        if (!sourceId && nextCatalog[0]) {
          startTransition(() => {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.set("source", nextCatalog[0].metadata.sourceId);
            nextParams.set("page", "1");
            setSearchParams(nextParams, { replace: true });
          });
        }
      })
      .catch((error: unknown) => {
        setCatalogStatus("error");
        setCatalogError(error instanceof Error ? error.message : "Failed to load source catalog.");
      });
  }, []);

  useEffect(() => {
    void listLibraryEntries()
      .then((entries) => {
        const nextState: Record<string, string> = {};

        for (const entry of entries) {
          nextState[`${entry.sourceId}:${entry.sourceTitleId}`] = entry.libraryEntryId;
        }

        setLibraryState(nextState);
      })
      .catch(() => {
        setLibraryNotice(null);
      });
  }, []);

  useEffect(() => {
    setQueryDraft(activeQuery);
  }, [activeQuery]);

  useEffect(() => {
    if (!activeSource) {
      return;
    }

    setResultsStatus("loading");
    setResultsError(null);

    const task = activeQuery
      ? searchSourceTitles(activeSource.metadata.sourceId, activeQuery, page)
      : browseSourceTitles(activeSource.metadata.sourceId, page);

    void task
      .then((payload) => {
        setResults({
          items: payload.items,
          page: payload.page,
          hasNextPage: payload.hasNextPage,
        });
        setResultsStatus("ready");
      })
      .catch((error: unknown) => {
        setResultsStatus("error");
        setResultsError(error instanceof Error ? error.message : "Failed to load source results.");
      });
  }, [activeSource?.metadata.sourceId, activeQuery, page]);

  useEffect(() => {
    if (!activeSource || !titleId) {
      setDetail(null);
      setDetailStatus("idle");
      setDetailError(null);
      return;
    }

    setDetailStatus("loading");
    setDetailError(null);

    void getSourceTitle(activeSource.metadata.sourceId, titleId)
      .then((payload) => {
        setDetail(payload);
        setDetailStatus("ready");
      })
      .catch((error: unknown) => {
        setDetailStatus("error");
        setDetailError(error instanceof Error ? error.message : "Failed to load title details.");
      });
  }, [activeSource?.metadata.sourceId, titleId]);

  useEffect(() => {
    if (!activeSource || !titleId) {
      setReaderState(null);
      return;
    }

    const libraryEntryId = libraryState[`${activeSource.metadata.sourceId}:${titleId}`] ?? null;

    void getReaderState(activeSource.metadata.sourceId, titleId, libraryEntryId)
      .then((snapshot) => {
        setReaderState({
          progressChapterId: snapshot.progress?.lastReadChapterId ?? null,
          libraryEntryId: snapshot.libraryEntryId,
        });
      })
      .catch(() => {
        setReaderState({
          progressChapterId: null,
          libraryEntryId,
        });
      });
  }, [activeSource?.metadata.sourceId, libraryState, titleId]);

  function updateParams(patch: Record<string, string | null>, replace = false) {
    const nextParams = new URLSearchParams(searchParams);

    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    }

    startTransition(() => {
      setSearchParams(nextParams, { replace });
    });
  }

  function handleSourceChange(nextSourceId: string) {
    updateParams({
      source: nextSourceId,
      page: "1",
      query: activeQuery || null,
      title: null,
    });
  }

  function handleSubmitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateParams({
      query: queryDraft.trim() || null,
      page: "1",
      title: null,
    });
  }

  function handleBrowseReset() {
    setQueryDraft("");
    updateParams({
      query: null,
      page: "1",
      title: null,
    });
  }

  function handleSelectTitle(nextTitleId: string) {
    updateParams({
      title: nextTitleId,
    });
  }

  function handleChangePage(nextPage: number) {
    updateParams({
      page: String(nextPage),
      title: null,
    });
  }

  function handleAddToLibrary() {
    if (!activeSource || !detail || isSavingToLibrary) {
      return;
    }

    setIsSavingToLibrary(true);
    setLibraryNotice(null);

    void addLibraryEntry({
      sourceId: activeSource.metadata.sourceId,
      sourceTitleId: detail.details.titleId,
      titleName: detail.details.name,
      sourceTitleSlug: detail.details.slug,
      coverUrl: detail.details.coverUrl,
    })
      .then((entry) => {
        setLibraryState((current) => ({
          ...current,
          [`${entry.sourceId}:${entry.sourceTitleId}`]: entry.libraryEntryId,
        }));
        setReaderState((current) => ({
          progressChapterId: current?.progressChapterId ?? null,
          libraryEntryId: entry.libraryEntryId,
        }));
        setLibraryNotice(`Saved "${entry.titleName}" to the local library.`);
      })
      .catch((error: unknown) => {
        setLibraryNotice(error instanceof Error ? error.message : "Failed to save title to library.");
      })
      .finally(() => {
        setIsSavingToLibrary(false);
      });
  }

  function handleOpenReader(chapterId: string | null) {
    if (!activeSource || !detail || !chapterId) {
      return;
    }

    const nextParams = new URLSearchParams({
      source: activeSource.metadata.sourceId,
      title: detail.details.titleId,
      chapter: chapterId,
    });

    if (readerState?.libraryEntryId) {
      nextParams.set("libraryEntry", readerState.libraryEntryId);
    }

    navigate(`/reader?${nextParams.toString()}`);
  }

  const defaultReadableChapterId = detail
    ? detail.chapters.filter((chapter) => chapter.availability === "readable").at(-1)?.chapterId ?? null
    : null;
  const continueChapterId = readerState?.progressChapterId ?? defaultReadableChapterId;

  return (
    <div className="browse-page">
      <section className="page__header page__header--split">
        <div>
          <span className="page__eyebrow">Browse</span>
          <h1 className="page__title page__title--compact">
            {activeSource?.metadata.displayName ?? "Sources"}
          </h1>
        </div>
        <div className="browse-hero__facts">
          <div className="page__card">
            <div className="page__card-label">Sources</div>
            <div className="page__card-value">{catalog.length || "--"}</div>
          </div>
          <div className="page__card">
            <div className="page__card-label">Mode</div>
            <div className="page__card-value">{activeQuery ? "Scoped search" : "Browse feed"}</div>
          </div>
          <div className="page__card">
            <div className="page__card-label">Active detail</div>
            <div className="page__card-value">{titleId ? "Open" : "None"}</div>
          </div>
        </div>
      </section>

      <section className="browse-controls">
        <div className="browse-controls__group">
          <label className="browse-controls__label" htmlFor="source-select">
            Source
          </label>
          <select
            id="source-select"
            className="browse-controls__select"
            value={activeSource?.metadata.sourceId ?? ""}
            onChange={(event) => handleSourceChange(event.target.value)}
            disabled={catalogStatus !== "ready"}
          >
            {catalog.map((source) => (
              <option key={source.metadata.sourceId} value={source.metadata.sourceId}>
                {source.metadata.displayName}
              </option>
            ))}
          </select>
        </div>

        <form className="browse-search" onSubmit={handleSubmitSearch}>
          <label className="browse-controls__label" htmlFor="source-query">
            Search inside source
          </label>
          <div className="browse-search__row">
            <input
              id="source-query"
              className="browse-search__input"
              type="search"
              placeholder="Search titles in the selected source"
              value={queryDraft}
              onChange={(event) => setQueryDraft(event.target.value)}
            />
            <button className="browse-search__button" type="submit">
              Search
            </button>
            <button className="browse-search__button browse-search__button--ghost" type="button" onClick={handleBrowseReset}>
              Browse
            </button>
          </div>
        </form>
      </section>

      {catalogError ? <p className="browse-message browse-message--error">{catalogError}</p> : null}
      {catalogStatus === "loading" ? <p className="browse-message">Loading sources…</p> : null}

      <section className="browse-layout">
        <div className="browse-results">
          <div className="browse-results__header">
            <div>
              <h2 className="browse-section__title">
                {activeSource?.metadata.displayName ?? "Source results"}
              </h2>
              <p className="browse-section__copy">
                {activeQuery
                  ? `Scoped search for "${activeQuery}" inside the selected source.`
                  : "Source feed from the normalized browse runtime."}
              </p>
            </div>
            {results ? (
              <div className="browse-results__meta">
                <span>{results.items.length} items</span>
                <span>Page {results.page}</span>
              </div>
            ) : null}
          </div>

          {resultsError ? <p className="browse-message browse-message--error">{resultsError}</p> : null}
          {resultsStatus === "loading" ? <p className="browse-message">Loading source results…</p> : null}

          <div className="browse-results__grid">
            {results?.items.map((item) => (
              <article
                key={`${activeSource?.metadata.sourceId}:${item.titleId}`}
                className={`browse-title-card${titleId === item.titleId ? " browse-title-card--active" : ""}`}
              >
                <button
                  type="button"
                  className="browse-title-card__action"
                  onClick={() => handleSelectTitle(item.titleId)}
                >
                  <div className="browse-title-card__cover-wrap">
                    {item.coverUrl ? (
                      <img className="browse-title-card__cover" src={item.coverUrl} alt={item.name} />
                    ) : (
                      <div className="browse-title-card__cover browse-title-card__cover--empty">No cover</div>
                    )}
                  </div>
                  <div className="browse-title-card__body">
                    <div className="browse-title-card__topline">
                      <span className={`browse-status browse-status--${item.status}`}>{item.statusLabel ?? item.status}</span>
                      {item.latestChapterLabel ? <span className="browse-title-card__latest">{item.latestChapterLabel}</span> : null}
                    </div>
                    <h3 className="browse-title-card__title">{item.name}</h3>
                    {item.descriptionSnippet ? (
                      <p className="browse-title-card__copy">{item.descriptionSnippet}</p>
                    ) : null}
                    {item.tags.length ? (
                      <div className="browse-tag-row">
                        {item.tags.slice(0, 4).map((tag) => (
                          <span className="browse-tag" key={`${item.titleId}:${tag}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </button>
              </article>
            ))}
          </div>

          {results?.items.length === 0 && resultsStatus === "ready" ? (
            <p className="browse-message">No titles matched this source query.</p>
          ) : null}

          <div className="browse-pagination">
            <button
              type="button"
              className="browse-search__button browse-search__button--ghost"
              disabled={!results || results.page <= 1}
              onClick={() => handleChangePage((results?.page ?? 1) - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="browse-search__button browse-search__button--ghost"
              disabled={!results?.hasNextPage}
              onClick={() => handleChangePage((results?.page ?? 1) + 1)}
            >
              Next
            </button>
          </div>
        </div>

        <aside className="browse-detail">
          {!titleId ? (
            <div className="browse-empty-detail">
              <span className="page__eyebrow">Title details</span>
              <h2 className="browse-section__title">Select a title to inspect its normalized details</h2>
              <p className="browse-section__copy">
                The details panel shows source identity, summary, status, tags, and chapter availability from the shared adapter model.
              </p>
            </div>
          ) : null}

          {detailError ? <p className="browse-message browse-message--error">{detailError}</p> : null}
          {detailStatus === "loading" ? <p className="browse-message">Loading title details…</p> : null}

          {detail ? (
            <div className="browse-detail-card">
              <div className="browse-detail-card__hero">
                <div className="browse-detail-card__cover-wrap">
                  {detail.details.coverUrl ? (
                    <img className="browse-detail-card__cover" src={detail.details.coverUrl} alt={detail.details.name} />
                  ) : (
                    <div className="browse-detail-card__cover browse-detail-card__cover--empty">No cover</div>
                  )}
                </div>
                <div className="browse-detail-card__hero-copy">
                  <div className="browse-detail-card__source-line">
                    <span className="browse-pill">{detail.details.sourceLabel ?? activeSource?.metadata.displayName}</span>
                    <span className={`browse-status browse-status--${detail.details.status}`}>
                      {detail.details.statusLabel ?? detail.details.status}
                    </span>
                  </div>
                  <h2 className="browse-detail-card__title">{detail.details.name}</h2>
                  <p className="browse-detail-card__summary">
                    {detail.details.description ?? "No summary was exposed by the source adapter."}
                  </p>
                  <div className="browse-detail-card__actions">
                    <button
                      type="button"
                      className="browse-search__button browse-search__button--ghost"
                      disabled={!defaultReadableChapterId}
                      onClick={() => handleOpenReader(defaultReadableChapterId)}
                    >
                      Read
                    </button>
                    <button
                      type="button"
                      className="browse-search__button browse-search__button--ghost"
                      disabled={!continueChapterId}
                      onClick={() => handleOpenReader(continueChapterId)}
                    >
                      Continue
                    </button>
                    <button
                      type="button"
                      className="browse-search__button"
                      onClick={handleAddToLibrary}
                      disabled={
                        isSavingToLibrary ||
                        Boolean(
                          libraryState[
                            `${activeSource?.metadata.sourceId}:${detail.details.titleId}`
                          ],
                        )
                      }
                    >
                      {libraryState[`${activeSource?.metadata.sourceId}:${detail.details.titleId}`]
                        ? "Saved to library"
                        : isSavingToLibrary
                          ? "Saving…"
                          : "Add to library"}
                    </button>
                    <a
                      className="browse-search__button browse-search__button--ghost browse-search__button--link"
                      href={detail.details.canonicalUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open source page
                    </a>
                  </div>
                  {libraryNotice ? <p className="browse-message">{libraryNotice}</p> : null}
                  <div className="browse-detail-card__facts">
                    <div>
                      <span className="browse-detail-card__fact-label">Language</span>
                      <strong>{detail.details.originalLanguage ?? activeSource?.metadata.language ?? "Unknown"}</strong>
                    </div>
                    <div>
                      <span className="browse-detail-card__fact-label">Chapters</span>
                      <strong>{detail.chapters.length}</strong>
                    </div>
                    <div>
                      <span className="browse-detail-card__fact-label">Readable now</span>
                      <strong>
                        {detail.chapters.filter((chapter) => chapter.availability === "readable").length}
                      </strong>
                    </div>
                    <div>
                      <span className="browse-detail-card__fact-label">Resume</span>
                      <strong>{readerState?.progressChapterId ?? "No saved progress"}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {detail.details.tags.length ? (
                <div className="browse-tag-row">
                  {detail.details.tags.map((tag) => (
                    <span className="browse-tag" key={`${detail.details.titleId}:${tag}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="browse-chapters">
                <div className="browse-chapters__header">
                  <h3 className="browse-section__title">Chapter availability</h3>
                  <button
                    type="button"
                    className="browse-search__button browse-search__button--ghost"
                    onClick={() => updateParams({ title: null })}
                  >
                    Close detail
                  </button>
                </div>
                <div className="browse-chapter-table">
                  <div className="browse-chapter-table__head">
                    <span>Chapter</span>
                    <span>Status</span>
                    <span>Published</span>
                  </div>
                  {detail.chapters.map((chapter) => (
                    <div className="browse-chapter-row" key={`${detail.details.titleId}:${chapter.chapterId}`}>
                      <div>
                        <strong>{chapter.title}</strong>
                        {chapter.groupName ? <span>{chapter.groupName}</span> : null}
                      </div>
                      <div>
                        <span className={`browse-availability browse-availability--${chapter.availability}`}>
                          {chapter.availabilityLabel ?? availabilityLabel(chapter.availability)}
                        </span>
                      </div>
                      <div>
                        <div className="browse-chapter-row__actions">
                          <span>{chapter.releaseDate ? new Date(chapter.releaseDate).toLocaleDateString() : "Unknown"}</span>
                          <button
                            type="button"
                            className="browse-search__button browse-search__button--ghost browse-search__button--inline"
                            disabled={chapter.availability !== "readable"}
                            onClick={() => handleOpenReader(chapter.chapterId)}
                          >
                            Read
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
