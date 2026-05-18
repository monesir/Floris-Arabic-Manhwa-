export type NavigationItem = {
  label: string;
  path: string;
};

export const navigationItems: NavigationItem[] = [
  { label: "Library", path: "/library" },
  { label: "Browse", path: "/browse" },
  { label: "Updates", path: "/updates" },
  { label: "History", path: "/history" },
  { label: "Downloads", path: "/downloads" },
  { label: "Settings", path: "/settings" },
  { label: "Plugins", path: "/plugins" },
];
