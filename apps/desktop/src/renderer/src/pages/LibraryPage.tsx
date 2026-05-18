import { useEffect, useMemo, useState, type FormEvent } from "react";
import type {
  LibraryCustomList,
  LibraryEntry,
  ReadingStatus,
} from "@contracts/library";
import type { SourceCatalogItem } from "@contracts/source";
import { LibraryCustomListsPanel } from "@renderer/features/library/LibraryCustomListsPanel";
import {
  addLibraryEntryToList,
  createLibraryList,
  listLibraryEntries,
  listLibraryLists,
  removeLibraryEntryFromList,
  updateLibraryEntryFavorite,
  updateLibraryEntryStatus,
} from "@renderer/shared/library-store";
import { getSourceCatalog } from "@renderer/shared/source-registry";

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
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [customLists, setCustomLists] = useState<LibraryCustomList[]>([]);
  const [catalog, setCatalog] = useState<SourceCatalogItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [searchDraft, setSearchDraft] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReadingStatus | "all">("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | "all">("all");
  const [sortOrder, setSortOrder] = useState<(typeof SORT_OPTIONS)[number]["value"]>("updated_desc");
  const [listNameDraft, setListNameDraft] = useState("");
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [pendingEntryIds, setPendingEntryIds] = useState<Record<string, boolean>>({});

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
        return refreshLibraryState();
      })
      .catch((nextError: unknown) => {
        setError(nextError instanceof Error ? nextError.message : "Failed to create custom list.");
      })
      .finally(() => {
        setIsCreatingList(false);
      });
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
    <div className="page">
      <section className="page__hero">
        <span className="page__eyebrow">Collection workflow</span>
        <h1 className="page__title">Organize saved titles as a real local library</h1>
        <p className="page__copy">
          Phase 3 turns the library into a usable collection surface with persisted
          reading statuses, favorite marks, custom lists, and filterable cover cards
          built on the existing Phase 2 identity model.
        </p>
        <div className="page__grid">
          <div className="page__card">
            <div className="page__card-label">Visible entries</div>
            <div className="page__card-value">{entries.length}</div>
          </div>
          <div className="page__card">
            <div className="page__card-label">Favorites in view</div>
            <div className="page__card-value">{favoriteCount}</div>
          </div>
          <div className="page__card">
            <div className="page__card-label">Custom lists</div>
            <div className="page__card-value">{customLists.length}</div>
          </div>
        </div>
      </section>

      <section className="page__panel library-toolbar">
        <div className="library-toolbar__header">
          <div>
            <h2 className="page__panel-title">Library controls</h2>
            <p className="page__panel-copy">
              Search by title or slug, narrow by reading state, and manage favorites
              without leaving the library route.
            </p>
          </div>
          <button
            type="button"
            className="browse-search__button browse-search__button--ghost"
            onClick={handleResetFilters}
          >
            Reset filters
          </button>
        </div>

        <div className="library-toolbar__grid">
          <label className="library-field">
            <span className="library-field__label">Search</span>
            <div className="library-search">
              <input
                className="browse-search__input"
                type="search"
                placeholder="Search titles or slugs"
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleApplySearch();
                  }
                }}
              />
              <button
                type="button"
                className="browse-search__button"
                onClick={handleApplySearch}
              >
                Apply
              </button>
            </div>
          </label>

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

          <label className="library-favorite-filter">
            <input
              type="checkbox"
              checked={favoritesOnly}
              onChange={(event) => setFavoritesOnly(event.target.checked)}
            />
            <span>Favorites only</span>
          </label>
        </div>

        <div className="library-status-row">
          {STATUS_OPTIONS.filter((option) => option.value !== "all").map((option) => (
            <span className="page__pill" key={option.value}>
              {option.label}: {statusCounts[option.value as ReadingStatus]}
            </span>
          ))}
        </div>
      </section>

      <LibraryCustomListsPanel
        customLists={customLists}
        selectedListId={selectedListId}
        draftName={listNameDraft}
        isCreating={isCreatingList}
        onDraftNameChange={setListNameDraft}
        onCreateList={handleCreateList}
        onSelectList={setSelectedListId}
      />

      <section className="page__panel">
        <div className="library-toolbar__header">
          <div>
            <h2 className="page__panel-title">Saved library entries</h2>
            <p className="page__panel-copy">
              Each card is backed by SQLite and can be reclassified in place.
            </p>
          </div>
        </div>

        {status === "loading" ? <p className="browse-message">Loading local library...</p> : null}
        {error ? <p className="browse-message browse-message--error">{error}</p> : null}

        {status === "ready" && entries.length === 0 ? (
          <p className="browse-message">
            No titles match the current library filters. Add titles from Browse or reset the controls above.
          </p>
        ) : null}

        <div className="library-grid library-grid--rich">
          {entries.map((entry) => {
            const isPending = Boolean(pendingEntryIds[entry.libraryEntryId]);

            return (
              <article className="library-card library-card--rich" key={entry.libraryEntryId}>
                <div className="library-card__cover-shell">
                  {entry.coverUrl ? (
                    <img
                      className="library-card__cover"
                      src={entry.coverUrl}
                      alt={entry.titleName}
                    />
                  ) : (
                    <div className="library-card__accent library-card__accent--fallback">
                      {initialsFromTitle(entry.titleName)}
                    </div>
                  )}
                  <button
                    type="button"
                    className={`library-favorite-button${entry.isFavorite ? " library-favorite-button--active" : ""}`}
                    onClick={() => handleFavoriteToggle(entry)}
                    disabled={isPending}
                    aria-label={entry.isFavorite ? "Remove favorite" : "Mark favorite"}
                  >
                    {entry.isFavorite ? "Favorite" : "Mark favorite"}
                  </button>
                </div>

                <div className="library-card__body">
                  <div className="library-card__topline">
                    <span className="browse-pill">
                      {sourceLabels.get(entry.sourceId) ?? entry.sourceId}
                    </span>
                    <span className={`library-reading-status library-reading-status--${entry.readingStatus}`}>
                      {readingStatusLabel(entry.readingStatus)}
                    </span>
                  </div>

                  <h3 className="library-card__title">{entry.titleName}</h3>

                  <div className="library-card__meta-stack">
                    <p className="library-card__meta">
                      Added {new Date(entry.createdAt).toLocaleDateString()}
                    </p>
                    <p className="library-card__meta">
                      Updated {new Date(entry.updatedAt).toLocaleDateString()}
                    </p>
                    <p className="library-card__meta">
                      Slug: {entry.sourceTitleSlug ?? "No slug stored"}
                    </p>
                  </div>

                  <label className="library-field">
                    <span className="library-field__label">Reading status</span>
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

                  <div className="library-memberships">
                    <span className="library-field__label">Custom lists</span>
                    {customLists.length === 0 ? (
                      <p className="library-card__meta">
                        No lists created yet. Create one above to organize titles beyond status and favorites.
                      </p>
                    ) : (
                      <div className="library-memberships__grid">
                        {customLists.map((list) => (
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
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
