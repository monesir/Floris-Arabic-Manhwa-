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
    <section className="page__panel library-lists-panel">
      <div className="library-toolbar__header">
        <div>
          <h2 className="page__panel-title">Custom lists</h2>
          <p className="page__panel-copy">
            Use local lists for flexible organization that does not interfere with reading status.
          </p>
        </div>
      </div>

      <form className="library-list-create" onSubmit={onCreateList}>
        <input
          className="browse-search__input"
          type="text"
          placeholder="Create a list such as Weekend reads or Villainess"
          value={draftName}
          onChange={(event) => onDraftNameChange(event.target.value)}
        />
        <button className="browse-search__button" type="submit" disabled={isCreating}>
          {isCreating ? "Creating..." : "Create list"}
        </button>
      </form>

      <div className="library-list-filter-row">
        <button
          type="button"
          className={`library-list-chip${selectedListId === "all" ? " library-list-chip--active" : ""}`}
          onClick={() => onSelectList("all")}
        >
          All entries
        </button>
        {customLists.map((list) => (
          <button
            type="button"
            className={`library-list-chip${selectedListId === list.listId ? " library-list-chip--active" : ""}`}
            key={list.listId}
            onClick={() => onSelectList(list.listId)}
          >
            {list.name} ({list.entryCount})
          </button>
        ))}
      </div>
    </section>
  );
}
