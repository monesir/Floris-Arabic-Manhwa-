import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { ReadingHistoryItem } from "@contracts/analytics";
import type { LibraryEntry } from "@contracts/library";
import { listReadingHistory, clearReadingHistory } from "@renderer/shared/analytics-store";
import { listLibraryEntries } from "@renderer/shared/library-store";
import { searchSourceTitles } from "@renderer/shared/source-registry";
import { CachedImage } from "@renderer/shared/CachedImage";

function initialsFromTitle(title: string) {
  return title.slice(0, 2).toUpperCase();
}

function formatHistoryDate(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();
  
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0 && date.getDate() === now.getDate()) {
    return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  if (diffDays <= 1) {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.getDate() === yesterday.getDate()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function HistoryPage() {
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [libraryEntries, setLibraryEntries] = useState<Record<string, LibraryEntry>>({});
  const [fetchedCovers, setFetchedCovers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    void Promise.all([listReadingHistory(), listLibraryEntries()])
      .then(([nextHistory, nextLibraryEntries]) => {
        setHistory(nextHistory);
        const libMap: Record<string, LibraryEntry> = {};
        for (const entry of nextLibraryEntries) {
          libMap[entry.libraryEntryId] = entry;
        }
        setLibraryEntries(libMap);
        setStatus("ready");
      })
      .catch((nextError: unknown) => {
        setStatus("error");
        setError(nextError instanceof Error ? nextError.message : "Failed to load reading history.");
      });
  }, []);

  const triedCoversRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (status !== "ready") return;

    const missing = history.filter(h => {
      const hasLibraryCover = h.libraryEntryId && libraryEntries[h.libraryEntryId];
      return !hasLibraryCover && !fetchedCovers[h.sourceTitleId] && !triedCoversRef.current.has(h.sourceTitleId);
    });
    
    if (missing.length === 0) return;

    const uniqueMissing = Array.from(new Set(missing.map(m => m.sourceTitleId)))
      .map(id => missing.find(m => m.sourceTitleId === id)!)
      .slice(0, 20);

    for (const item of uniqueMissing) {
      triedCoversRef.current.add(item.sourceTitleId);
      // Use search instead of getSourceTitle to get clean covers (no watermarks)
      searchSourceTitles(item.sourceId, item.titleName, 1).then((res) => {
        const match = res?.items?.find((i) => i.titleId === item.sourceTitleId);
        if (match?.coverUrl) {
          setFetchedCovers(prev => ({ ...prev, [item.sourceTitleId]: match.coverUrl as string }));
        }
      }).catch(() => {});
    }
  }, [history, status, fetchedCovers]);

  return (
    <section className="page" dir="ltr">
      <div className="history-page-header" style={{ gap: '0.5rem', display: 'flex' }}>
        <div className="floirs-search-shell floirs-search-shell--wide" style={{ flex: 'none', width: 'auto' }}>
          <input
            className="floirs-search-input"
            type="search"
            placeholder="Search history..."
          />
        </div>
        <button 
          className="floirs-button floirs-button--icon" 
          type="button" 
          title="Clear History"
          onClick={() => {
            void clearReadingHistory().then(() => {
              setHistory([]);
            });
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>

      <section>
        {status === "loading" ? <p className="browse-message">Loading reading history...</p> : null}
        {error ? <p className="browse-message browse-message--error">{error}</p> : null}

        <div className="updates-list">
          {history.map((item) => {
            const libEntry = item.libraryEntryId ? libraryEntries[item.libraryEntryId] : null;
            const coverUrl = libEntry?.coverUrl || fetchedCovers[item.sourceTitleId];

            return (
              <article 
                className="history-card" 
                key={item.historyId}
                onClick={() => navigate(`/reader?source=${encodeURIComponent(item.sourceId)}&title=${encodeURIComponent(item.sourceTitleId)}&chapter=${encodeURIComponent(item.chapterId)}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="history-card__left">
                  <div className="history-card__cover-wrap">
                    {coverUrl ? (
                      <CachedImage 
                        className="history-card__cover" 
                        src={coverUrl} 
                        alt="" 
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextElementSibling) {
                            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'grid';
                          }
                        }}
                      />
                    ) : null}
                    <div 
                      className="history-card__cover--empty" 
                      style={{ display: coverUrl ? 'none' : 'grid' }}
                    >
                      {initialsFromTitle(item.titleName)}
                    </div>
                  </div>
                  <div className="history-card__body">
                    <h2 className="history-card__title">{item.titleName}</h2>
                    <p className="history-card__meta">Chapter: {item.chapterTitle}</p>
                    <div className="history-card__badges">
                      <span className="history-card__badge history-card__badge--source">{item.sourceId}</span>
                      <span className="history-card__badge history-card__badge--time">
                        {formatHistoryDate(new Date(item.openedAt).getTime())}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {status === "ready" && history.length === 0 ? (
          <p className="browse-message">No reading history has been recorded yet.</p>
        ) : null}
      </section>
    </section>
  );
}
