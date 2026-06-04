import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ReaderFitMode,
  ReaderMode,
  ReaderPreferences,
  ReaderStateSnapshot,
} from "@contracts/reader";
import type { SourceChapterSummary, SourceTitleDetails } from "@contracts/source";
import {
  DEFAULT_READER_PREFERENCES,
} from "@contracts/reader";
import { endReaderSession, startReaderSession } from "@renderer/shared/analytics-store";
import { getReaderState, saveReadingProgress, updateReaderPreferences } from "@renderer/shared/reader-store";
import { getSourceChapterPages, getSourceTitle } from "@renderer/shared/source-registry";
import { useNavigate, useSearchParams } from "react-router-dom";

type ReaderLoadState = {
  details: SourceTitleDetails;
  chapters: SourceChapterSummary[];
} | null;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getReadableChapters(chapters: SourceChapterSummary[]) {
  return chapters.filter((chapter) => chapter.availability === "readable");
}

function getDefaultChapterId(chapters: SourceChapterSummary[]) {
  const readable = getReadableChapters(chapters);
  return readable.at(-1)?.chapterId ?? chapters.at(-1)?.chapterId ?? null;
}

function getOlderChapter(chapters: SourceChapterSummary[], currentChapterId: string | null) {
  const index = chapters.findIndex((chapter) => chapter.chapterId === currentChapterId);
  if (index === -1) {
    return null;
  }

  for (let nextIndex = index + 1; nextIndex < chapters.length; nextIndex += 1) {
    const chapter = chapters[nextIndex];
    if (chapter.availability === "readable") {
      return chapter;
    }
  }

  return null;
}

function getNewerChapter(chapters: SourceChapterSummary[], currentChapterId: string | null) {
  const index = chapters.findIndex((chapter) => chapter.chapterId === currentChapterId);
  if (index === -1) {
    return null;
  }

  for (let nextIndex = index - 1; nextIndex >= 0; nextIndex -= 1) {
    const chapter = chapters[nextIndex];
    if (chapter.availability === "readable") {
      return chapter;
    }
  }

  return null;
}

function resolvePageScale(preferences: ReaderPreferences) {
  if (preferences.fitMode === "fit-height") {
    return { width: "auto", height: `${preferences.zoomPercent}%` };
  }

  if (preferences.fitMode === "free") {
    return {
      width: `${preferences.zoomPercent}%`,
      height: "auto",
    };
  }

  return {
    width: `${preferences.zoomPercent}%`,
    height: "auto",
  };
}

function preferencesEqual(left: ReaderPreferences, right: ReaderPreferences) {
  return (
    left.mode === right.mode &&
    left.fitMode === right.fitMode &&
    left.zoomPercent === right.zoomPercent
  );
}

