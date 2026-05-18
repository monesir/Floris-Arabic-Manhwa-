import { Outlet } from "react-router-dom";
import { Sidebar } from "@renderer/features/navigation/Sidebar";

export function AppShell() {
  return (
    <div className="shell-root">
      <Sidebar />
      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  );
}
