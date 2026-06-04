import { useState, useEffect } from "react";
import { getPluginRegistryState } from "@renderer/shared/plugin-registry";
import type { SourceRegistryRecord } from "@contracts/plugin";
import type { TachiyomiBackupManga, TachiyomiBackupCategory } from "@contracts/backup";

export function BackupSettingsCard() {
  const [sources, setSources] = useState<SourceRegistryRecord[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [parsedManga, setParsedManga] = useState<TachiyomiBackupManga[]>([]);
  const [parsedCategories, setParsedCategories] = useState<TachiyomiBackupCategory[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    getPluginRegistryState().then((state) => {
      const allSources: SourceRegistryRecord[] = [];
      state.plugins.forEach((p) => {
        if (p.sources) {
          p.sources.forEach(s => allSources.push(s));
        }
      });
      setSources(allSources);
      if (allSources.length > 0) {
        setSelectedSourceId(allSources[0].sourceId);
      }
    });
  }, []);

  async function handleSelectFile() {
    // @ts-ignore
    const result = await window.backupStore.openTachiyomi();
    if (result && result.manga && result.manga.length > 0) {
      setParsedManga(result.manga);
      setParsedCategories(result.categories || []);
    }
  }

  async function handleImport() {
    if (!selectedSourceId || parsedManga.length === 0) return;
    setIsImporting(true);
    setProgress(0);

    let successCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;
    let chaptersMarked = 0;
    let listsCreated = 0;

    // Step 1: Create lists from Tachiyomi categories
    // Map: tachiyomi category order -> local listId
    const categoryToListId: Record<number, string> = {};

    if (parsedCategories.length > 0) {
      // @ts-ignore
      const existingLists = await window.libraryLists.list();
      const existingListNames = new Set(existingLists.map((l: any) => l.name.toLowerCase()));

      for (const cat of parsedCategories) {
        if (!cat.name) continue;

        // Check if a list with this name already exists
        const existingMatch = existingLists.find(
          (l: any) => l.name.toLowerCase() === cat.name.toLowerCase()
        );

        if (existingMatch) {
          categoryToListId[cat.order] = existingMatch.listId;
        } else {
          try {
            // @ts-ignore
            const newList = await window.libraryLists.create({ name: cat.name });
            categoryToListId[cat.order] = newList.listId;
            listsCreated++;
          } catch (err) {
            console.error("Failed to create list:", cat.name, err);
          }
        }
      }
    }

    // Step 2: Import manga and assign to lists
    for (let i = 0; i < parsedManga.length; i++) {
      const manga = parsedManga[i];
      try {
        // Search in plugin for the manga title
        // @ts-ignore
        const searchResults = await window.sourceRegistry.search(selectedSourceId, manga.title);
        if (searchResults && searchResults.items && searchResults.items.length > 0) {
          // Add the first result to library
          const match = searchResults.items[0];
          // @ts-ignore
          const addedEntry = await window.libraryStore.add({
            sourceId: selectedSourceId,
            sourceTitleId: match.titleId,
            titleName: match.name,
            sourceTitleSlug: match.slug || null,
            coverUrl: match.coverUrl || null,
          });

          // Assign to lists based on Tachiyomi categories
          if (addedEntry && manga.categoryIds && manga.categoryIds.length > 0) {
            for (const catId of manga.categoryIds) {
              const listId = categoryToListId[catId];
              if (listId) {
                try {
                  // @ts-ignore
                  await window.libraryLists.addEntry(addedEntry.libraryEntryId, listId);
                } catch (listErr) {
                  console.error("Failed to add to list:", listErr);
                }
              }
            }
          }

          // Mark read chapters as completed
          if (manga.readChapterNumbers && manga.readChapterNumbers.length > 0 && addedEntry) {
            try {
              // Fetch chapters from the source
              // @ts-ignore
              const titleData = await window.sourceRegistry.getTitle(selectedSourceId, match.titleId);
              if (titleData && titleData.chapters && titleData.chapters.length > 0) {
                const readSet = new Set(manga.readChapterNumbers.map((n: number) => Math.round(n)));
                const now = new Date().toISOString();
                for (const chapter of titleData.chapters) {
                  if (chapter.chapterNumber !== null && readSet.has(Math.round(chapter.chapterNumber))) {
                    await window.analyticsStore.markChapterCompleted({
                      sourceId: selectedSourceId,
                      sourceTitleId: match.titleId,
                      chapterId: chapter.chapterId,
                      libraryEntryId: addedEntry.libraryEntryId,
                      completedAt: now,
                    });
                    chaptersMarked++;
                  }
                }
              }
            } catch (chapterErr) {
              console.error("Failed to mark chapters for", manga.title, chapterErr);
            }
          }

          successCount++;
        } else {
          notFoundCount++;
        }
      } catch (err) {
        console.error("Failed to migrate", manga.title, err);
        errorCount++;
      }
      setProgress(i + 1);
    }

    setIsImporting(false);
    const parts = [
      `Migration complete!`,
      `Imported: ${successCount}`,
      `Chapters marked as read: ${chaptersMarked}`,
    ];
    if (listsCreated > 0) {
      parts.push(`Lists created: ${listsCreated}`);
    }
    if (Object.keys(categoryToListId).length > 0) {
      parts.push(`Lists mapped: ${Object.keys(categoryToListId).length}`);
    }
    parts.push(`Not found: ${notFoundCount}`);
    if (errorCount > 0) {
      parts.push(`Errors: ${errorCount}`);
    }
    alert(parts.join("\n"));
    setParsedManga([]);
    setParsedCategories([]);
  }

  const mangaWithCategories = parsedManga.filter(m => m.categoryIds.length > 0).length;

  return (
    <div className="page__card">
      <div className="page__card-label">Tachiyomi / Tachimanga Backup</div>
      <div className="page__card-value">
        <p style={{ marginBottom: 12 }}>
          Import your library from a .tachibk file. The app will search for each manga in the selected source.
        </p>
        
        {parsedManga.length === 0 ? (
          <button 
            className="button button--primary" 
            onClick={handleSelectFile}
          >
            Select .tachibk File
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <strong>{parsedManga.length} manga found in backup.</strong>
              {parsedCategories.length > 0 && (
                <p style={{ marginTop: '0.5rem', color: '#aaa', fontSize: '0.9rem' }}>
                  {parsedCategories.length} categories found: {parsedCategories.map(c => c.name).join(", ")}
                  <br />
                  {mangaWithCategories} manga assigned to categories.
                </p>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>Select Target Source:</label>
              <select 
                value={selectedSourceId} 
                onChange={(e) => setSelectedSourceId(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#2a2a2a', color: '#fff' }}
              >
                {sources.map((s) => (
                  <option key={s.sourceId} value={s.sourceId}>{s.displayName}</option>
                ))}
              </select>
            </div>

            {isImporting ? (
              <div>
                <p>Importing... {progress} / {parsedManga.length}</p>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#333', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(progress / parsedManga.length) * 100}%`, height: '100%', backgroundColor: '#ff6740', transition: 'width 0.2s' }} />
                </div>
              </div>
            ) : (
              <button 
                className="button button--primary" 
                onClick={handleImport}
                disabled={isImporting}
              >
                Start Migration
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
