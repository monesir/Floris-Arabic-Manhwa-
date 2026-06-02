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
import { enqueueDownload } from "@renderer/shared/downloads-store";
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

function formatReleaseDate(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return parsed.toLocaleDateString();
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
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
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

  function handleQueueChapterDownload(chapterId: string, chapterTitle: string) {
    if (!activeSource || !detail) {
      return;
    }

    setDownloadNotice(null);

    void enqueueDownload({
      sourceId: activeSource.metadata.sourceId,
      sourceTitleId: detail.details.titleId,
      titleName: detail.details.name,
      chapterId,
      chapterTitle,
      coverUrl: detail.details.coverUrl,
    })
      .then((job) => {
        if (!job) {
          throw new Error("Download job was not created.");
        }

        setDownloadNotice(`Queued "${chapterTitle}" for offline download.`);
      })
      .catch((error: unknown) => {
        setDownloadNotice(error instanceof Error ? error.message : "Failed to queue chapter download.");
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
  const savedLibraryEntryId = activeSource && detail
    ? libraryState[`${activeSource.metadata.sourceId}:${detail.details.titleId}`]
    : null;
  const detailBanner = detail?.details.bannerUrl ?? detail?.details.coverUrl ?? null;
  const detailReadableCount = detail
    ? detail.chapters.filter((chapter) => chapter.availability === "readable").length
    : 0;

  return (
    <div className="browse-page browse-page--floirs">
      {!titleId ? (
        <>
          <section className="floirs-toolbar floirs-toolbar--browse">
            <div className="floirs-toolbar__actions">
              <select
                id="source-select"
                className="browse-controls__select browse-controls__select--toolbar"
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

            <form className="floirs-toolbar__actions floirs-toolbar__actions--stretch" onSubmit={handleSubmitSearch}>
              <div className="floirs-search-shell floirs-search-shell--wide">
                <input
                  id="source-query"
                  className="floirs-search-input"
                  type="search"
                  placeholder="Search for a series..."
                  value={queryDraft}
                  onChange={(event) => setQueryDraft(event.target.value)}
                />
              </div>
              <button className="floirs-button" type="submit">
                Search
              </button>
              <button className="floirs-button floirs-button--ghost" type="button" onClick={handleBrowseReset}>
                Reset
              </button>
            </form>
          </section>

          {catalogError ? <p className="browse-message browse-message--error">{catalogError}</p> : null}
          {catalogStatus === "loading" ? <p className="browse-message">Loading sources...</p> : null}
          {resultsError ? <p className="browse-message browse-message--error">{resultsError}</p> : null}
          {resultsStatus === "loading" ? <p className="browse-message">Loading source results...</p> : null}

          <section className="floirs-grid floirs-grid--browse">
            {results?.items.map((item) => (
              <article
                key={`${activeSource?.metadata.sourceId}:${item.titleId}`}
                className="floirs-cover-card floirs-cover-card--browse"
              >
                <button
                  type="button"
                  className="floirs-cover-card__action"
                  onClick={() => handleSelectTitle(item.titleId)}
                >
                  <div className="floirs-cover-card__media">
                    {item.coverUrl ? (
                      <img className="floirs-cover-card__image" src={item.coverUrl} alt={item.name} />
                    ) : (
                      <div className="floirs-cover-card__fallback">No cover</div>
                    )}
                    <div className="floirs-cover-card__overlay">
                      <div className="floirs-cover-card__title" title={item.name}>
                        {item.name}
                      </div>
                    </div>
                  </div>
                </button>
              </article>
            ))}
          </section>

          {results?.items.length === 0 && resultsStatus === "ready" ? (
            <p className="browse-message">No titles matched this source query.</p>
          ) : null}

          <div className="browse-pagination browse-pagination--floirs">
            <button
              type="button"
              className="floirs-button floirs-button--ghost"
              disabled={!results || results.page <= 1}
              onClick={() => handleChangePage((results?.page ?? 1) - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="floirs-button floirs-button--ghost"
              disabled={!results?.hasNextPage}
              onClick={() => handleChangePage((results?.page ?? 1) + 1)}
            >
              Next
            </button>
          </div>
        </>
      ) : null}

      {titleId ? (
        <section className="series-detail">
          <div className="series-detail__backbar">
            <button
              type="button"
              className="series-detail__backbutton"
              onClick={() => updateParams({ title: null })}
            >
              Back to library
            </button>
          </div>

          {detailError ? <p className="browse-message browse-message--error">{detailError}</p> : null}
          {detailStatus === "loading" ? <p className="browse-message">Loading title details...</p> : null}

          {detail ? (
            <>
              <div className="series-detail__hero">
                <div
                  className="series-detail__banner"
                  style={
                    detailBanner
                      ? {
                          backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0.28), rgba(0, 0, 0, 0.74)), url(${detailBanner})`,
                        }
                      : undefined
                  }
                />
                <div className="series-detail__hero-actions">
                  <button type="button" className="series-detail__hero-button series-detail__hero-button--ghost">
                    Trackers
                  </button>
                  <button
                    type="button"
                    className="series-detail__hero-button series-detail__hero-button--ghost"
                    onClick={() => handleSelectTitle(detail.details.titleId)}
                  >
                    Refresh
                  </button>
                </div>
              </div>

              <div className="series-detail__header">
                <div className="series-detail__cover-panel">
                  {detail.details.coverUrl ? (
                    <img className="series-detail__cover" src={detail.details.coverUrl} alt={detail.details.name} />
                  ) : (
                    <div className="series-detail__cover series-detail__cover--empty">No cover</div>
                  )}
                </div>

                <div className="series-detail__title-block">
                  <div className="series-detail__title-row">
                    <h1 className="series-detail__title">{detail.details.name}</h1>
                    <span className="series-detail__source-badge">
                      {detail.details.sourceLabel ?? activeSource?.metadata.displayName}
                    </span>
                  </div>

                  <div className="series-detail__meta-cards">
                    <div className="series-detail__meta-card">
                      <span className="series-detail__meta-label">Creator(s)</span>
                      <strong>
                        {detail.details.authors[0] ?? detail.details.artists[0] ?? detail.details.name}
                      </strong>
                    </div>
                    <div className="series-detail__meta-card">
                      <span className="series-detail__meta-label">Status</span>
                      <strong>{detail.details.statusLabel ?? detail.details.status}</strong>
                    </div>
                    <div className="series-detail__meta-card">
                      <span className="series-detail__meta-label">Original Language</span>
                      <strong>{detail.details.originalLanguage ?? activeSource?.metadata.language ?? "Unknown"}</strong>
                    </div>
                  </div>

                  {detail.details.tags.length ? (
                    <div className="series-detail__tags">
                      {detail.details.tags.map((tag) => (
                        <span className="series-detail__tag" key={`${detail.details.titleId}:${tag}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="series-detail__chapter-toolbar">
                    <div className="series-detail__filters">
                      <button type="button" className="series-detail__filter">Language</button>
                      <button type="button" className="series-detail__filter">Group</button>
                    </div>

                    <div className="series-detail__primary-actions">
                      <button
                        type="button"
                        className="series-detail__hero-button series-detail__hero-button--ghost"
                        disabled={!defaultReadableChapterId}
                        onClick={() => handleOpenReader(defaultReadableChapterId)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="series-detail__hero-button"
                        disabled={!continueChapterId}
                        onClick={() => handleOpenReader(continueChapterId)}
                      >
                        Continue
                      </button>
                    </div>
                  </div>

                  <div className="series-detail__secondary-actions">
                    <button
                      type="button"
                      className="floirs-button"
                      onClick={handleAddToLibrary}
                      disabled={isSavingToLibrary || Boolean(savedLibraryEntryId)}
                    >
                      {savedLibraryEntryId ? "Saved to library" : isSavingToLibrary ? "Saving..." : "Add to library"}
                    </button>
                    <a
                      className="floirs-button floirs-button--ghost"
                      href={detail.details.canonicalUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open source page
                    </a>
                    <span className="page__pill">Chapters: {detail.chapters.length}</span>
                    <span className="page__pill">Readable: {detailReadableCount}</span>
                  </div>

                  {libraryNotice ? <p className="browse-message">{libraryNotice}</p> : null}
                  {downloadNotice ? <p className="browse-message">{downloadNotice}</p> : null}
                  {detail.details.description ? (
                    <p className="series-detail__summary">{detail.details.description}</p>
                  ) : null}
                </div>
              </div>

              <div className="series-detail__table-wrap">
                <div className="series-detail__table">
                  <div className="series-detail__table-head">
                    <span />
                    <span>Title</span>
                    <span>Group</span>
                    <span>Vol</span>
                    <span>Ch</span>
                    <span />
                  </div>

                  {detail.chapters.map((chapter, index) => (
                    <div className="series-detail__table-row" key={`${detail.details.titleId}:${chapter.chapterId}`}>
                      <span className="series-detail__cell series-detail__cell--checkbox">
                        <input type="checkbox" aria-label={`Select ${chapter.title}`} />
                      </span>
                      <div className="series-detail__cell series-detail__cell--title">
                        <strong>{chapter.title}</strong>
                        <span className={`browse-availability browse-availability--${chapter.availability}`}>
                          {chapter.availabilityLabel ?? availabilityLabel(chapter.availability)}
                        </span>
                      </div>
                      <span className="series-detail__cell">{chapter.groupName ?? activeSource?.metadata.displayName ?? "--"}</span>
                      <span className="series-detail__cell">{chapter.volumeNumber ?? "--"}</span>
                      <span className="series-detail__cell">{chapter.chapterNumber ?? detail.chapters.length - index}</span>
                      <div className="series-detail__cell series-detail__cell--actions">
                        <span>{formatReleaseDate(chapter.releaseDate)}</span>
                        <div className="series-detail__row-actions">
                          <button
                            type="button"
                            className="series-detail__row-button"
                            disabled={chapter.availability !== "readable"}
                            onClick={() => handleOpenReader(chapter.chapterId)}
                          >
                            Read
                          </button>
                          <button
                            type="button"
                            className="series-detail__row-button"
                            disabled={chapter.availability !== "readable"}
                            onClick={() => handleQueueChapterDownload(chapter.chapterId, chapter.title)}
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
