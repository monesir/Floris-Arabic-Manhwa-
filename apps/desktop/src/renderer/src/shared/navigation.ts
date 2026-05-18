export type NavigationItem = {
  label: string;
  meta: string;
  path: string;
};

export const navigationItems: NavigationItem[] = [
  { label: "Library", meta: "Core shelf", path: "/library" },
  { label: "Browse", meta: "Source layer", path: "/browse" },
  { label: "Updates", meta: "Incoming", path: "/updates" },
  { label: "History", meta: "Recent path", path: "/history" },
  { label: "Downloads", meta: "Offline lane", path: "/downloads" },
  { label: "Settings", meta: "Real soon", path: "/settings" },
  { label: "Plugins", meta: "Registry", path: "/plugins" },
];
