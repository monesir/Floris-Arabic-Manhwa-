import { useEffect, useState } from "react";
import type { PluginListItem } from "@contracts/plugin";
import { useLanguage } from "@renderer/features/settings/language-context";
import { getPluginRegistryState, rescanPluginRegistry } from "@renderer/shared/plugin-registry";

type PluginRegistrySnapshot = {
  pluginDirectory: string;
  plugins: PluginListItem[];
};

export function PluginRegistryPanel() {
  const { copy } = useLanguage();
  const [snapshot, setSnapshot] = useState<PluginRegistrySnapshot | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const builtInCount = snapshot.plugins.filter((plugin) => plugin.entryType === "built-in").length;
  const externalCount = snapshot.plugins.filter((plugin) => plugin.entryType === "external").length;
  const runtimeReadyCount = snapshot.plugins.filter((plugin) => plugin.status === "ready").length;

  return (
    <section className="plugin-panel">
      <div className="plugin-panel__header">
        <div>
          <h2 className="page__panel-title">{copy.pluginsPanelTitle}</h2>
          <p className="page__panel-copy">{copy.pluginsPanelCopy}</p>
        </div>
        <div className="plugin-panel__actions">
          <div className="plugin-panel__directory">
            <span className="plugin-panel__directory-label">{copy.pluginsDirectoryLabel}</span>
            <code>{snapshot.pluginDirectory}</code>
          </div>
          <button
            className="button button--secondary"
            disabled={isRefreshing}
            onClick={() => {
              setIsRefreshing(true);
              void rescanPluginRegistry()
                .then((nextSnapshot) => {
                  setSnapshot(nextSnapshot);
                })
                .finally(() => {
                  setIsRefreshing(false);
                });
            }}
            type="button"
          >
            {isRefreshing ? copy.pluginsRescanningLabel : copy.pluginsRescanLabel}
          </button>
        </div>
      </div>

      <div className="page__grid">
        <div className="page__card">
          <div className="page__card-label">{copy.pluginsBuiltInValue}</div>
          <div className="page__card-value">{builtInCount}</div>
        </div>
        <div className="page__card">
          <div className="page__card-label">{copy.pluginsSummaryExternalLabel}</div>
          <div className="page__card-value">{externalCount}</div>
        </div>
        <div className="page__card">
          <div className="page__card-label">{copy.pluginsSummaryRuntimeLabel}</div>
          <div className="page__card-value">{runtimeReadyCount}</div>
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

              <div className="plugin-card__facts">
                <div className="plugin-card__fact">
                  <span className="plugin-card__label">{copy.pluginsCompatibilityLabel}</span>
                  <code>
                    {plugin.compatibilityStatus === "compatible"
                      ? copy.pluginsCompatibilityCompatibleValue
                      : plugin.compatibilityStatus === "incompatible"
                        ? copy.pluginsCompatibilityIncompatibleValue
                        : copy.pluginsCompatibilityUnknownValue}
                  </code>
                </div>
                <div className="plugin-card__fact">
                  <span className="plugin-card__label">{copy.pluginsRuntimeModeLabel}</span>
                  <code>{plugin.runtimeMode}</code>
                </div>
                <div className="plugin-card__fact">
                  <span className="plugin-card__label">{copy.pluginsLoadedSourcesLabel}</span>
                  <code>{plugin.loadedSourceCount}</code>
                </div>
              </div>

              <div className="plugin-card__paths">
                <div className="plugin-card__path">
                  <span className="plugin-card__label">{copy.pluginsManifestLabel}</span>
                  <code>{plugin.manifestPath ?? copy.pluginsNoManifest}</code>
                </div>
                <div className="plugin-card__path">
                  <span className="plugin-card__label">{copy.pluginsEntryFileLabel}</span>
                  <code>{plugin.entryFile ?? copy.pluginsNoEntryFile}</code>
                </div>
              </div>

              {plugin.compatibilityReason ? (
                <div className="plugin-card__failure">
                  <span className="plugin-card__label">{copy.pluginsCompatibilityLabel}</span>
                  <p>{plugin.compatibilityReason}</p>
                </div>
              ) : null}

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
                        <div className="plugin-card__meta">
                          <span>{source.language}</span>
                          <span>{source.baseUrl}</span>
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
