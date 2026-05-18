import { PlaceholderPage } from "@renderer/shared/PlaceholderPage";

export function PluginsPage() {
  return (
    <PlaceholderPage
      eyebrow="Plugin boundary"
      title="Plugins is a real route because the contract starts now"
      summary="This shell route reserves the exact surface where built-in runtime plugins and externally discovered plugin records will appear. Phase 1 will make this page real when validation and registry state are wired in."
      cards={[
        { label: "Built-in runtime", value: "Yes" },
        { label: "External execution", value: "Deferred" },
        { label: "Manifest style", value: "Minimal + strict" },
      ]}
      nextSteps={[
        "Show built-in and external plugin records with validation status.",
        "Keep external plugins non-executing until the later hardening phase.",
        "Derive source behavior from capability-driven contracts, not ad hoc UI state.",
      ]}
      accentPills={["Plugins", "Validation", "Source registry"]}
    />
  );
}
