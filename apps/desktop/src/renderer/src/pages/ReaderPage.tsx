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
        scrollProgress,
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

    if (isPagedMode) {
      setCurrentPageIndex(clamp(progress.lastReadPageIndex, 0, Math.max(pages.length - 1, 0)));
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    window.requestAnimationFrame(() => {
      const maxScrollTop = Math.max(container.scrollHeight - container.clientHeight, 0);
      container.scrollTop = maxScrollTop * progress.lastReadScrollProgress;
    });
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
      <section className="reader-main">
        <header className="reader-topbar">
          <div className="reader-topbar__left">
            <button
              type="button"
              className="browse-search__button browse-search__button--ghost"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
            <div>
              <span className="page__eyebrow">Reader</span>
              <h1 className="page__title page__title--compact">
                {titleState?.details.name ?? "Loading title..."}
              </h1>
            </div>
          </div>

          <div className="reader-topbar__right">
            <span className="page__pill">
              {currentChapterId ?? "No chapter selected"}
            </span>
            <span className="page__pill">
              {isPagedMode ? `Page ${boundedPageIndex + 1}/${Math.max(pages.length, 1)}` : `Scroll mode`}
            </span>
          </div>
        </header>

        <section className="reader-content">
          {status === "loading" ? <p className="browse-message">Loading reader context...</p> : renderReaderSurface()}
        </section>
      </section>

      <aside className="reader-sidebar">
        <section className="page__panel reader-panel">
          <h2 className="page__panel-title">Reader settings</h2>

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

          <label className="library-field">
            <span className="library-field__label">Zoom</span>
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
            <span className="page__pill">{preferences.zoomPercent}%</span>
          </label>
        </section>

        <section className="page__panel reader-panel">
          <h2 className="page__panel-title">Chapter navigation</h2>
          <div className="reader-nav-row">
            <button
              type="button"
              className="browse-search__button browse-search__button--ghost"
              disabled={!olderChapter}
              onClick={() => olderChapter && handleSelectChapter(olderChapter.chapterId)}
            >
              Previous chapter
            </button>
            <button
              type="button"
              className="browse-search__button browse-search__button--ghost"
              disabled={!newerChapter}
              onClick={() => newerChapter && handleSelectChapter(newerChapter.chapterId)}
            >
              Next chapter
            </button>
          </div>

          <div className="reader-chapter-list">
            {(titleState?.chapters ?? []).map((chapter) => (
              <button
                key={chapter.chapterId}
                type="button"
                className={`reader-chapter-item${chapter.chapterId === currentChapterId ? " reader-chapter-item--active" : ""}`}
                disabled={chapter.availability !== "readable"}
                onClick={() => handleSelectChapter(chapter.chapterId)}
              >
                <strong>{chapter.title}</strong>
                <span>{chapter.availabilityLabel ?? chapter.availability}</span>
              </button>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
