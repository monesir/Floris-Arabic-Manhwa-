import { PlaceholderPage } from "@renderer/shared/PlaceholderPage";

export function SettingsPage() {
  return (
    <PlaceholderPage
      eyebrow="Persistence proof"
      title="Settings will become the first real persisted flow"
      summary="This route is intentionally present from the start because Phase 1 needs a real persisted settings path. The language switch and local read/write round-trip will land here in the next execution plan."
      cards={[
        { label: "Priority", value: "High in Phase 1" },
        { label: "Real flow", value: "Language switching" },
        { label: "Layout", value: "Stable, not mirrored" },
      ]}
      nextSteps={[
        "Turn this into the persistence smoke path in plan 01-02.",
        "Support Arabic text correctly without flipping the entire shell layout.",
        "Keep the i18n structure easy to extend with more languages later.",
      ]}
      accentPills={["Settings", "i18n", "Arabic text", "Local persistence"]}
    />
  );
}
