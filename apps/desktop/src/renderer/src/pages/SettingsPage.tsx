import { LanguageSettingsCard } from "@renderer/features/settings/LanguageSettingsCard";
import { useLanguage } from "@renderer/features/settings/language-context";

export function SettingsPage() {
  const { copy } = useLanguage();

  return (
    <section className="page">
      <header className="page__hero">
        <div className="page__eyebrow">{copy.settingsEyebrow}</div>
        <h1 className="page__title">{copy.settingsTitle}</h1>
        <p className="page__copy">{copy.settingsSummary}</p>
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
    </section>
  );
}
