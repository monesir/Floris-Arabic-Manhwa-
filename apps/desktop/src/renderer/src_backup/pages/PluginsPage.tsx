import { PluginRegistryPanel } from "@renderer/features/plugins/PluginRegistryPanel";
import { useLanguage } from "@renderer/features/settings/language-context";

export function PluginsPage() {
  const { copy } = useLanguage();

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <div className="page__eyebrow">{copy.pluginsEyebrow}</div>
          <h1 className="page__title page__title--compact">{copy.pluginsTitle}</h1>
          <p className="page__copy">{copy.pluginsSummary}</p>
        </div>
      </header>

      <PluginRegistryPanel />
    </section>
  );
}
