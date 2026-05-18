import { PlaceholderPage } from "@renderer/shared/PlaceholderPage";

export function LibraryPage() {
  return (
    <PlaceholderPage
      eyebrow="Library shell"
      title="A full navigation shell before a full library"
      summary="Phase 1 proves that the desktop shell can host the eventual library-first experience without hiding future routes. This surface reserves room for cover grids, title heroes, and ongoing progress signals."
      cards={[
        { label: "Layout", value: "Persistent shell" },
        { label: "Target", value: "Cover-first library" },
        { label: "Readiness", value: "Route is live" },
      ]}
      nextSteps={[
        "Phase 2 brings real source-to-title flow.",
        "Phase 3 fills this surface with library management and update indicators.",
        "Later title pages can grow into Houdoku-style hero and chapter-table layouts.",
      ]}
      accentPills={["Library", "Title pages", "Progress-aware shell"]}
    />
  );
}
