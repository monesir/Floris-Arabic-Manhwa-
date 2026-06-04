import { startTransition, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type {
  SourceCatalogItem,
  SourceChapterAvailability,
  SourceChapterSummary,
  SourceTitleDetails,
  SourceTitleSummary,
} from "@contracts/source";
import type { LibraryCustomList } from "@contracts/library";
import {
  browseSourceTitles,
  getSourceCatalog,
  getSourceTitle,
  searchSourceTitles,
} from "@renderer/shared/source-registry";
import { enqueueDownload } from "@renderer/shared/downloads-store";
import { addLibraryEntry, listLibraryEntries, listLibraryLists, addLibraryEntryToList, removeLibraryEntryFromList, updateLibraryTotalChapterCount, removeLibraryEntry } from "@renderer/shared/library-store";
import { getReaderState } from "@renderer/shared/reader-store";
import { listCompletedChapterIds } from "@renderer/shared/analytics-store";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CachedImage } from "@renderer/shared/CachedImage";

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
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const now = new Date();
  const diffTime = now.getTime() - parsed.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 0 && diffDays < 7) return `${diffDays} days ago`;

  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed);
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
  const [libraryListsState, setLibraryListsState] = useState<Record<string, string[]>>({});
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [libraryNotice, setLibraryNotice] = useState<string | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [isSavingToLibrary, setIsSavingToLibrary] = useState(false);
  const [readerState, setReaderState] = useState<{ progressChapterId: string | null; libraryEntryId: string | null } | null>(null);
  const navigate = useNavigate();
  const [browseCoverMap, setBrowseCoverMap] = useState<Record<string, string>>({});
  const [availableLists, setAvailableLists] = useState<LibraryCustomList[]>([]);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [selectedListsForAdd, setSelectedListsForAdd] = useState<string[]>([]);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const [completedChapterIds, setCompletedChapterIds] = useState<Set<string>>(new Set());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const sourceId = searchParams.get("source");
  const activeQuery = searchParams.get("query") ?? "";
  const [internalPage, setInternalPage] = useState(1);
  const [accumulatedItems, setAccumulatedItems] = useState<SourceTitleSummary[]>([]);
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
        const filteredCatalog = nextCatalog.filter(s => s.metadata.displayName !== "Local Imports");
        setCatalog(filteredCatalog);
        setCatalogStatus("ready");

        if (!sourceId && filteredCatalog[0]) {
          startTransition(() => {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.set("source", filteredCatalog[0].metadata.sourceId);
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
        const nextListsState: Record<string, string[]> = {};

        for (const entry of entries) {
          nextState[`${entry.sourceId}:${entry.sourceTitleId}`] = entry.libraryEntryId;
          nextListsState[entry.libraryEntryId] = entry.listIds ?? [];
        }

        setLibraryState(nextState);
        setLibraryListsState(nextListsState);
      })
      .catch(() => {
        setLibraryNotice(null);
      });
  }, []);

  useEffect(() => {
    setQueryDraft(prev => {
      if (activeQuery !== prev && activeQuery !== prev.trim()) {
        return activeQuery;
      }
      return prev;
    });
  }, [activeQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = queryDraft.trim() || null;
      setSearchParams(prev => {
        const currentQuery = prev.get("query") || null;
        if (trimmed === currentQuery) return prev;
        
        const next = new URLSearchParams(prev);
        if (trimmed) {
          next.set("query", trimmed);
        } else {
          next.delete("query");
        }
        next.set("page", "1");
        next.delete("title");
        return next;
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [queryDraft, setSearchParams]);

  useEffect(() => {
    setInternalPage(1);
    setAccumulatedItems([]);
  }, [activeSource?.metadata.sourceId, activeQuery, refreshTrigger]);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (resultsStatus === "loading") return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && results?.hasNextPage) {
        setInternalPage(prev => prev + 1);
      }
    });
    if (node) observerRef.current.observe(node);
  }, [resultsStatus, results?.hasNextPage]);

  useEffect(() => {
    if (!activeSource) {
      return;
    }

    setResultsStatus("loading");
    setResultsError(null);

    const task = activeQuery
      ? searchSourceTitles(activeSource.metadata.sourceId, activeQuery, internalPage)
      : browseSourceTitles(activeSource.metadata.sourceId, internalPage);

    void task
      .then((payload) => {
        setResults({
          items: payload.items,
          page: payload.page,
          hasNextPage: payload.hasNextPage,
        });
        setAccumulatedItems(prev => {
          if (payload.page === 1) return payload.items;
          const existingIds = new Set(prev.map(i => i.titleId));
          const newItems = payload.items.filter(i => !existingIds.has(i.titleId));
          return [...prev, ...newItems];
        });
        setResultsStatus("ready");
      })
      .catch((error: unknown) => {
        setResultsStatus("error");
        setResultsError(error instanceof Error ? error.message : "Failed to load source results.");
      });
  }, [activeSource?.metadata.sourceId, activeQuery, internalPage, refreshTrigger]);

  useEffect(() => {
    if (!activeSource || !titleId) {
      setDetail(null);
      setDetailStatus("idle");
      setDetailError(null);
      return;
    }

    setDetail(null);
    setDetailStatus("loading");
    setDetailError(null);

    void getSourceTitle(activeSource.metadata.sourceId, titleId)
      .then((payload) => {
        setDetail(payload);
        setDetailStatus("ready");

        // Update total chapter count in library if entry exists
        const libraryKey = `${activeSource.metadata.sourceId}:${titleId}`;
        const libraryEntryId = libraryState[libraryKey];
        if (libraryEntryId) {
          const readableChapters = payload.chapters.filter((ch) => ch.availability === "readable");
          const totalCount = readableChapters.length || payload.chapters.length;
          void updateLibraryTotalChapterCount(libraryEntryId, totalCount);
        }
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

  useEffect(() => {
    if (!titleId) return;
    void listLibraryLists().then(setAvailableLists).catch(() => {});
  }, [titleId]);

  useEffect(() => {
    if (!activeSource || !titleId) {
      setCompletedChapterIds(new Set());
      return;
    }
    void listCompletedChapterIds(activeSource.metadata.sourceId, titleId)
      .then((ids) => setCompletedChapterIds(new Set(ids)))
      .catch(() => setCompletedChapterIds(new Set()));
  }, [activeSource?.metadata.sourceId, titleId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setShowCategoryMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
    // Save clean cover from browse results before navigating to detail
    const browseItem = results?.items.find((item) => item.titleId === nextTitleId);
    if (browseItem?.coverUrl) {
      setBrowseCoverMap((prev) => ({ ...prev, [nextTitleId]: browseItem.coverUrl as string }));
    }
    updateParams({
      title: nextTitleId,
    }, true);
  }

  function handleRefreshDetail() {
    if (!activeSource || !titleId) return;
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
  }

  function handleAddToLibrary(targetListIds?: string[]) {
    if (!activeSource || !detail || isSavingToLibrary) {
      return;
    }

    setIsSavingToLibrary(true);
    setLibraryNotice(null);

    const existingEntryId = libraryState[`${activeSource.metadata.sourceId}:${detail.details.titleId}`];

    if (existingEntryId && targetListIds) {
      // Entry already in library — diff current vs selected
      const currentLists = libraryListsState[existingEntryId] ?? [];
      const toAdd = targetListIds.filter(id => !currentLists.includes(id));
      const toRemove = currentLists.filter(id => !targetListIds.includes(id));

      const ops: Promise<unknown>[] = [
        ...toAdd.map(id => addLibraryEntryToList(existingEntryId, id)),
        ...toRemove.map(id => removeLibraryEntryFromList(existingEntryId, id)),
      ];

      if (ops.length === 0) {
        setIsSavingToLibrary(false);
        setShowCategoryMenu(false);
        return;
      }

      Promise.all(ops)
        .then(() => {
          setLibraryListsState(prev => ({ ...prev, [existingEntryId]: [...targetListIds] }));
          setLibraryNotice(`Updated lists.`);
        })
        .catch(() => {
          setLibraryNotice(`Failed to update lists.`);
        })
        .finally(() => {
          setIsSavingToLibrary(false);
        });
      return;
    }

    void addLibraryEntry({
      sourceId: activeSource.metadata.sourceId,
      sourceTitleId: detail.details.titleId,
      titleName: detail.details.name,
      sourceTitleSlug: detail.details.slug,
      coverUrl: browseCoverMap[detail.details.titleId] || detail.details.coverUrl,
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

        // Update total chapter count immediately so unread badge shows in library
        if (detail) {
          const readableChapters = detail.chapters.filter((ch) => ch.availability === "readable");
          const totalCount = readableChapters.length || detail.chapters.length;
          void updateLibraryTotalChapterCount(entry.libraryEntryId, totalCount);
        }

        if (targetListIds && targetListIds.length > 0) {
          Promise.all(targetListIds.map(id => addLibraryEntryToList(entry.libraryEntryId, id)))
            .then(() => {
              setLibraryNotice(`Saved "${entry.titleName}" to selected lists.`);
            })
            .catch(() => {
              setLibraryNotice(`Saved "${entry.titleName}" to the local library.`);
            });
        } else {
          setLibraryNotice(`Saved "${entry.titleName}" to the local library.`);
        }
      })
      .catch((error: unknown) => {
        setLibraryNotice(error instanceof Error ? error.message : "Failed to save title to library.");
      })
      .finally(() => {
        setIsSavingToLibrary(false);
      });
  }

  function handleRemoveFromLibrary() {
    const savedLibraryEntryId = activeSource && detail
      ? libraryState[`${activeSource.metadata.sourceId}:${detail.details.titleId}`]
      : null;
      
    if (!savedLibraryEntryId || isSavingToLibrary) {
      return;
    }

    setIsSavingToLibrary(true);
    setLibraryNotice(null);

    void removeLibraryEntry(savedLibraryEntryId)
      .then(() => {
        setLibraryState((current) => {
          const next = { ...current };
          if (activeSource && detail) {
            delete next[`${activeSource.metadata.sourceId}:${detail.details.titleId}`];
          }
          return next;
        });
        setReaderState((current) => ({
          progressChapterId: current?.progressChapterId ?? null,
          libraryEntryId: null,
        }));
        setLibraryNotice("Removed from library");
        setTimeout(() => setLibraryNotice(null), 3000);
      })
      .catch((error: unknown) => {
        setLibraryNotice(error instanceof Error ? error.message : "Failed to remove from library");
        setTimeout(() => setLibraryNotice(null), 5000);
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
          <section className="floirs-toolbar floirs-toolbar--browse" style={{ gap: '0.5rem' }}>
            <form className="floirs-toolbar__actions floirs-toolbar__actions--stretch" onSubmit={handleSubmitSearch}>
              <div className="floirs-search-shell floirs-search-shell--wide" style={{ flex: 'none', width: 'auto' }}>
                <input
                  id="source-query"
                  className="floirs-search-input"
                  type="search"
                  placeholder="Search for a series..."
                  value={queryDraft}
                  onChange={(event) => setQueryDraft(event.target.value)}
                />
              </div>

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


              <button 
                className="floirs-button floirs-button--icon" 
                type="button" 
                onClick={() => setRefreshTrigger((n) => n + 1)}
                title="Refresh"
                disabled={resultsStatus === "loading"}
              >
                <svg className={resultsStatus === "loading" ? "spin" : ""} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <path d="M3 3v5h5"></path>
                </svg>
              </button>
            </form>
          </section>

          {catalogError ? <p className="browse-message browse-message--error">{catalogError}</p> : null}
          {catalogStatus === "loading" ? <p className="browse-message">Loading sources...</p> : null}
          {resultsStatus === "error" ? <p className="browse-message browse-message--error">{resultsError}</p> : null}
          {resultsStatus === "loading" && !results ? <p className="browse-message">Loading source results...</p> : null}

          <section className="floirs-grid floirs-grid--browse">
            {accumulatedItems.map((item) => (
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
                      <CachedImage className="floirs-cover-card__image" src={item.coverUrl} alt={item.name} />
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
            <p className="browse-message">Nothing.</p>
          ) : null}

          <div className="browse-pagination browse-pagination--floirs">
            {results?.hasNextPage && (
              <div ref={loadMoreRef} style={{ padding: '2rem 0', width: '100%', textAlign: 'center' }}>
                {resultsStatus === "loading" && <p className="browse-message">Loading more...</p>}
              </div>
            )}
          </div>
        </>
      ) : null}

      {titleId ? (
        <section className="series-detail">


          {detailError ? <p className="browse-message browse-message--error">{detailError}</p> : null}
          {detailStatus === "loading" && !detail ? (
            <div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p className="browse-message">Loading title details...</p>
            </div>
          ) : null}

          {detail ? (
            <>
              <div className="series-detail__hero">
                <div className="series-detail__backbar" style={{ position: 'absolute', top: '1.5rem', left: '2rem', zIndex: 20 }}>
                  <button
                    type="button"
                    className="floirs-button floirs-button--icon"
                    title="Back"
                    onClick={() => navigate(-1)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12"></line>
                      <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                  </button>
                </div>
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
                  <a
                    href={detail.details.canonicalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="floirs-button floirs-button--icon"
                    title="Open source page"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                  </a>
                  <button
                    type="button"
                    className="floirs-button floirs-button--icon"
                    onClick={handleRefreshDetail}
                    title="Refresh Chapters"
                    disabled={detailStatus === "loading"}
                  >
                    <svg className={detailStatus === "loading" ? "spin" : ""} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                  </button>
                  <div style={{ position: 'relative' }} ref={categoryMenuRef}>
                    <button
                        type="button"
                        className="floirs-button"
                        onClick={() => {
                          if (availableLists.length > 0) {
                            // Pre-select lists the entry already belongs to
                            if (savedLibraryEntryId) {
                              const currentLists = libraryListsState[savedLibraryEntryId] ?? [];
                              setSelectedListsForAdd(currentLists);
                            } else {
                              setSelectedListsForAdd([]);
                            }
                            setShowCategoryMenu(!showCategoryMenu);
                          } else {
                            handleAddToLibrary();
                          }
                        }}
                        disabled={isSavingToLibrary}
                        style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}
                      >
                        {isSavingToLibrary ? "Saving..." : savedLibraryEntryId ? "Add or Edit" : "Add"}
                      </button>
                    {showCategoryMenu && (
                      <div className="floirs-menu" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', width: '220px', zIndex: 100, background: '#000000', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', padding: '0.5rem' }}>
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {!savedLibraryEntryId && (
                            <label
                              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.5rem', color: '#e0e0e0', cursor: 'pointer', fontSize: '0.85rem', borderRadius: '4px' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#333333'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <input
                                type="checkbox"
                                checked={selectedListsForAdd.length === 0}
                                onChange={() => setSelectedListsForAdd([])}
                              />
                              Default Library
                            </label>
                          )}
                          {availableLists.map((list) => (
                            <label
                              key={list.listId}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.5rem', color: '#e0e0e0', cursor: 'pointer', fontSize: '0.85rem', borderRadius: '4px' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#333333'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <input
                                type="checkbox"
                                checked={selectedListsForAdd.includes(list.listId)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedListsForAdd(prev => [...prev, list.listId]);
                                  } else {
                                    setSelectedListsForAdd(prev => prev.filter(id => id !== list.listId));
                                  }
                                }}
                              />
                              {list.name}
                            </label>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="floirs-button"
                          style={{ width: '100%', marginTop: '0.5rem', padding: '0.4rem', background: '#333333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', transition: 'background 0.15s' }}
                          onClick={() => {
                            setShowCategoryMenu(false);
                            handleAddToLibrary(selectedListsForAdd);
                            // Update local listIds state
                            if (savedLibraryEntryId) {
                              setLibraryListsState(prev => ({ ...prev, [savedLibraryEntryId]: [...selectedListsForAdd] }));
                            }
                            setSelectedListsForAdd([]);
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#555555'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#333333'}
                        >
                          Confirm Add
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="series-detail__header">
                <div className="series-detail__cover-panel">
                  {(browseCoverMap[detail.details.titleId] || detail.details.coverUrl) ? (
                    <CachedImage className="series-detail__cover" src={(browseCoverMap[detail.details.titleId] || detail.details.coverUrl)!} alt={detail.details.name} />
                  ) : (
                    <div className="series-detail__cover series-detail__cover--empty">No cover</div>
                  )}
                </div>

                <div className="series-detail__title-block">
                  <div className="series-detail__title-row">
                    <h1 className="series-detail__title">{detail.details.name}</h1>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                    {detail.details.tags.length ? (
                      <div className="series-detail__tags" style={{ margin: 0, flex: 1 }}>
                        {detail.details.tags.map((tag) => (
                          <span className="series-detail__tag" key={`${detail.details.titleId}:${tag}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : <div style={{ flex: 1 }} />}

                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <button
                        type="button"
                        className="floirs-button"
                        disabled={!continueChapterId}
                        onClick={() => handleOpenReader(continueChapterId)}
                        style={{ fontSize: '0.85rem', padding: '0.4rem 1.25rem' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        Continue
                      </button>
                    </div>
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

                  <div className="series-detail__summary-box">
                    {detail.details.description ? (
                      <p className="series-detail__summary" dir="rtl">{detail.details.description}</p>
                    ) : (
                      <p className="series-detail__summary" dir="rtl">لا يوجد وصف.</p>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ maxWidth: '1152px', width: '100%', margin: '0 auto', padding: '0 2rem', position: 'relative', zIndex: 10 }}>

                {libraryNotice ? <p className="browse-message">{libraryNotice}</p> : null}
                {downloadNotice ? <p className="browse-message">{downloadNotice}</p> : null}



                <div className="series-detail__table-wrap">
                  <div className="series-detail__table">
                  <div className="series-detail__table-head">
                    <span>TITLE</span>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', textTransform: 'none', letterSpacing: 'normal' }}>
                      <span className="page__pill" style={{ background: '#0B0B0B', padding: '0.35rem 1rem', fontSize: '0.85rem', fontWeight: 500, color: '#888', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '99px' }}>Chapters: <strong style={{color: '#4aa6ff', marginLeft: '0.25rem'}}>{detail.chapters.length}</strong></span>
                      <span className="page__pill" style={{ background: '#0B0B0B', padding: '0.35rem 1rem', fontSize: '0.85rem', fontWeight: 500, color: '#888', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '99px' }}>Readable: <strong style={{color: '#4ce07a', marginLeft: '0.25rem'}}>{detailReadableCount}</strong></span>
                    </div>
                  </div>

                  {detail.chapters.map((chapter, index) => {
                    const isRead = completedChapterIds.has(chapter.chapterId);
                    return (
                    <div 
                      className="series-detail__table-row" 
                      key={`${detail.details.titleId}:${chapter.chapterId}`}
                      onClick={() => {
                        if (chapter.availability === "readable") {
                          handleOpenReader(chapter.chapterId);
                        }
                      }}
                      style={isRead ? { opacity: 0.55 } : undefined}
                    >
                      <div className="series-detail__cell series-detail__cell--title" title={chapter.title}>
                        {isRead && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginRight: '0.4rem' }}>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        )}
                        <span className="series-detail__title-text">{chapter.title}</span>
                        {chapter.availability !== "readable" && (
                          <span className={`series-detail__chapter-badge series-detail__chapter-badge--${chapter.availability}`}>
                            {chapter.availability === 'locked' && (
                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            )}
                            {chapter.availabilityLabel ?? availabilityLabel(chapter.availability)}
                          </span>
                        )}
                      </div>
                      <div className="series-detail__cell series-detail__cell--actions">
                        <span className="series-detail__cell--date">{formatReleaseDate(chapter.releaseDate)}</span>
                        <div className="series-detail__row-actions">
                          <button
                            type="button"
                            className="series-detail__row-button"
                            disabled={chapter.availability !== "readable"}
                            onClick={() => handleOpenReader(chapter.chapterId)}
                          >
                            Read
                          </button>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
              </div>
            </>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
