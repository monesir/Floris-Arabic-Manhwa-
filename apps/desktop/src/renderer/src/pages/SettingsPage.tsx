import { useEffect, useState } from "react";
import type { ReadingTitleAnalytics } from "@contracts/analytics";
import { LanguageSettingsCard } from "@renderer/features/settings/LanguageSettingsCard";
import { listReadingTitleAnalytics } from "@renderer/shared/analytics-store";
import { useLanguage } from "@renderer/features/settings/language-context";

export function SettingsPage() {
  const { copy } = useLanguage();
  const [titleAnalytics, setTitleAnalytics] = useState<ReadingTitleAnalytics[]>([]);

  useEffect(() => {
    void listReadingTitleAnalytics()
      .then((items) => {
        setTitleAnalytics(items);
      })
      .catch(() => {
        setTitleAnalytics([]);
      });
  }, []);

  function formatDuration(totalSeconds: number) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }

    return `${seconds}s`;
  }

  return (
    <section className="page">
      <header className="page__header page__header--split">
        <div>
          <div className="page__eyebrow">{copy.settingsEyebrow}</div>
          <h1 className="page__title page__title--compact">{copy.settingsTitle}</h1>
          <p className="page__copy">{copy.settingsSummary}</p>
        </div>
        <div className="page__grid">
          <div className="page__card">
            <div className="page__card-label">{copy.settingsCardPersistenceLabel}</div>
            <div className="page__card-value">{copy.settingsCardPersistenceValue}</div>
          </div>
          <div className="page__card">
            <div className="page__card-label">{copy.settingsCardIpcLabel}</div>
            <div className="page__card-value">{copy.settingsCardIpcValue}</div>
          </div>
          <div className="page__card">
            <div className="page__card-label">{copy.settingsCardLayoutLabel}</div>
            <div className="page__card-value">{copy.settingsCardLayoutValue}</div>
          </div>
        </div>
      </header>

      <LanguageSettingsCard />

      <section className="page__panel">
        <div className="library-toolbar__header">
          <div>
            <h2 className="page__panel-title">Reading time by title</h2>
            <p className="page__panel-copy">
              Total tracked reading time is aggregated locally from completed reader sessions.
            </p>
          </div>
        </div>

        <div className="updates-list">
          {titleAnalytics.map((item) => (
            <article className="updates-card" key={`${item.sourceId}:${item.sourceTitleId}`}>
              <div className="updates-card__body">
                <div className="updates-card__topline">
                  <span className="browse-pill">{item.sourceId}</span>
                  <span className="page__pill">{formatDuration(item.totalReadingSeconds)}</span>
                </div>
                <h2 className="updates-card__title">{item.titleName}</h2>
                <p className="updates-card__meta">Sessions: {item.sessionCount}</p>
                <p className="updates-card__meta">
                  Last read: {item.lastReadAt ? new Date(item.lastReadAt).toLocaleString() : "Never"}
                </p>
              </div>
            </article>
          ))}
        </div>

        {titleAnalytics.length === 0 ? (
          <p className="browse-message">No reading-time totals are available yet.</p>
        ) : null}
      </section>
    </section>
  );
}
