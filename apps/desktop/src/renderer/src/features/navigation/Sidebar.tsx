import { type ReactNode, useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { LibraryCustomList } from "@contracts/library";
import { listLibraryLists, createLibraryList, deleteLibraryList } from "@renderer/shared/library-store";
import { getPluginRegistryState } from "@renderer/shared/plugin-registry";
import { BackupSettingsCard } from "@renderer/features/settings/BackupSettingsCard";

function IconLibrary() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
  );
}

function IconLibraryBook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>
  );
}

function IconBrowse() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/></svg>
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
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

function IconInfo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
  );
}

function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

function IconLanguages() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 8 6 6"/>
      <path d="m4 14 6-6 2-3"/>
      <path d="M2 5h12"/>
      <path d="M7 2h1"/>
      <path d="m22 22-5-10-5 10"/>
      <path d="M14 18h6"/>
    </svg>
  );
}

function IconImport() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
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
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.625rem 1rem",
        fontSize: "0.875rem",
        cursor: "pointer",
        transition: "background-color 0.2s, color 0.2s",
        textDecoration: "none"
      }}
    >
      <span style={{ display: "flex" }}>{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [lists, setLists] = useState<LibraryCustomList[]>([]);
  const [sources, setSources] = useState<{ id: string; name: string }[]>([]);
  const [showInfoMenu, setShowInfoMenu] = useState(false);
  const [showCacheMenu, setShowCacheMenu] = useState(false);
  const [cacheSizeMb, setCacheSizeMb] = useState<string>("0.00");
  const [libraryExpanded, setLibraryExpanded] = useState(true);
  const [exploreExpanded, setExploreExpanded] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [hoveredListId, setHoveredListId] = useState<string | null>(null);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const currentListId = searchParams.get("list");

  useEffect(() => {
    void listLibraryLists()
      .then(setLists)
      .catch(() => {
        setLists([]);
      });
      
    void getPluginRegistryState().then((snapshot) => {
      const allSources = snapshot.plugins.flatMap((p) =>
        p.sources
          .filter((s) => s.sourceId !== "local-imports" && s.displayName !== "Local Imports")
          .map((s) => ({ id: s.sourceId, name: s.displayName }))
      );
      setSources(allSources);
    }).catch(() => {});
  }, []);

  const isLibraryView = location.pathname === "/library";
  const isExploreView = location.pathname.startsWith("/browse");

  return (
    <aside className="floirs-sidebar" style={{
      width: "220px",
      backgroundColor: "#0B0B0B",
      borderRight: "1px solid #222",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0
    }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem 0" }}>
        
        <div style={{ marginBottom: "0.5rem" }}>
          <div 
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.625rem 1rem",
              fontSize: "0.875rem",
              cursor: "pointer",
              transition: "all 0.2s",
              color: isLibraryView ? "#ffffff" : "#aaa",
              fontWeight: isLibraryView ? "700" : "600",
              backgroundColor: isLibraryView ? "rgba(255, 255, 255, 0.05)" : "transparent"
            }}
            onClick={() => {
              navigate("/library");
              setLibraryExpanded((value) => !value);
            }}
            onMouseEnter={(e) => {
              if (!isLibraryView) {
                e.currentTarget.style.color = "#e0e0e0";
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLibraryView) {
                e.currentTarget.style.color = "#aaa";
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <IconLibraryBook />
              <span>Library</span>
            </div>
            <div style={{ color: "#888", display: "flex", transition: "color 0.2s" }}
                 onMouseEnter={(e) => e.currentTarget.style.color = "#ccc"}
                 onMouseLeave={(e) => e.currentTarget.style.color = "#888"}
            >
              {libraryExpanded ? <IconChevronDown /> : <IconChevronRight />}
            </div>
          </div>

          {libraryExpanded ? (
            <div style={{ marginTop: "0.25rem", display: "flex", flexDirection: "column", gap: "0.125rem" }}>
              <div
                style={{
                  padding: "0.5rem 1rem 0.5rem 2.75rem",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  color: !currentListId && isLibraryView ? "#ff6740" : "#777",
                  fontWeight: !currentListId && isLibraryView ? "700" : "500",
                  backgroundColor: !currentListId && isLibraryView ? "rgba(255, 103, 64, 0.1)" : "transparent"
                }}
                onClick={() => navigate("/library")}
                onMouseEnter={(e) => {
                  if (currentListId || !isLibraryView) {
                    e.currentTarget.style.color = "#aaa";
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentListId || !isLibraryView) {
                    e.currentTarget.style.color = "#777";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                All Series
              </div>
              {lists.map((list) => {
                const isActive = currentListId === list.listId && isLibraryView;
                return (
                  <div
                    key={list.listId}
                    style={{
                      padding: "0.5rem 1rem 0.5rem 2.75rem",
                      fontSize: "13px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      color: isActive ? "#ff6740" : "#777",
                      fontWeight: isActive ? "700" : "500",
                      backgroundColor: isActive ? "rgba(255, 103, 64, 0.1)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                    onClick={() => navigate(`/library?list=${encodeURIComponent(list.listId)}`)}
                    onMouseEnter={(e) => {
                      setHoveredListId(list.listId);
                      if (!isActive) {
                        e.currentTarget.style.color = "#aaa";
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      setHoveredListId(null);
                      if (!isActive) {
                        e.currentTarget.style.color = "#777";
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <span>{list.name}</span>
                    {hoveredListId === list.listId && (
                      <div
                        title="Delete List"
                        style={{
                          color: "#ff4d4f",
                          display: "flex",
                          padding: "2px",
                          borderRadius: "4px",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to delete the list "${list.name}"?`)) {
                            deleteLibraryList(list.listId)
                              .then(() => {
                                listLibraryLists().then(setLists);
                                if (currentListId === list.listId) {
                                  navigate("/library");
                                }
                              })
                              .catch((err) => {
                                alert(`Failed to delete list: ${err.message}`);
                              });
                          }
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255, 77, 79, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <IconTrash />
                      </div>
                    )}
                  </div>
                );
              })}
              <div 
                style={{
                  padding: "0.5rem 1rem 0.5rem 2.75rem",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  color: "#777",
                  fontWeight: "500"
                }}
                onClick={() => setIsCreatingCategory(true)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#aaa";
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#777";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {isCreatingCategory ? null : "New category..."}
              </div>
              {isCreatingCategory && (
                <form
                  style={{ padding: "0.25rem 1rem 0.5rem 2.75rem", display: "flex", gap: "0.25rem" }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const trimmed = newCategoryName.trim();
                    if (!trimmed) return;
                    void createLibraryList({ name: trimmed }).then((created) => {
                      setLists((prev) => [...prev, created]);
                      setNewCategoryName("");
                      setIsCreatingCategory(false);
                      navigate(`/library?list=${created.listId}`);
                    }).catch(() => {});
                  }}
                >
                  <input
                    autoFocus
                    type="text"
                    placeholder="Category name..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onBlur={() => {
                      if (!newCategoryName.trim()) {
                        setIsCreatingCategory(false);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setIsCreatingCategory(false);
                        setNewCategoryName("");
                      }
                    }}
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid #444",
                      borderRadius: "4px",
                      padding: "0.3rem 0.5rem",
                      color: "#fff",
                      fontSize: "12px",
                      outline: "none"
                    }}
                  />
                </form>
              )}
            </div>
          ) : null}
        </div>

        <div style={{ marginBottom: "0.5rem" }}>
          <div 
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.625rem 1rem",
              fontSize: "0.875rem",
              cursor: "pointer",
              transition: "all 0.2s",
              color: isExploreView ? "#ffffff" : "#aaa",
              fontWeight: isExploreView ? "700" : "600",
              backgroundColor: isExploreView ? "rgba(255, 255, 255, 0.05)" : "transparent"
            }}
            onClick={() => {
              navigate("/browse");
              setExploreExpanded((value) => !value);
            }}
            onMouseEnter={(e) => {
              if (!isExploreView) {
                e.currentTarget.style.color = "#e0e0e0";
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isExploreView) {
                e.currentTarget.style.color = "#aaa";
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <IconBrowse />
              <span>Explore</span>
            </div>
            <div style={{ color: "#888", display: "flex", transition: "color 0.2s" }}
                 onMouseEnter={(e) => e.currentTarget.style.color = "#ccc"}
                 onMouseLeave={(e) => e.currentTarget.style.color = "#888"}
            >
              {exploreExpanded ? <IconChevronDown /> : <IconChevronRight />}
            </div>
          </div>

          {exploreExpanded ? (
            <div style={{ marginTop: "0.25rem", display: "flex", flexDirection: "column", gap: "0.125rem" }}>
              {sources.map((source) => {
                const isActive = searchParams.get("source") === source.id;
                return (
                  <div
                    key={source.id}
                    style={{
                      padding: "0.5rem 1rem 0.5rem 2.75rem",
                      fontSize: "13px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      color: isActive ? "#ff6740" : "#777",
                      fontWeight: isActive ? "700" : "500",
                      backgroundColor: isActive ? "rgba(255, 103, 64, 0.1)" : "transparent"
                    }}
                    onClick={() => navigate(`/browse?source=${source.id}`)}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = "#aaa";
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = "#777";
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    {source.name}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        <NavItem to="/history" label="History" icon={<IconHistory />} />
      </div>

      <div 
        style={{
          padding: "1rem",
          marginTop: "auto",
          borderTop: "1px solid transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "#888"
        }}
      >
        <div style={{ fontWeight: "700", fontSize: "13px" }}></div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div
            style={{ display: "flex", color: "#666", position: "relative", cursor: "pointer", transition: "color 0.2s" }}
            onMouseEnter={(e) => {
              setShowCacheMenu(true);
              e.currentTarget.style.color = "#ff4444";
              void window.coverCache.getSize().then((bytes) => {
                setCacheSizeMb((bytes / 1024 / 1024).toFixed(2));
              });
            }}
            onMouseLeave={(e) => {
              setShowCacheMenu(false);
              e.currentTarget.style.color = "#666";
            }}
            onClick={() => {
              void window.coverCache.clear().then(() => {
                setCacheSizeMb("0.00");
              });
            }}
          >
            <IconTrash />
            {showCacheMenu && (
              <div style={{
                position: "absolute",
                bottom: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                marginBottom: "8px",
                background: "#000",
                border: "1px solid #333",
                borderRadius: "6px",
                padding: "0.5rem 0",
                width: "max-content",
                zIndex: 100,
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
              }}>
                <div style={{ padding: "0.25rem 1rem", fontSize: "0.75rem", color: "#888", display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "center" }}>
                  <span style={{ color: "#fff", fontWeight: "600" }}>Clear Image Cache</span>
                  <span>Size: {cacheSizeMb} MB</span>
                </div>
              </div>
            )}
          </div>

          <div
            style={{ display: "flex", color: "#666", position: "relative", cursor: "pointer", transition: "color 0.2s" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#ff6740"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#666"}
            onClick={() => setShowBackupModal(true)}
            title="Import Tachiyomi Backup"
          >
            <IconImport />
          </div>

          <div 
            style={{ display: "flex", color: "#666", position: "relative", cursor: "pointer", transition: "color 0.2s" }}
            onMouseEnter={(e) => {
              setShowInfoMenu(true);
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              setShowInfoMenu(false);
              e.currentTarget.style.color = "#666";
            }}
          >
            <IconInfo />
            {showInfoMenu && (
              <div style={{
                position: "absolute",
                bottom: "100%",
                right: -10, // Slight offset to align better
                paddingBottom: "0.5rem", // Transparent bridge so mouse doesn't leave
                zIndex: 100,
              }}>
                <div style={{
                  backgroundColor: "#000000",
                  border: "1px solid #333",
                  borderRadius: "4px",
                  padding: "0.75rem",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  minWidth: "140px"
                }}>
                  <div style={{ color: "#fff", fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap" }}>FloirsMNH v0.1.0</div>
                  <a 
                    href="https://github.com/Floirs/FloirsMNH"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#aaa", fontSize: "12px", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#ff6740"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "#aaa"}
                  >
                    GitHub Repository
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showBackupModal && (
        <div 
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: "rgba(0,0,0,0.7)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}
          onClick={() => setShowBackupModal(false)}
        >
          <div 
            style={{ 
              width: "500px", maxWidth: "90%", backgroundColor: "#1a1a1a", 
              borderRadius: "8px", border: "1px solid #333", overflow: "hidden",
              position: "relative"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowBackupModal(false)}
              style={{
                position: "absolute", top: "16px", right: "16px", 
                background: "none", border: "none", color: "#aaa", cursor: "pointer",
                fontSize: "20px", lineHeight: 1
              }}
            >×</button>
            <BackupSettingsCard />
          </div>
        </div>
      )}
    </aside>
  );
}
