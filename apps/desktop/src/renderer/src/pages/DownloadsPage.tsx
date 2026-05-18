import { PlaceholderPage } from "@renderer/shared/PlaceholderPage";

export function DownloadsPage() {
  return (
    <PlaceholderPage
      eyebrow="Offline lane"
      title="Downloads is visible before the queue exists"
      summary="This page exists in the shell because offline handling is a core promise of the app. Phase 1 does not fake queue data; it simply holds the route and prepares the architecture for the later download subsystem."
      cards={[
        { label: "Future owner", value: "Download manager" },
        { label: "Execution", value: "Deferred" },
        { label: "Persistence", value: "Later tables" },
      ]}
      nextSteps={[
        "Preserve the route now so later queue UX lands in a stable shell.",
        "Real jobs, retries, and destinations come after source and reader foundations.",
      ]}
      accentPills={["Downloads", "Queue", "Offline reading"]}
    />
  );
}
