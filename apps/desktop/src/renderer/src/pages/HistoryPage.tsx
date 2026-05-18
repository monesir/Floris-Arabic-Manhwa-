import { PlaceholderPage } from "@renderer/shared/PlaceholderPage";

export function HistoryPage() {
  return (
    <PlaceholderPage
      eyebrow="Later analytics"
      title="History stays visible before it is populated"
      summary="History belongs in the shell because the product is explicitly local-first and progress-aware. The route is live now to reserve the eventual flow for recent reading and analytics."
      cards={[
        { label: "Backed by", value: "Future local tables" },
        { label: "Phase", value: "Offline and Analytics" },
        { label: "Intent", value: "Recent reading path" },
      ]}
      nextSteps={[
        "Keep this route in the shell to avoid late navigation churn.",
        "Real reading history arrives after progress and analytics tables exist.",
      ]}
      accentPills={["History", "Analytics", "Local-first"]}
    />
  );
}
