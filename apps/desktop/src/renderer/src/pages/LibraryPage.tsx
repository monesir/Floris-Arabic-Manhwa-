import { useEffect, useMemo, useState, useRef, type FormEvent } from "react";
import type { ImportResult } from "@contracts/imports";
import type {
  LibraryCustomList,
  LibraryEntry,
  ReadingStatus,
} from "@contracts/library";
import type { SourceCatalogItem } from "@contracts/source";
import { LibraryCustomListsPanel } from "@renderer/features/library/LibraryCustomListsPanel";
import { importCbz, importFolder, importPdf } from "@renderer/shared/imports-store";
import {
  addLibraryEntryToList,
  createLibraryList,
  listLibraryEntries,
  listLibraryLists,
  refreshLibraryUpdates,
  removeLibraryEntryFromList,
  updateLibraryEntryFavorite,
  updateLibraryEntryCover,
  updateLibraryEntryStatus,
} from "@renderer/shared/library-store";
import { getSourceCatalog, searchSourceTitles } from "@renderer/shared/source-registry";
import { getAllCompletedChapterCounts } from "@renderer/shared/analytics-store";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CachedImage } from "@renderer/shared/CachedImage";

const STATUS_OPTIONS: Array<{ value: ReadingStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "reading", label: "Reading" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On hold" },
  { value: "dropped", label: "Dropped" },
  { value: "plan_to_read", label: "Plan to read" },
];

const SORT_OPTIONS = [
  { value: "updated_desc", label: "Recently updated" },
  { value: "created_desc", label: "Recently added" },
  { value: "title_asc", label: "Title A-Z" },
  { value: "title_desc", label: "Title Z-A" },
] as const;

function readingStatusLabel(status: ReadingStatus) {
  switch (status) {
    case "reading":
      return "Reading";
    case "completed":
      return "Completed";
    case "on_hold":
      return "On hold";
    case "dropped":
      return "Dropped";
    case "plan_to_read":
      return "Plan to read";
    default:
      return status;
  }
}