export function ReaderPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [readerState, setReaderState] = useState<ReaderStateSnapshot | null>(null);
  const [titleState, setTitleState] = useState<ReaderLoadState>(null);
  const [pages, setPages] = useState<Array<{ pageIndex: number; imageUrl: string }>>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [pageStatus, setPageStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<ReaderPreferences>(DEFAULT_READER_PREFERENCES);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const pageElementRefs = useRef<Record<number, HTMLImageElement | null>>({});
  const progressSaveTimeoutRef = useRef<number | null>(null);
  const preferencesSaveTimeoutRef = useRef<number | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);
  const initialScrollChapterRef = useRef<string | null>(null);

  const sourceId = searchParams.get("source");
  const sourceTitleId = searchParams.get("title");
  const currentChapterId = searchParams.get("chapter");
  const explicitLibraryEntryId = searchParams.get("libraryEntry");

  const isPagedMode = preferences.mode === "horizontal" || preferences.mode === "rtl";
  const olderChapter = useMemo(
    () => getOlderChapter(titleState?.chapters ?? [], currentChapterId),
    [currentChapterId, titleState?.chapters],
  );
  const newerChapter = useMemo(
    () => getNewerChapter(titleState?.chapters ?? [], currentChapterId),
    [currentChapterId, titleState?.chapters],
  );
  const resolvedPageCount = pages.length;
  const boundedPageIndex = clamp(currentPageIndex, 0, Math.max(resolvedPageCount - 1, 0));
  const pageScale = resolvePageScale(preferences);

  function updateReaderParams(patch: Record<string, string | null>, replace = false) {
    const nextParams = new URLSearchParams(searchParams);

    for (const [key, value] of Object.entries(patch)) {
      if (!value) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    }

    startTransition(() => {
      setSearchParams(nextParams, { replace });
    });
  }

  function scheduleProgressSave(pageIndex: number, scrollProgress: number) {
    if (!sourceId || !sourceTitleId || !currentChapterId) {
      return;
    }

    const safePageCount = Math.max(pages.length, 1);
    const isChapterComplete = isPagedMode
      ? pageIndex >= safePageCount - 1
      : scrollProgress >= 0.98;

    if (progressSaveTimeoutRef.current !== null) {
      window.clearTimeout(progressSaveTimeoutRef.current);
    }

    progressSaveTimeoutRef.current = window.setTimeout(() => {
      void saveReadingProgress({
        sourceId,
        sourceTitleId,
        libraryEntryId: readerState?.libraryEntryId ?? explicitLibraryEntryId ?? null,
        chapterId: currentChapterId,
        pageIndex,
        pageCount: safePageCount,
        scrollProgress,
        isChapterComplete,
      }).then((nextProgress) => {
        setReaderState((current) =>
          current
            ? {
                ...current,
                libraryEntryId: nextProgress?.libraryEntryId ?? current.libraryEntryId,
                progress: nextProgress,
              }
            : current,
        );
      });
    }, 250);
  }

  function getCurrentScrollProgress() {
    const container = scrollContainerRef.current;
    if (!container) {
      return 0;
    }

    const maxScrollTop = Math.max(container.scrollHeight - container.clientHeight, 1);
    return clamp(container.scrollTop / maxScrollTop, 0, 1);
  }

  function flushProgressNow() {
    if (!sourceId || !sourceTitleId || !currentChapterId) {
      return;
    }

    if (progressSaveTimeoutRef.current !== null) {
      window.clearTimeout(progressSaveTimeoutRef.current);
      progressSaveTimeoutRef.current = null;
    }

    const safePageCount = Math.max(pages.length, 1);
    const pageIndex = isPagedMode ? boundedPageIndex : currentPageIndex;
    const scrollProgress = isPagedMode ? 0 : getCurrentScrollProgress();
    const isChapterComplete = isPagedMode
      ? pageIndex >= safePageCount - 1
      : scrollProgress >= 0.98;

    void saveReadingProgress({
      sourceId,
      sourceTitleId,
      libraryEntryId: readerState?.libraryEntryId ?? explicitLibraryEntryId ?? null,
      chapterId: currentChapterId,
      pageIndex,
      pageCount: safePageCount,
      scrollProgress,
      isChapterComplete,
    }).then((nextProgress) => {
      setReaderState((current) =>
        current
          ? {
              ...current,
              libraryEntryId: nextProgress?.libraryEntryId ?? current.libraryEntryId,
              progress: nextProgress,
            }
          : current,
      );
    });
  }

  useEffect(() => {
    if (!sourceId || !sourceTitleId) {
      setStatus("error");
      setError("Reader route is missing source identity.");
      return;
    }

    setStatus("loading");
    setError(null);

    void Promise.all([
      getSourceTitle(sourceId, sourceTitleId),
      getReaderState(sourceId, sourceTitleId, explicitLibraryEntryId),
    ])
      .then(([payload, nextReaderState]) => {
        const fallbackChapterId =
          nextReaderState.progress?.lastReadChapterId ??
          getDefaultChapterId(payload.chapters);

        setTitleState(payload);
        setReaderState(nextReaderState);
        setPreferences(nextReaderState.preferences);
        setStatus("ready");

        if (!currentChapterId && fallbackChapterId) {
          updateReaderParams(
            {
              source: sourceId,
              title: sourceTitleId,
              libraryEntry: nextReaderState.libraryEntryId ?? explicitLibraryEntryId,
              chapter: fallbackChapterId,
            },
            true,
          );
        }
      })
      .catch((nextError: unknown) => {
        setStatus("error");
        setError(nextError instanceof Error ? nextError.message : "Failed to load reader context.");
      });
  }, [sourceId, sourceTitleId, explicitLibraryEntryId]);

  useEffect(() => {
    if (!sourceId || !sourceTitleId || !currentChapterId) {
      return;
    }

    setPageStatus("loading");
    setError(null);

    void getSourceChapterPages(sourceId, sourceTitleId, currentChapterId)
      .then((nextPages) => {
        setPages(nextPages);
        setPageStatus("ready");

        const progress = readerState?.progress;
        if (progress?.lastReadChapterId === currentChapterId) {
          setCurrentPageIndex(
            clamp(progress.lastReadPageIndex, 0, Math.max(nextPages.length - 1, 0)),
          );
        } else {
          setCurrentPageIndex(0);
        }
      })
      .catch((nextError: unknown) => {
        setPageStatus("error");
        setError(nextError instanceof Error ? nextError.message : "Failed to load chapter pages.");
      });
  }, [currentChapterId, readerState?.progress?.lastReadChapterId, sourceId, sourceTitleId]);

  useEffect(() => {
    if (!titleState || !currentChapterId || pages.length === 0) {
      return;
    }

    const progress = readerState?.progress;
    if (!progress || progress.lastReadChapterId !== currentChapterId) {
      if (!isPagedMode && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      return;
    }

    if (initialScrollChapterRef.current === currentChapterId) {
      return;
    }

    if (isPagedMode) {
      setCurrentPageIndex(clamp(progress.lastReadPageIndex, 0, Math.max(pages.length - 1, 0)));
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    // Check if we can scroll immediately (e.g. cached images)
    window.setTimeout(() => {
      if (initialScrollChapterRef.current === currentChapterId) return;
      
      const targetElement = pageElementRefs.current[progress.lastReadPageIndex];
      if (targetElement && targetElement.clientHeight > 0) {
        targetElement.scrollIntoView({ behavior: "auto", block: "start" });
        initialScrollChapterRef.current = currentChapterId;
      } else if (!targetElement) {
        const maxScrollTop = Math.max(container.scrollHeight - container.clientHeight, 0);
        if (maxScrollTop > 0) {
          container.scrollTop = maxScrollTop * progress.lastReadScrollProgress;
        }
      }
    }, 150);
    
    // Fallback for slower connections if onLoad fails to fire
    window.setTimeout(() => {
      if (initialScrollChapterRef.current === currentChapterId) return;
      
      const targetElement = pageElementRefs.current[progress.lastReadPageIndex];
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "auto", block: "start" });
        // We set it here as a final fallback so we don't try forever
        initialScrollChapterRef.current = currentChapterId;
      }
    }, 1500);
  }, [currentChapterId, isPagedMode, pages.length, readerState?.progress, titleState]);

  useEffect(() => {
    if (!sourceId || !sourceTitleId || status !== "ready") {
      return;
    }

    if (readerState?.preferences && preferencesEqual(preferences, readerState.preferences)) {
      return;
    }

    if (preferencesSaveTimeoutRef.current !== null) {
      window.clearTimeout(preferencesSaveTimeoutRef.current);
    }

    preferencesSaveTimeoutRef.current = window.setTimeout(() => {
      void updateReaderPreferences(preferences).then((nextPreferences) => {
        setReaderState((current) =>
          current
            ? {
                ...current,
                preferences: nextPreferences,
              }
            : current,
        );
      });
    }, 150);
  }, [preferences, readerState?.preferences, sourceId, sourceTitleId, status]);

  useEffect(() => {
    if (isPagedMode || !currentChapterId || pageStatus !== "ready") {
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const handleScroll = () => {
      const maxScrollTop = Math.max(container.scrollHeight - container.clientHeight, 1);
      const scrollProgress = clamp(container.scrollTop / maxScrollTop, 0, 1);
      let activePageIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      for (const page of pages) {
        const element = pageElementRefs.current[page.pageIndex];
        if (!element) {
          continue;
        }

        const distance = Math.abs(element.offsetTop - container.scrollTop);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          activePageIndex = page.pageIndex;
        }
      }

      setCurrentPageIndex(activePageIndex);
      scheduleProgressSave(activePageIndex, scrollProgress);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [currentChapterId, isPagedMode, pageStatus, pages]);

  useEffect(() => {
    if (!isPagedMode || !currentChapterId || pageStatus !== "ready") {
      return;
    }

    scheduleProgressSave(boundedPageIndex, 0);
  }, [boundedPageIndex, currentChapterId, isPagedMode, pageStatus]);

  useEffect(() => {
    return () => {
      flushProgressNow();
    };
  }, [boundedPageIndex, currentChapterId, currentPageIndex, explicitLibraryEntryId, isPagedMode, pages.length, readerState?.libraryEntryId, sourceId, sourceTitleId]);

  useEffect(() => {
    if (!sourceId || !sourceTitleId || !currentChapterId || !titleState) {
      return;
    }

    const activeChapter = titleState.chapters.find((chapter) => chapter.chapterId === currentChapterId);
    if (!activeChapter) {
      return;
    }

    let isDisposed = false;

    void startReaderSession({
      sourceId,
      sourceTitleId,
      libraryEntryId: readerState?.libraryEntryId ?? explicitLibraryEntryId ?? null,
      titleName: titleState.details.name,
      chapterId: currentChapterId,
      chapterTitle: activeChapter.title,
    }).then((sessionId) => {
      if (!isDisposed) {
        activeSessionIdRef.current = sessionId;
      }
    });

    return () => {
      isDisposed = true;
      const sessionId = activeSessionIdRef.current;
      activeSessionIdRef.current = null;

      if (sessionId) {
        void endReaderSession(sessionId);
      }
    };
  }, [
    currentChapterId,
    explicitLibraryEntryId,
    readerState?.libraryEntryId,
    sourceId,
    sourceTitleId,
    titleState,
  ]);

  useEffect(() => {
    if (!isPagedMode) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setCurrentPageIndex((current) =>
          preferences.mode === "rtl"
            ? Math.max(current - 1, 0)
            : Math.min(current + 1, Math.max(pages.length - 1, 0)),
        );
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setCurrentPageIndex((current) =>
          preferences.mode === "rtl"
            ? Math.min(current + 1, Math.max(pages.length - 1, 0))
            : Math.max(current - 1, 0),
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPagedMode, pages.length, preferences.mode]);

  function handleSelectChapter(chapterId: string) {
    flushProgressNow();
    updateReaderParams({ chapter: chapterId }, false);
  }

  function renderReaderSurface() {
    if (pageStatus === "loading") {
      return <p className="browse-message">Loading chapter pages...</p>;
    }

    if (pageStatus === "error") {
      return <p className="browse-message browse-message--error">{error}</p>;
    }

    if (pages.length === 0) {
      return <p className="browse-message">The source did not expose readable pages for this chapter.</p>;
    }

    if (isPagedMode) {
      const activePage = pages[boundedPageIndex];

      return (
        <div className={`reader-stage reader-stage--paged reader-stage--${preferences.mode}`}>
          <div className="reader-paged-toolbar">
            <button
              type="button"
              className="browse-search__button browse-search__button--ghost"
              disabled={preferences.mode === "rtl" ? boundedPageIndex >= pages.length - 1 : boundedPageIndex <= 0}
              onClick={() =>
                setCurrentPageIndex((current) =>
                  preferences.mode === "rtl"
                    ? Math.min(current + 1, pages.length - 1)
                    : Math.max(current - 1, 0),
                )
              }
            >
              Previous page
            </button>
            <span className="page__pill">
              Page {boundedPageIndex + 1} / {pages.length}
            </span>
            <button
              type="button"
              className="browse-search__button browse-search__button--ghost"
              disabled={preferences.mode === "rtl" ? boundedPageIndex <= 0 : boundedPageIndex >= pages.length - 1}
              onClick={() =>
                setCurrentPageIndex((current) =>
                  preferences.mode === "rtl"
                    ? Math.max(current - 1, 0)
                    : Math.min(current + 1, pages.length - 1),
                )
              }
            >
              Next page
            </button>
          </div>

          <div className="reader-paged-frame">
            <img
              className="reader-page reader-page--paged"
              src={activePage.imageUrl}
              alt={`${titleState?.details.name ?? "Chapter"} page ${boundedPageIndex + 1}`}
              style={pageScale}
            />
          </div>
        </div>
      );
    }

    return (
      <div
        className={`reader-stage reader-stage--scroll reader-stage--${preferences.mode}`}
        ref={scrollContainerRef}
      >
        <div className="reader-scroll-stack">
          {pages.map((page) => (
            <img
              key={page.pageIndex}
              ref={(element) => {
                pageElementRefs.current[page.pageIndex] = element;
              }}
              className={`reader-page reader-page--${preferences.mode}`}
              src={page.imageUrl}
              alt={`${titleState?.details.name ?? "Chapter"} page ${page.pageIndex + 1}`}
              style={pageScale}
              onLoad={(e) => {
                const progress = readerState?.progress;
                if (!isPagedMode && progress && progress.lastReadChapterId === currentChapterId) {
                  if (initialScrollChapterRef.current !== currentChapterId && page.pageIndex === progress.lastReadPageIndex) {
                    e.currentTarget.scrollIntoView({ behavior: "auto", block: "start" });
                    initialScrollChapterRef.current = currentChapterId;
                  }
                }
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="page">
        <section className="page__panel">
          <p className="browse-message browse-message--error">{error}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="reader-layout">
      <aside className="reader-sidebar">
        <div style={{ padding: '0.5rem 1rem', marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            className="floirs-button floirs-button--icon"
            onClick={() => {
              flushProgressNow();
              navigate('/library');
            }}
            title="Library"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>
          </button>
          
          <button
            type="button"
            className="floirs-button floirs-button--icon"
            onClick={() => {
              flushProgressNow();
              navigate(-1);
            }}
            title="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
        </div>

        <section className="page__panel reader-panel">
          <label className="library-field">
            <span className="library-field__label">Mode</span>
            <select
              className="browse-controls__select"
              value={preferences.mode}
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  mode: event.target.value as ReaderMode,
                }))
              }
            >
              <option value="vertical">Vertical</option>
              <option value="horizontal">Horizontal paged</option>
              <option value="rtl">RTL paged</option>
              <option value="webtoon">Webtoon</option>
            </select>
          </label>

          <label className="library-field">
            <span className="library-field__label">Fit mode</span>
            <select
              className="browse-controls__select"
              value={preferences.fitMode}
              onChange={(event) =>
                setPreferences((current) => ({
                  ...current,
                  fitMode: event.target.value as ReaderFitMode,
                }))
              }
            >
              <option value="fit-width">Fit width</option>
              <option value="fit-height">Fit height</option>
              <option value="free">Free zoom</option>
            </select>
          </label>

          <label className="library-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span className="library-field__label">Zoom</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                className="reader-zoom-slider"
                type="range"
                min="50"
                max="250"
                step="10"
                value={preferences.zoomPercent}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    zoomPercent: Number(event.target.value),
                  }))
                }
              />
              <span className="reader-zoom-pill">{preferences.zoomPercent}%</span>
            </div>
          </label>
        </section>

        <section className="page__panel reader-panel">
          <button
            type="button"
            className="floirs-button"
            style={{ marginBottom: '0.5rem' }}
            onClick={() => {
              flushProgressNow();
              if (sourceId && sourceTitleId) {
                navigate(`/browse?source=${encodeURIComponent(sourceId)}&title=${encodeURIComponent(sourceTitleId)}&page=1`);
                return;
              }
              navigate(-1);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            Manga Info
          </button>
          
          <label className="library-field">
            <select
              className="browse-controls__select"
              value={currentChapterId ?? ""}
              onChange={(event) => handleSelectChapter(event.target.value)}
            >
              <option value="" disabled>Select a chapter...</option>
              {(titleState?.chapters ?? []).map((chapter) => (
                <option 
                  key={chapter.chapterId} 
                  value={chapter.chapterId}
                  disabled={chapter.availability !== "readable"}
                >
                  {chapter.title} {chapter.availability !== "readable" ? `(${chapter.availabilityLabel ?? chapter.availability})` : ""}
                </option>
              ))}
            </select>
          </label>

          <div className="reader-nav-row" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="floirs-button"
              style={{ flex: 1, justifyContent: 'center' }}
              disabled={!olderChapter}
              onClick={() => olderChapter && handleSelectChapter(olderChapter.chapterId)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              Prev
            </button>
            <button
              type="button"
              className="floirs-button"
              style={{ flex: 1, justifyContent: 'center' }}
              disabled={!newerChapter}
              onClick={() => newerChapter && handleSelectChapter(newerChapter.chapterId)}
            >
              Next
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </section>
      </aside>

      <section className="reader-main">
        <section className="reader-content">
          {status === "loading" ? <p className="browse-message">Loading reader context...</p> : renderReaderSurface()}
        </section>
      </section>
    </div>
  );
}
