import { PlaceholderPage } from "@renderer/shared/PlaceholderPage";

export function BrowsePage() {
  return (
    <PlaceholderPage
      eyebrow="Source lane"
      title="Browse is reserved for the source contract, not mocked content"
      summary="This route exists now so the shell locks its final information architecture. Real browse and search behavior arrives when the built-in source contract becomes active in the next phase."
      cards={[
        { label: "Phase", value: "Source Browse MVP" },
        { label: "Contract", value: "Capability-driven" },
        { label: "Runtime", value: "Built-in first" },
      ]}
      nextSteps={[
        "Wire built-in source adapters through the shared contract.",
        "Expose browse and search only when the source runtime is real.",
        "Keep title actions derived from capabilities, not hard-coded mock buttons.",
      ]}
      accentPills={["Browse", "Search", "Title details", "Chapter list"]}
    />
  );
}