function initialsFromTitle(title: string) {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function LibraryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [customLists, setCustomLists] = useState<LibraryCustomList[]>([]);
  const [catalog, setCatalog] = useState<SourceCatalogItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [searchDraft, setSearchDraft] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReadingStatus | "all">("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | "all">(searchParams.get("list") ?? "all");
  const [sortOrder, setSortOrder] = useState<(typeof SORT_OPTIONS)[number]["value"]>("updated_desc");
  const [listNameDraft, setListNameDraft] = useState("");
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [isRefreshingUpdates, setIsRefreshingUpdates] = useState(false);
  const [updateNotice, setUpdateNotice] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<null | "folder" | "cbz" | "pdf">(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [pendingEntryIds, setPendingEntryIds] = useState<Record<string, boolean>>({});
  const [importMenuOpen, setImportMenuOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [fetchedCovers, setFetchedCovers] = useState<Record<string, string>>({});
  const [completedCounts, setCompletedCounts] = useState<Record<string, number>>({});
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const triedCoversRef = useRef<Set<string>>(new Set());

  const filtersRef = useRef<HTMLDivElement>(null);
  const importRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setFiltersOpen(false);
      }
      if (importRef.current && !importRef.current.contains(event.target as Node)) {
        setImportMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const routeListId = searchParams.get("list") ?? "all";
    setSelectedListId(routeListId);
  }, [searchParams]);

  useEffect(() => {
    setStatus("loading");
    setError(null);

    void Promise.all([
      listLibraryEntries({
        search: searchValue,
        readingStatus: statusFilter,
        favoritesOnly,
        listId: selectedListId,
        sort: sortOrder,
      }),
      listLibraryLists(),
      getSourceCatalog(),
    ])
      .then(([libraryEntries, libraryLists, sourceCatalog]) => {
        setEntries(libraryEntries);
        setCustomLists(libraryLists);
        setCatalog(sourceCatalog);
        setStatus("ready");
      })
      .catch((nextError: unknown) => {
        setStatus("error");
        setError(nextError instanceof Error ? nextError.message : "Failed to load local library.");
      });
  }, [favoritesOnly, searchValue, selectedListId, sortOrder, statusFilter]);

  // Auto-refresh library updates on page load
  useEffect(() => {
    void refreshLibraryUpdates()
      .then(() => refreshLibraryState())
      .catch(() => {});
  }, []);

  // Fetch completed chapter counts for all titles in one batch query
  useEffect(() => {
    void getAllCompletedChapterCounts()
      .then((counts) => setCompletedCounts(counts))
      .catch(() => {});
  }, [entries]);

  // Fetch covers for library entries that have no coverUrl
  useEffect(() => {
    if (status !== "ready") return;

    const missing = entries.filter(
      (e) => !e.coverUrl && !fetchedCovers[e.sourceTitleId] && !triedCoversRef.current.has(e.sourceTitleId),
    );
    if (missing.length === 0) return;

    const unique = Array.from(new Map(missing.map((e) => [e.sourceTitleId, e])).values()).slice(0, 20);

    for (const entry of unique) {
      triedCoversRef.current.add(entry.sourceTitleId);
      // Use search instead of getSourceTitle to get clean covers (no watermarks)
      void searchSourceTitles(entry.sourceId, entry.titleName, 1)
        .then((res) => {
          const match = res?.items?.find((i) => i.titleId === entry.sourceTitleId);
          if (match?.coverUrl) {
            setFetchedCovers((prev) => ({ ...prev, [entry.sourceTitleId]: match.coverUrl as string }));
            // Persist the discovered cover without mutating updated_at ordering.
            void updateLibraryEntryCover(
              entry.sourceId,
              entry.sourceTitleId,
              match.coverUrl,
            );
          }
        })
        .catch(() => {});
    }
  }, [entries, status, fetchedCovers]);

  const sourceLabels = useMemo(
    () =>
      new Map(
        catalog.map((source) => [
          source.metadata.sourceId,
          source.metadata.displayName,
        ]),
      ),
    [catalog],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<ReadingStatus, number> = {
      reading: 0,
      completed: 0,
      on_hold: 0,
      dropped: 0,
      plan_to_read: 0,
    };

    for (const entry of entries) {
      counts[entry.readingStatus] += 1;
    }

    return counts;
  }, [entries]);

  function setPending(libraryEntryId: string, isPending: boolean) {
    setPendingEntryIds((current) => {
      const next = { ...current };

      if (isPending) {
        next[libraryEntryId] = true;
      } else {
        delete next[libraryEntryId];
      }

      return next;
    });
  }

  function refreshLibraryState() {
    return Promise.all([
      listLibraryEntries({
        search: searchValue,
        readingStatus: statusFilter,
        favoritesOnly,
        listId: selectedListId,
        sort: sortOrder,
      }),
      listLibraryLists(),
    ]).then(([nextEntries, nextLists]) => {
      setEntries(nextEntries);
      setCustomLists(nextLists);
    });
  }

  function handleImport(
    kind: "folder" | "cbz" | "pdf",
    action: () => Promise<ImportResult | null>,
  ) {
    setIsImporting(kind);
    setError(null);
    setImportNotice(null);

    void action()
      .then((result) => {
        if (!result) {
          return;
        }

        setImportNotice(`Imported "${result.libraryEntry.titleName}" from ${result.importKind.toUpperCase()}.`);
        return Promise.all([refreshLibraryState(), getSourceCatalog().then(setCatalog)]);
      })
      .catch((nextError: unknown) => {
        setError(nextError instanceof Error ? nextError.message : "Failed to import local content.");
      })
      .finally(() => {
        setIsImporting(null);
      });
  }

  function handleApplySearch() {
    setSearchValue(searchDraft.trim());
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchValue(searchDraft.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchDraft]);

  function handleResetFilters() {
    setSearchDraft("");
    setSearchValue("");
    setStatusFilter("all");
    setFavoritesOnly(false);
    setSelectedListId("all");
    setSortOrder("updated_desc");
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  function handleRefreshUpdates() {
    setIsRefreshingUpdates(true);
    setError(null);
    setUpdateNotice(null);

    void refreshLibraryUpdates()
      .then((summary) => {
        if (summary.updatedCount > 0) {
          setUpdateNotice(`Found new chapters for ${summary.updatedCount} title(s)!`);
        } else {
          setUpdateNotice(`Library is up to date (Checked ${summary.checkedCount} titles).`);
        }
        setTimeout(() => setUpdateNotice(null), 4000);
        return refreshLibraryState();
      })
      .catch((nextError: unknown) => {
        setError(nextError instanceof Error ? nextError.message : "Failed to refresh library updates.");
      })
      .finally(() => {
        setIsRefreshingUpdates(false);
      });
  }

  function handleStatusChange(libraryEntryId: string, readingStatus: ReadingStatus) {
    setPending(libraryEntryId, true);
    setError(null);

    void updateLibraryEntryStatus(libraryEntryId, readingStatus)
      .then((nextEntry) => {
        if (!nextEntry) {
          throw new Error("Library entry no longer exists.");
        }

        return refreshLibraryState();
      })
      .catch((nextError: unknown) => {
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Failed to update reading status.",
        );
      })
      .finally(() => {
        setPending(libraryEntryId, false);
      });
  }

  function handleFavoriteToggle(entry: LibraryEntry) {
    setPending(entry.libraryEntryId, true);
    setError(null);

    void updateLibraryEntryFavorite(entry.libraryEntryId, !entry.isFavorite)
      .then((nextEntry) => {
        if (!nextEntry) {
          throw new Error("Library entry no longer exists.");
        }

        return refreshLibraryState();
      })
      .catch((nextError: unknown) => {
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Failed to update favorite state.",
        );
      })
      .finally(() => {
        setPending(entry.libraryEntryId, false);
      });
  }

  function handleCreateList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextName = listNameDraft.trim();
    if (!nextName || isCreatingList) {
      return;
    }

    setIsCreatingList(true);
    setError(null);

    void createLibraryList({ name: nextName })
      .then((nextList) => {
        setListNameDraft("");
        setSelectedListId(nextList.listId);
        setSearchParams(new URLSearchParams({ list: nextList.listId }), { replace: true });
        return refreshLibraryState();
      })
      .catch((nextError: unknown) => {
        setError(nextError instanceof Error ? nextError.message : "Failed to create custom list.");
      })
      .finally(() => {
        setIsCreatingList(false);
      });
  }

  function handleSelectList(nextListId: string | "all") {
    setSelectedListId(nextListId);
    if (nextListId === "all") {
      setSearchParams(new URLSearchParams(), { replace: true });
      return;
    }

    setSearchParams(new URLSearchParams({ list: nextListId }), { replace: true });
  }

  function handleToggleListMembership(entry: LibraryEntry, list: LibraryCustomList) {
    setPending(entry.libraryEntryId, true);
    setError(null);

    const task = entry.listIds.includes(list.listId)
      ? removeLibraryEntryFromList(entry.libraryEntryId, list.listId)
      : addLibraryEntryToList(entry.libraryEntryId, list.listId);

    void task
      .then((nextEntry) => {
        if (!nextEntry) {
          throw new Error("Library entry no longer exists.");
        }

        return refreshLibraryState();
      })
      .catch((nextError: unknown) => {
        setError(nextError instanceof Error ? nextError.message : "Failed to update custom list membership.");
      })
      .finally(() => {
        setPending(entry.libraryEntryId, false);
      });
  }

  const favoriteCount = entries.filter((entry) => entry.isFavorite).length;

  async function handleDeleteSelected() {
    if (selectedEntryIds.length === 0) {
      setIsSelectionMode(false);
      return;
    }
    
    if (!confirm(`Are you sure you want to remove ${selectedEntryIds.length} titles from your library?`)) {
      return;
    }

    try {
      await Promise.all(selectedEntryIds.map(id => window.libraryStore.remove(id)));
      setIsSelectionMode(false);
      setSelectedEntryIds([]);
      await refreshLibraryState();
    } catch (err) {
      setError("Failed to delete selected titles.");
    }
  }

  return (
    <div className="page page--floirs">
      <section className="floirs-toolbar">
        <div className="floirs-toolbar__actions" style={{ gap: '0.5rem' }}>
          <div className="floirs-search-shell floirs-search-shell--wide" style={{ flex: 1, maxWidth: '300px' }}>
            <input
              className="floirs-search-input"
              type="search"
              placeholder="Search library..."
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleApplySearch();
                }
              }}
            />
          </div>
          {isSelectionMode ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                className="floirs-button"
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedEntryIds([]);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="floirs-button floirs-button--danger"
                onClick={handleDeleteSelected}
                style={{ backgroundColor: '#ef4444', color: '#fff' }}
              >
                Delete ({selectedEntryIds.length})
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="floirs-button floirs-button--icon"
              title="Select to Delete"
              onClick={() => setIsSelectionMode(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </button>
          )}
          <button
            type="button"
            className="floirs-button floirs-button--icon"
            title="Reset Filters"
            onClick={handleResetFilters}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
          </button>
          <div style={{ position: 'relative' }} ref={filtersRef}>
            <button
              type="button"
              className="floirs-button floirs-button--icon"
              title="Filters & Categories"
              onClick={() => setFiltersOpen((prev) => !prev)}
              style={{
                backgroundColor: filtersOpen ? 'rgba(255,255,255,0.1)' : 'transparent'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
            </button>
            {filtersOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.5rem',
                background: 'rgba(15, 15, 15, 0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                zIndex: 100,
                width: '320px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <label className="library-field">
                    <span className="library-field__label" style={{ minWidth: '60px' }}>Status</span>
                    <select
                      className="browse-controls__select"
                      value={statusFilter}
                      onChange={(event) =>
                        setStatusFilter(event.target.value as ReadingStatus | "all")
                      }
                      style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff' }}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value} style={{ background: '#1e1e1e', color: '#fff' }}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="library-field">
                    <span className="library-field__label" style={{ minWidth: '60px' }}>Sort</span>
                    <select
                      className="browse-controls__select"
                      value={sortOrder}
                      onChange={(event) =>
                        setSortOrder(
                          event.target.value as (typeof SORT_OPTIONS)[number]["value"],
                        )
                      }
                      style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff' }}
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value} style={{ background: '#1e1e1e', color: '#fff' }}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="library-favorite-filter" style={{ marginTop: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={favoritesOnly}
                      onChange={(event) => setFavoritesOnly(event.target.checked)}
                    />
                    <span style={{ fontSize: '0.9rem', color: '#ddd' }}>Favorites only</span>
                  </label>
                </div>
                
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.5rem 0' }} />

                <LibraryCustomListsPanel
                  customLists={customLists}
                  selectedListId={selectedListId}
                  draftName={listNameDraft}
                  isCreating={isCreatingList}
                  onDraftNameChange={setListNameDraft}
                  onCreateList={handleCreateList}
                  onSelectList={handleSelectList}
                />

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.5rem 0' }} />

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {STATUS_OPTIONS.filter((option) => option.value !== "all").map((option) => (
                    <span className="page__pill" key={option.value} style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                      {option.label}: {statusCounts[option.value as ReadingStatus]}
                    </span>
                  ))}
                  <span className="page__pill" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>Total: {entries.length}</span>
                  <span className="page__pill" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>Favs: {favoriteCount}</span>
                </div>
              </div>
            )}
          </div>
          <div style={{ position: 'relative' }} ref={importRef}>
            <button
              type="button"
              className="floirs-button floirs-button--icon"
              title={isImporting ? "Importing..." : "Import..."}
              disabled={Boolean(isImporting)}
              onClick={() => setImportMenuOpen(!importMenuOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-1.2-1.8A2 2 0 0 0 7.55 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path>
                <path d="M12 10v6"></path>
                <path d="M9 13h6"></path>
              </svg>
            </button>
            {importMenuOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '0.5rem',
                background: '#000000',
                border: '1px solid #232323',
                borderRadius: '8px',
                padding: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                zIndex: 100,
                minWidth: '160px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}>
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem 0.75rem',
                    background: 'transparent',
                    border: 'none',
                    color: '#e0e0e0',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => { handleImport("folder", importFolder); setImportMenuOpen(false); }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-1.2-1.8A2 2 0 0 0 7.55 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path>
                  </svg>
                  Import Folder
                </button>
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem 0.75rem',
                    background: 'transparent',
                    border: 'none',
                    color: '#e0e0e0',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => { handleImport("cbz", importCbz); setImportMenuOpen(false); }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                    <line x1="3" x2="21" y1="9" y2="9"></line>
                    <line x1="9" x2="9" y1="21" y2="9"></line>
                  </svg>
                  Import CBZ
                </button>
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem 0.75rem',
                    background: 'transparent',
                    border: 'none',
                    color: '#e0e0e0',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => { handleImport("pdf", importPdf); setImportMenuOpen(false); }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" x2="8" y1="13" y2="13"></line>
                    <line x1="16" x2="8" y1="17" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  Import PDF
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            className="floirs-button floirs-button--icon"
            title={isRefreshingUpdates ? "Refreshing..." : "Refresh Library"}
            disabled={isRefreshingUpdates}
            onClick={handleRefreshUpdates}
          >
            <svg className={isRefreshingUpdates ? "spin" : ""} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
              <path d="M3 22v-6h6"></path>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
            </svg>
          </button>
        </div>
      </section>

      <section>
        
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '1rem' }} className="library-quick-tabs">
          <button 
            type="button" 
            className={`page__pill ${selectedListId === 'all' ? 'page__pill--active' : ''}`}
            onClick={() => setSelectedListId('all')}
            style={{ 
              cursor: 'pointer', 
              border: 'none', 
              background: selectedListId === 'all' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
              color: selectedListId === 'all' ? '#fff' : '#aaa',
              transition: 'all 0.2s',
              padding: '0.5rem 1rem',
              fontWeight: selectedListId === 'all' ? '600' : 'normal'
            }}
          >
            All
          </button>
          {customLists.map(list => (
            <button 
              key={list.listId}
              type="button" 
              className={`page__pill ${selectedListId === list.listId ? 'page__pill--active' : ''}`}
              onClick={() => setSelectedListId(list.listId)}
              style={{ 
                cursor: 'pointer', 
                border: 'none', 
                background: selectedListId === list.listId ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                color: selectedListId === list.listId ? '#fff' : '#aaa',
                transition: 'all 0.2s',
                padding: '0.5rem 1rem',
                fontWeight: selectedListId === list.listId ? '600' : 'normal'
              }}
            >
              {list.name}
            </button>
          ))}
        </div>

        {importNotice ? <p className="browse-message">{importNotice}</p> : null}
        {updateNotice ? <p className="browse-message" style={{ color: '#4CAF50' }}>{updateNotice}</p> : null}
        {status === "loading" ? <p className="browse-message">Loading local library...</p> : null}
        {error ? <p className="browse-message browse-message--error">{error}</p> : null}

        {status === "ready" && entries.length === 0 ? (
          <p className="browse-message">
            No titles match the current library filters. Add titles from Browse or reset the controls above.
          </p>
        ) : null}

        <div className="floirs-grid floirs-grid--browse">
          {entries.map((entry) => {
            const isPending = Boolean(pendingEntryIds[entry.libraryEntryId]);

            return (
              <article
                className="floirs-cover-card floirs-cover-card--browse"
                key={entry.libraryEntryId}
              >
                <button
                  type="button"
                  className="floirs-cover-card__action"
                  onClick={() => {
                    if (isSelectionMode) {
                      setSelectedEntryIds(prev => 
                        prev.includes(entry.libraryEntryId)
                          ? prev.filter(id => id !== entry.libraryEntryId)
                          : [...prev, entry.libraryEntryId]
                      );
                    } else {
                      navigate(
                        `/browse?source=${encodeURIComponent(entry.sourceId)}&title=${encodeURIComponent(entry.sourceTitleId)}&page=1`,
                      );
                    }
                  }}
                >
                  <div className="floirs-cover-card__media">
                    {(entry.coverUrl || fetchedCovers[entry.sourceTitleId]) ? (
                      <CachedImage
                        className="floirs-cover-card__image"
                        src={(entry.coverUrl || fetchedCovers[entry.sourceTitleId])!}
                        alt={entry.titleName}
                      />
                    ) : (
                      <div className="floirs-cover-card__fallback">
                        {initialsFromTitle(entry.titleName)}
                      </div>
                    )}
                    {isSelectionMode && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: selectedEntryIds.includes(entry.libraryEntryId) ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0, 0, 0, 0.5)',
                        border: selectedEntryIds.includes(entry.libraryEntryId) ? '3px solid #ef4444' : '3px solid transparent',
                        zIndex: 20,
                        transition: 'all 0.2s',
                        borderRadius: 'var(--floirs-radius-lg)',
                      }}>
                        {selectedEntryIds.includes(entry.libraryEntryId) && (
                          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                        )}
                      </div>
                    )}
                    <div 
                      style={{ 
                        position: 'absolute', 
                        top: '6px', 
                        left: '6px', 
                        zIndex: 10, 
                        background: 'rgba(0, 0, 0, 0.65)', 
                        backdropFilter: 'blur(8px)',
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '3px 8px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        maxWidth: '80%',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                      }}
                    >
                      {sourceLabels.get(entry.sourceId) ?? entry.sourceId}
                    </div>
                    {(() => {
                      const completedCount = completedCounts[`${entry.sourceId}:${entry.sourceTitleId}`] ?? 0;
                      const unread = entry.totalChapterCount > 0 ? Math.max(entry.totalChapterCount - completedCount, 0) : 0;
                      
                      if (unread > 0) {
                        return <div className="library-unread-badge">{unread}</div>;
                      }
                      if (entry.pendingUpdateCount > 0) {
                        return <div className="library-update-badge">{entry.pendingUpdateCount}</div>;
                      }
                      return null;
                    })()}
                    
                    <div className="floirs-cover-card__overlay">
                      <div className="floirs-cover-card__title" title={entry.titleName}>
                        {entry.titleName}
                      </div>
                    </div>
                  </div>
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
