import { NavLink } from "react-router-dom";
import { useLanguage } from "@renderer/features/settings/language-context";
import { navigationItems } from "@renderer/shared/navigation";

export function Sidebar() {
  const { copy } = useLanguage();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__eyebrow">{copy.sidebarEyebrow}</span>
        <div className="sidebar__title">{copy.shellTitle}</div>
        <div className="sidebar__copy">{copy.shellDescription}</div>
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
        <div className="sidebar__footer-label">{copy.sidebarFooterLabel}</div>
        <div className="sidebar__footer-value">{copy.sidebarFooterValue}</div>
      </div>
    </aside>
  );
}
