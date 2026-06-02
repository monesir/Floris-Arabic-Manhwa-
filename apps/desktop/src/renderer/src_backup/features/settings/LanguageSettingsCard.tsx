import type { AppLanguage } from "@contracts/settings";
import { useLanguage } from "@renderer/features/settings/language-context";

export function LanguageSettingsCard() {
  const { language, direction, copy, setLanguage, isHydrated } = useLanguage();

  return (
    <section className="settings-card">
      <div className="settings-card__header">
        <div>
          <div className="page__eyebrow">{copy.settingsEyebrow}</div>
          <h2 className="settings-card__title">{copy.settingsPanelTitle}</h2>
        </div>
        <span className="settings-card__status">{copy.persistenceStatus}</span>
      </div>

      <p className="settings-card__copy">{copy.settingsPanelCopy}</p>

      <label className="settings-card__field">
        <span className="settings-card__label">{copy.languageLabel}</span>
        <select
          className="settings-card__select"
          value={language}
          onChange={(event) => void setLanguage(event.target.value as AppLanguage)}
        >
          <option value="en">{copy.languageEnglish}</option>
          <option value="ar">{copy.languageArabic}</option>
        </select>
      </label>

      <p className="settings-card__hint">{copy.languageHint}</p>

      <div className="settings-card__facts">
        <div className="settings-card__fact">
          <span className="settings-card__fact-label">{copy.persistedValueLabel}</span>
          <strong>{isHydrated ? language : "..."}</strong>
        </div>
        <div className="settings-card__fact">
          <span className="settings-card__fact-label">{copy.currentDirectionLabel}</span>
          <strong>{direction}</strong>
        </div>
      </div>

      <div className="settings-card__preview" dir={direction}>
        <span className="settings-card__preview-label">{copy.previewLabel}</span>
        <p>{language === "ar" ? copy.previewArabic : copy.previewEnglish}</p>
      </div>

      <p className="settings-card__future">{copy.futureLanguagesHint}</p>
    </section>
  );
}
