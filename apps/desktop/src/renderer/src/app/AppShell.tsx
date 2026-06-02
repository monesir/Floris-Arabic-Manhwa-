import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@renderer/features/navigation/Sidebar";

export function AppShell() {
  const location = useLocation();
  const isReader = location.pathname.startsWith('/reader');

  return (
    <div className="shell-root">
      {!isReader && <Sidebar />}
      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  );
}
