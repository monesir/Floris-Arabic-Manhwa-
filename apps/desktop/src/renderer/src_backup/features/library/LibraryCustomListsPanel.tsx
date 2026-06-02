import type { FormEvent } from "react";
import type { LibraryCustomList } from "@contracts/library";

type LibraryCustomListsPanelProps = {
  customLists: LibraryCustomList[];
  selectedListId: string | "all";
  draftName: string;
  isCreating: boolean;
  onDraftNameChange: (value: string) => void;
  onCreateList: (event: FormEvent<HTMLFormElement>) => void;
  onSelectList: (listId: string | "all") => void;
};

export function LibraryCustomListsPanel({
  customLists,
  selectedListId,
  draftName,
  isCreating,
  onDraftNameChange,
  onCreateList,
  onSelectList,
}: LibraryCustomListsPanelProps) {
  return (
    <section className="library-categories-bar">
      <div className="library-categories-bar__row">
        <span className="library-categories-bar__label">Categories</span>
        <div className="library-list-filter-row">
          <button
            type="button"
            className={`library-list-chip${selectedListId === "all" ? " library-list-chip--active" : ""}`}
            onClick={() => onSelectList("all")}
          >
            All Series
          </button>
          {customLists.map((list) => (
            <button
              type="button"
              className={`library-list-chip${selectedListId === list.listId ? " library-list-chip--active" : ""}`}
              key={list.listId}
              onClick={() => onSelectList(list.listId)}
            >
              {list.name}
            </button>
          ))}
        </div>
      </div>

      <form className="library-list-create library-list-create--inline" onSubmit={onCreateList}>
        <input
          className="browse-search__input"
          type="text"
          placeholder="New category..."
          value={draftName}
          onChange={(event) => onDraftNameChange(event.target.value)}
        />
        <button className="floirs-button floirs-button--ghost" type="submit" disabled={isCreating}>
          {isCreating ? "Creating..." : "Create"}
        </button>
      </form>
    </section>
  );
}
