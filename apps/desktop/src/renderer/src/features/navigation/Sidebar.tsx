import { NavLink } from "react-router-dom";
import { navigationItems } from "@renderer/shared/navigation";

export function Sidebar() {
  return (
    <aside className="sidebar">
      <nav className="sidebar__nav" aria-label="Primary">
        {navigationItems.map((item) => (
          <div className="sidebar__nav-group" key={item.path}>
            <NavLink
              className={({ isActive }) =>
                isActive ? "sidebar__link sidebar__link--active" : "sidebar__link"
              }
              to={item.path}
            >
              <span className="sidebar__link-name">{item.label}</span>
            </NavLink>
            {item.path === "/library" ? (
              <div className="sidebar__subnav">
                <span className="sidebar__subnav-item sidebar__subnav-item--active">
                  All Series
                </span>
              </div>
            ) : null}
          </div>
        ))}
      </nav>
    </aside>
  );
}
