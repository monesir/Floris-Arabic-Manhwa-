import { useEffect, useMemo, useState, type FormEvent } from "react";
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
  updateLibraryEntryStatus,
} from "@renderer/shared/library-store";
import { getSourceCatalog } from "@renderer/shared/source-registry";
import { useNavigate, useSearchParams } from "react-router-dom";

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
  const [isImporting, setIsImporting] = useState<null | "folder" | "cbz" | "pdf">(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [pendingEntryIds, setPendingEntryIds] = useState<Record<string, boolean>>({});

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

    void refreshLibraryUpdates()
      .then(() => refreshLibraryState())
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

  return (
    <div className="page page--floirs">
      <section className="floirs-toolbar">
        <div className="floirs-toolbar__actions floirs-toolbar__actions--end">
          <button
            type="button"
            className="floirs-button floirs-button--ghost"
            onClick={handleResetFilters}
          >
            Reset
          </button>
          <button
            type="button"
            className="floirs-button floirs-button--ghost"
            disabled={Boolean(isImporting)}
            onClick={() => handleImport("folder", importFolder)}
          >
            {isImporting === "folder" ? "Importing..." : "Import Folder"}
          </button>
          <button
            type="button"
            className="floirs-button floirs-button--ghost"
            disabled={Boolean(isImporting)}
            onClick={() => handleImport("cbz", importCbz)}
          >
            {isImporting === "cbz" ? "Importing..." : "Import CBZ"}
          </button>
          <button
            type="button"
            className="floirs-button floirs-button--ghost"
            disabled={Boolean(isImporting)}
            onClick={() => handleImport("pdf", importPdf)}
          >
            {isImporting === "pdf" ? "Importing..." : "Import PDF"}
          </button>
          <button
            type="button"
            className="floirs-button floirs-button--ghost"
            disabled={isRefreshingUpdates}
            onClick={handleRefreshUpdates}
          >
            {isRefreshingUpdates ? "Refreshing..." : "Refresh"}
          </button>
          <div className="floirs-search-shell">
            <input
              className="floirs-search-input"
              type="search"
              placeholder="Search"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleApplySearch();
                }
              }}
            />
          </div>
        </div>
      </section>

      <section className="page__panel library-toolbar library-toolbar--compact">
        <div className="library-toolbar__grid library-toolbar__grid--compact">
          <label className="library-field">
            <span className="library-field__label">Status</span>
            <select
              className="browse-controls__select"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as ReadingStatus | "all")
              }
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="library-field">
            <span className="library-field__label">Sort</span>
            <select
              className="browse-controls__select"
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(
                  event.target.value as (typeof SORT_OPTIONS)[number]["value"],
                )
              }
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="library-field">
            <span className="library-field__label">List</span>
            <select
              className="browse-controls__select"
              value={selectedListId}
              onChange={(event) => setSelectedListId(event.target.value)}
            >
              <option value="all">All lists</option>
              {customLists.map((list) => (
                <option key={list.listId} value={list.listId}>
                  {list.name}
                </option>
              ))}
            </select>
          </label>

          <label className="library-favorite-filter">
            <input
              type="checkbox"
              checked={favoritesOnly}
              onChange={(event) => setFavoritesOnly(event.target.checked)}
            />
            <span>Favorites only</span>
          </label>
        </div>
        {importNotice ? <p className="browse-message">{importNotice}</p> : null}

        <div className="library-status-row">
          {STATUS_OPTIONS.filter((option) => option.value !== "all").map((option) => (
            <span className="page__pill" key={option.value}>
              {option.label}: {statusCounts[option.value as ReadingStatus]}
            </span>
          ))}
          <span className="page__pill">Entries: {entries.length}</span>
          <span className="page__pill">Favorites: {favoriteCount}</span>
        </div>
      </section>

      <LibraryCustomListsPanel
        customLists={customLists}
        selectedListId={selectedListId}
        draftName={listNameDraft}
        isCreating={isCreatingList}
        onDraftNameChange={setListNameDraft}
        onCreateList={handleCreateList}
        onSelectList={handleSelectList}
      />

      <section>

        {status === "loading" ? <p className="browse-message">Loading local library...</p> : null}
        {error ? <p className="browse-message browse-message--error">{error}</p> : null}

        {status === "ready" && entries.length === 0 ? (
          <p className="browse-message">
            No titles match the current library filters. Add titles from Browse or reset the controls above.
          </p>
        ) : null}

        <div className="floirs-grid">
          {entries.map((entry) => {
            const isPending = Boolean(pendingEntryIds[entry.libraryEntryId]);

            return (
              <article
                className="floirs-cover-card"
                key={entry.libraryEntryId}
                onClick={() =>
                  navigate(
                    `/browse?source=${encodeURIComponent(entry.sourceId)}&title=${encodeURIComponent(entry.sourceTitleId)}&page=1`,
                  )
                }
              >
                <div className="floirs-cover-card__media">
                  {entry.coverUrl ? (
                    <img
                      className="floirs-cover-card__image"
                      src={entry.coverUrl}
                      alt={entry.titleName}
                    />
                  ) : (
                    <div className="floirs-cover-card__fallback">
                      {initialsFromTitle(entry.titleName)}
                    </div>
                  )}
                  <button
                    type="button"
                    className={`floirs-cover-card__favorite${entry.isFavorite ? " floirs-cover-card__favorite--active" : ""}`}
                    onClick={() => handleFavoriteToggle(entry)}
                    disabled={isPending}
                    aria-label={entry.isFavorite ? "Remove favorite" : "Mark favorite"}
                  >
                    {entry.isFavorite ? "In favorites" : "Favorite"}
                  </button>
                  {entry.pendingUpdateCount > 0 ? (
                    <div className="library-update-badge">{entry.pendingUpdateCount}</div>
                  ) : null}
                </div>

                <div className="floirs-cover-card__overlay">
                  <div className="floirs-cover-card__badges">
                    <span className="browse-pill">
                      {sourceLabels.get(entry.sourceId) ?? entry.sourceId}
                    </span>
                    <span className={`library-reading-status library-reading-status--${entry.readingStatus}`}>
                      {readingStatusLabel(entry.readingStatus)}
                    </span>
                  </div>
                  <div className="floirs-cover-card__title" title={entry.titleName}>
                    {entry.titleName}
                  </div>
                </div>

                <div className="floirs-cover-card__meta-panel" onClick={(event) => event.stopPropagation()}>
                  <label className="library-field">
                    <span className="library-field__label">Status</span>
                    <select
                      className="browse-controls__select"
                      value={entry.readingStatus}
                      onChange={(event) =>
                        handleStatusChange(
                          entry.libraryEntryId,
                          event.target.value as ReadingStatus,
                        )
                      }
                      disabled={isPending}
                    >
                      {STATUS_OPTIONS.filter((option) => option.value !== "all").map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  {customLists.length > 0 ? (
                    <div className="library-memberships__grid">
                      {customLists.slice(0, 3).map((list) => (
                        <label className="library-membership-chip" key={list.listId}>
                          <input
                            type="checkbox"
                            checked={entry.listIds.includes(list.listId)}
                            disabled={isPending}
                            onChange={() => handleToggleListMembership(entry, list)}
                          />
                          <span>{list.name}</span>
                        </label>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
