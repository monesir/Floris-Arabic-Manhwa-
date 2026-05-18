import { useEffect, useState } from "react";
import type { PluginListItem } from "@contracts/plugin";
import { useLanguage } from "@renderer/features/settings/language-context";
import { getPluginRegistryState } from "@renderer/shared/plugin-registry";

type PluginRegistrySnapshot = {
  pluginDirectory: string;
  plugins: PluginListItem[];
};

export function PluginRegistryPanel() {
  const { copy } = useLanguage();
  const [snapshot, setSnapshot] = useState<PluginRegistrySnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getPluginRegistryState().then((nextSnapshot) => {
      if (!cancelled) {
        setSnapshot(nextSnapshot);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!snapshot) {
    return (
      <section className="plugin-panel">
        <h2 className="page__panel-title">{copy.pluginsPanelTitle}</h2>
        <p className="page__panel-copy">Loading registry state...</p>
      </section>
    );
  }

  return (
    <section className="plugin-panel">
      <div className="plugin-panel__header">
        <div>
          <h2 className="page__panel-title">{copy.pluginsPanelTitle}</h2>
          <p className="page__panel-copy">{copy.pluginsPanelCopy}</p>
        </div>
        <div className="plugin-panel__directory">
          <span className="plugin-panel__directory-label">{copy.pluginsDirectoryLabel}</span>
          <code>{snapshot.pluginDirectory}</code>
        </div>
      </div>

      {snapshot.plugins.length === 0 ? (
        <p className="page__panel-copy">{copy.pluginsEmpty}</p>
      ) : (
        <div className="plugin-list">
          {snapshot.plugins.map((plugin) => (
            <article className="plugin-card" key={plugin.pluginId}>
              <div className="plugin-card__header">
                <div>
                  <div className="plugin-card__title-row">
                    <h3 className="plugin-card__title">{plugin.name}</h3>
                    <span className={`plugin-card__status plugin-card__status--${plugin.status}`}>
                      {plugin.status}
                    </span>
                  </div>
                  <div className="plugin-card__meta">
                    <span>{plugin.pluginId}</span>
                    <span>{plugin.version}</span>
                    <span>{plugin.entryType}</span>
                  </div>
                </div>
              </div>

              {plugin.failureReason ? (
                <div className="plugin-card__failure">
                  <span className="plugin-card__label">{copy.pluginsFailureLabel}</span>
                  <p>{plugin.failureReason}</p>
                </div>
              ) : null}

              <div className="plugin-card__sources">
                <span className="plugin-card__label">{copy.pluginsSourcesLabel}</span>
                {plugin.sources.length === 0 ? (
                  <p className="page__panel-copy">0</p>
                ) : (
                  <div className="plugin-card__source-list">
                    {plugin.sources.map((source) => (
                      <div className="plugin-source" key={source.sourceId}>
                        <div className="plugin-source__title-row">
                          <strong>{source.displayName}</strong>
                          <span>{source.sourceId}</span>
                        </div>
                        <div className="plugin-source__caps">
                          {Object.entries(source.capabilities)
                            .filter(([, enabled]) => enabled)
                            .map(([capability]) => (
                              <span className="page__pill" key={capability}>
                                {capability}
                              </span>
                            ))}
                        </div>
                        <div className="plugin-source__actions">
                          <span className="plugin-card__label">{copy.pluginsActionsLabel}</span>
                          <code>
                            {Object.entries(source.actions)
                              .filter(([, enabled]) => enabled)
                              .map(([action]) => action)
                              .join(", ") || "none"}
                          </code>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

