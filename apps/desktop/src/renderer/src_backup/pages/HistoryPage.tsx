import { useEffect, useState } from "react";
import type { ReadingHistoryItem, ReadingTitleAnalytics } from "@contracts/analytics";
import { listReadingHistory, listReadingTitleAnalytics } from "@renderer/shared/analytics-store";

export function HistoryPage() {
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [analytics, setAnalytics] = useState<ReadingTitleAnalytics[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([listReadingHistory(), listReadingTitleAnalytics()])
      .then(([nextHistory, nextAnalytics]) => {
        setHistory(nextHistory);
        setAnalytics(nextAnalytics);
        setStatus("ready");
      })
      .catch((nextError: unknown) => {
        setStatus("error");
        setError(nextError instanceof Error ? nextError.message : "Failed to load reading history.");
      });
  }, []);

  return (
    <section className="page">
      <header className="page__header page__header--split">
        <div>
          <div className="page__eyebrow">Analytics</div>
          <h1 className="page__title page__title--compact">Reading history</h1>
          <p className="page__copy">
            Recent chapter opens and total reading time are now tracked locally from the reader flow.
          </p>
        </div>
        <div className="page__grid">
          <div className="page__card">
            <div className="page__card-label">History rows</div>
            <div className="page__card-value">{history.length}</div>
          </div>
          <div className="page__card">
            <div className="page__card-label">Tracked titles</div>
            <div className="page__card-value">{analytics.length}</div>
          </div>
        </div>
      </header>

      <section className="page__panel">
        {status === "loading" ? <p className="browse-message">Loading reading history...</p> : null}
        {error ? <p className="browse-message browse-message--error">{error}</p> : null}

        <div className="updates-list">
          {history.map((item) => (
            <article className="updates-card" key={item.historyId}>
              <div className="updates-card__body">
                <div className="updates-card__topline">
                  <span className="browse-pill">{item.sourceId}</span>
                  <span className="page__pill">{new Date(item.openedAt).toLocaleString()}</span>
                </div>
                <h2 className="updates-card__title">{item.titleName}</h2>
                <p className="updates-card__meta">Chapter: {item.chapterTitle}</p>
              </div>
            </article>
          ))}
        </div>

        {status === "ready" && history.length === 0 ? (
          <p className="browse-message">No reading history has been recorded yet.</p>
        ) : null}
      </section>
    </section>
  );
}
