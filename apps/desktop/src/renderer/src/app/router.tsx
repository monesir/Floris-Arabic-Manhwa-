import { Navigate, createHashRouter } from "react-router-dom";
import { AppShell } from "@renderer/app/AppShell";
import { BrowsePage } from "@renderer/pages/BrowsePage";
import { DownloadsPage } from "@renderer/pages/DownloadsPage";
import { HistoryPage } from "@renderer/pages/HistoryPage";
import { LibraryPage } from "@renderer/pages/LibraryPage";
import { PluginsPage } from "@renderer/pages/PluginsPage";
import { ReaderPage } from "@renderer/pages/ReaderPage";
import { SettingsPage } from "@renderer/pages/SettingsPage";
import { UpdatesPage } from "@renderer/pages/UpdatesPage";

export const router = createHashRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/library" replace /> },
      { path: "/library", element: <LibraryPage /> },
      { path: "/browse", element: <BrowsePage /> },
      { path: "/updates", element: <UpdatesPage /> },
      { path: "/history", element: <HistoryPage /> },
      { path: "/downloads", element: <DownloadsPage /> },
      { path: "/reader", element: <ReaderPage /> },
      { path: "/settings", element: <SettingsPage /> },
      { path: "/plugins", element: <PluginsPage /> },
    ],
  },
]);
