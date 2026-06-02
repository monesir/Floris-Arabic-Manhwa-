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
    <section style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
      <div>
        <span className="library-field__label" style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc', fontSize: '0.9rem' }}>Categories</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={() => onSelectList("all")}
            style={{
              padding: '0.25rem 0.6rem',
              borderRadius: '4px',
              border: 'none',
              fontSize: '0.8rem',
              cursor: 'pointer',
              background: selectedListId === "all" ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
              color: selectedListId === "all" ? '#fff' : '#aaa',
              transition: 'background 0.2s'
            }}
          >
            All
          </button>
          {customLists.map((list) => (
            <button
              type="button"
              key={list.listId}
              onClick={() => onSelectList(list.listId)}
              style={{
                padding: '0.25rem 0.6rem',
                borderRadius: '4px',
                border: 'none',
                fontSize: '0.8rem',
                cursor: 'pointer',
                background: selectedListId === list.listId ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                color: selectedListId === list.listId ? '#fff' : '#aaa',
                transition: 'background 0.2s'
              }}
            >
              {list.name}
            </button>
          ))}
        </div>
      </div>

      <form style={{ display: 'flex', gap: '0.5rem' }} onSubmit={onCreateList}>
        <input
          type="text"
          placeholder="New category..."
          value={draftName}
          onChange={(event) => onDraftNameChange(event.target.value)}
          style={{
            flex: 1,
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '4px',
            padding: '0.4rem 0.6rem',
            color: '#fff',
            fontSize: '0.85rem'
          }}
        />
        <button 
          type="submit" 
          disabled={isCreating}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '4px',
            padding: '0.4rem 0.8rem',
            color: '#fff',
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          {isCreating ? "..." : "+ Add"}
        </button>
      </form>
    </section>
  );
}
