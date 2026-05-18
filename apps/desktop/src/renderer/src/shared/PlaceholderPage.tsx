import type { ReactNode } from "react";

type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  summary: string;
  cards: Array<{ label: string; value: string }>;
  nextSteps: string[];
  accentPills?: string[];
  footer?: ReactNode;
};

export function PlaceholderPage({
  eyebrow,
  title,
  summary,
  cards,
  nextSteps,
  accentPills = [],
  footer,
}: PlaceholderPageProps) {
  return (
    <section className="page">
      <header className="page__header">
        <div>
          <div className="page__eyebrow">{eyebrow}</div>
          <h1 className="page__title page__title--compact">{title}</h1>
          <p className="page__copy">{summary}</p>
        </div>
      </header>

      <div className="page__grid">
        {cards.map((card) => (
          <div className="page__card" key={card.label}>
            <div className="page__card-label">{card.label}</div>
            <div className="page__card-value">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="page__panel page__placeholder">
        <span className="page__placeholder-status">Placeholder</span>
        <h2 className="page__panel-title">Planned route</h2>
        <p className="page__panel-copy">
          This route exists in the shell already, but its workflow is not finished yet.
        </p>
        <ol className="page__placeholder-list">
          {nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {accentPills.length > 0 ? (
          <div className="page__pill-row">
            {accentPills.map((pill) => (
              <span className="page__pill" key={pill}>
                {pill}
              </span>
            ))}
          </div>
        ) : null}
        {footer}
      </div>
    </section>
  );
}
