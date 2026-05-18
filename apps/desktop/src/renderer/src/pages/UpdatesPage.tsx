import { PlaceholderPage } from "@renderer/shared/PlaceholderPage";

export function UpdatesPage() {
  return (
    <PlaceholderPage
      eyebrow="Future signal"
      title="Updates already has a place in the shell"
      summary="The route is live even before update detection exists. This keeps the shell honest about its final navigation map and avoids re-teaching the user the information architecture later."
      cards={[
        { label: "Role", value: "Tracked refreshes" },
        { label: "Phase", value: "Library Workflow" },
        { label: "State", value: "Placeholder by design" },
      ]}
      nextSteps={[
        "Phase 3 connects update detection to source refresh behavior.",
        "Library cover indicators and this route should reinforce each other.",
      ]}
      accentPills={["Updates", "Refresh path", "Tracked titles"]}
    />
  );
}
