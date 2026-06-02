import { type ReactNode, useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { LibraryCustomList } from "@contracts/library";
import { listLibraryLists } from "@renderer/shared/library-store";

function IconLibrary() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      <path d="M8 7h6" />
      <path d="M8 11h8" />
    </svg>
  );
}

function IconPlusSquare() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}

function IconPlugins() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="8" x="3" y="3" rx="2" />
      <rect width="8" height="8" x="13" y="3" rx="2" />
      <rect width="8" height="8" x="13" y="13" rx="2" />
      <path d="M3 13h8v8H3z" />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-1.2-1.8A2 2 0 0 0 7.55 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

function IconHistory() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

type NavItemProps = {
  to: string;
  label: string;
  icon: ReactNode;
};

function NavItem({ to, label, icon }: NavItemProps) {
  return (
    <NavLink
      className={({ isActive }) =>
        isActive ? "floirs-nav-item floirs-nav-item--active" : "floirs-nav-item"
      }
      to={to}
    >
      <span className="floirs-nav-item__icon">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [lists, setLists] = useState<LibraryCustomList[]>([]);
  const [libraryExpanded, setLibraryExpanded] = useState(true);
  const currentListId = searchParams.get("list");

  useEffect(() => {
    void listLibraryLists()
      .then(setLists)
      .catch(() => {
        setLists([]);
      });
  }, []);

  const isLibraryView = location.pathname === "/library";

  return (
    <aside className="floirs-sidebar">
      <div className="floirs-sidebar__scroll">
        <div className="floirs-sidebar__group">
          <button
            className={`floirs-nav-item floirs-nav-item--button${isLibraryView ? " floirs-nav-item--active" : ""}`}
            onClick={() => {
              navigate("/library");
              setLibraryExpanded((value) => !value);
            }}
            type="button"
          >
            <span className="floirs-nav-item__main">
              <span className="floirs-nav-item__icon">
                <IconLibrary />
              </span>
              <span>Library</span>
            </span>
            <span className="floirs-nav-item__chevron">
              {libraryExpanded ? <IconChevronDown /> : <IconChevronRight />}
            </span>
          </button>

          {libraryExpanded ? (
            <div className="floirs-subnav">
              <button
                className={!currentListId ? "floirs-subnav-item floirs-subnav-item--active" : "floirs-subnav-item"}
                onClick={() => navigate("/library")}
                type="button"
              >
                All Series
              </button>
              {lists.map((list) => (
                <button
                  key={list.listId}
                  className={currentListId === list.listId ? "floirs-subnav-item floirs-subnav-item--active" : "floirs-subnav-item"}
                  onClick={() => navigate(`/library?list=${encodeURIComponent(list.listId)}`)}
                  type="button"
                >
                  {list.name}
                </button>
              ))}
              <button className="floirs-subnav-item" onClick={() => navigate("/library")} type="button">
                New category...
              </button>
            </div>
          ) : null}
        </div>

        <NavItem to="/browse" label="Add Series" icon={<IconPlusSquare />} />

        <NavItem to="/plugins" label="Plugins" icon={<IconPlugins />} />
        <NavItem to="/downloads" label="Downloads" icon={<IconFolder />} />
        <NavItem to="/settings" label="Settings" icon={<IconSettings />} />
      </div>

      <div className="floirs-sidebar__footer">
        <button className="floirs-sidebar__footer-button" type="button" onClick={() => navigate("/history")}>
          <span>FloirsMNH v0.1.0</span>
          <span className="floirs-sidebar__footer-icon">
            <IconHistory />
          </span>
        </button>
      </div>
    </aside>
  );
}
