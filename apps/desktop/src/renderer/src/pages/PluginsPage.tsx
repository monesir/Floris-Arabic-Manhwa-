import { PluginRegistryPanel } from "@renderer/features/plugins/PluginRegistryPanel";
import { useLanguage } from "@renderer/features/settings/language-context";

export function PluginsPage() {
  const { copy } = useLanguage();

  return (
    <section className="page">
      <header className="page__hero">
        <div className="page__eyebrow">{copy.pluginsEyebrow}</div>
        <h1 className="page__title">{copy.pluginsTitle}</h1>
        <p className="page__copy">{copy.pluginsSummary}</p>
        <div className="page__grid">
          <div className="page__card">
            <div className="page__card-label">Built-in</div>
            <div className="page__card-value">{copy.pluginsBuiltInValue}</div>
          </div>
          <div className="page__card">
            <div className="page__card-label">{copy.pluginsValidationLabel}</div>
            <div className="page__card-value">{copy.pluginsExternalValue}</div>
          </div>
          <div className="page__card">
            <div className="page__card-label">{copy.pluginsExecutionLabel}</div>
            <div className="page__card-value">{copy.pluginsRuntimeValue}</div>
          </div>
        </div>
      </header>

      <PluginRegistryPanel />
    </section>
  );
}
