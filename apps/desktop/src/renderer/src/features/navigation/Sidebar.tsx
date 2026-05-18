import { NavLink } from "react-router-dom";
import { navigationItems } from "@renderer/shared/navigation";

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__eyebrow">Windows-first shell</span>
        <div className="sidebar__title">FloirsMNH</div>
        <div className="sidebar__copy">
          Foundation shell for a local-first manhwa desktop client with a full
          navigation map from day one.
        </div>
      </div>

      <nav className="sidebar__nav" aria-label="Primary">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            className={({ isActive }) =>
              isActive ? "sidebar__link sidebar__link--active" : "sidebar__link"
            }
            to={item.path}
          >
            <span className="sidebar__link-name">{item.label}</span>
            <span className="sidebar__link-meta">{item.meta}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__footer-label">Phase 1 proof</div>
        <div className="sidebar__footer-value">
          Shell, routing, and placeholders are live.
        </div>
      </div>
    </aside>
  );
}
