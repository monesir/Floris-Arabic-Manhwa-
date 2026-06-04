import type {
  AddLibraryEntryInput,
  CreateLibraryCustomListInput,
  LibraryRefreshSummary,
  LibraryListQuery,
  ReadingStatus,
} from "@contracts/library";
import { getDatabase } from "@db/database";
import { LibraryCustomListRepository } from "@db/repositories/library-custom-list-repository";
import { LibraryRepository } from "@db/repositories/library-repository";
import { LibraryUpdateRepository } from "@db/repositories/library-update-repository";
import { getSourceTitleDetails } from "@services/sources/source-registry";
import { resolveCoverUrl } from "@services/covers/cover-cache";

export async function addToLibrary(input: AddLibraryEntryInput) {
  const repository = new LibraryRepository(getDatabase());

  if (input.coverUrl) {
    const localCoverUrl = await resolveCoverUrl(input.coverUrl);
    return repository.addOrUpdateEntry({ ...input, coverUrl: localCoverUrl });
  }

  return repository.addOrUpdateEntry(input);
}

export function removeFromLibrary(libraryEntryId: string) {
  const repository = new LibraryRepository(getDatabase());
  repository.removeEntry(libraryEntryId);
}

export function listLibraryEntries(query?: LibraryListQuery) {
  const repository = new LibraryRepository(getDatabase());
  return repository.listAll(query);
}

export function setLibraryReadingStatus(libraryEntryId: string, readingStatus: ReadingStatus) {
  const repository = new LibraryRepository(getDatabase());
  return repository.updateReadingStatus(libraryEntryId, readingStatus);
}

export function setLibraryFavorite(libraryEntryId: string, isFavorite: boolean) {
  const repository = new LibraryRepository(getDatabase());
  return repository.updateFavorite(libraryEntryId, isFavorite);
}

export function createLibraryCustomList(input: CreateLibraryCustomListInput) {
  const repository = new LibraryCustomListRepository(getDatabase());
  return repository.create(input);
}

export function deleteLibraryCustomList(listId: string) {
  const repository = new LibraryCustomListRepository(getDatabase());
  repository.delete(listId);
}

export function listLibraryCustomLists() {
  const repository = new LibraryCustomListRepository(getDatabase());
  return repository.listAll();
}

export function addLibraryEntryToCustomList(libraryEntryId: string, listId: string) {
  const repository = new LibraryCustomListRepository(getDatabase());
  repository.addEntryMembership(listId, libraryEntryId);

  const libraryRepository = new LibraryRepository(getDatabase());
  return libraryRepository.getById(libraryEntryId);
}

export function removeLibraryEntryFromCustomList(libraryEntryId: string, listId: string) {
  const repository = new LibraryCustomListRepository(getDatabase());
  repository.removeEntryMembership(listId, libraryEntryId);

  const libraryRepository = new LibraryRepository(getDatabase());
  return libraryRepository.getById(libraryEntryId);
}

export function updateLibraryTotalChapterCount(libraryEntryId: string, totalChapterCount: number) {
  const repository = new LibraryRepository(getDatabase());
  repository.updateTotalChapterCount(libraryEntryId, totalChapterCount);
}

export function updateLibraryCover(sourceId: string, sourceTitleId: string, coverUrl: string) {
  const repository = new LibraryRepository(getDatabase());
  return repository.updateCoverUrlPreservingUpdatedAt(sourceId, sourceTitleId, coverUrl);
}

export async function refreshLibraryUpdates(): Promise<LibraryRefreshSummary> {
  const database = getDatabase();
  const libraryRepository = new LibraryRepository(database);
  const updateRepository = new LibraryUpdateRepository(database);
  const entries = libraryRepository.listForRefresh();

  let updatedCount = 0;

  for (const entry of entries) {
    try {
      const payload = await getSourceTitleDetails(entry.sourceId, entry.sourceTitleId);
      const readableChapters = payload.chapters.filter((chapter) => chapter.availability === "readable");
      const chapterPool = readableChapters.length ? readableChapters : payload.chapters;
      const latestChapter = chapterPool[0] ?? null;
      const currentState = updateRepository.getByLibraryEntryId(entry.libraryEntryId);
      const checkedAt = new Date().toISOString();

      libraryRepository.updateTotalChapterCount(entry.libraryEntryId, chapterPool.length);

      if (!latestChapter) {
        updateRepository.upsert({
          libraryEntryId: entry.libraryEntryId,
          knownLatestChapterId: currentState?.knownLatestChapterId ?? null,
          knownLatestChapterNumber: currentState?.knownLatestChapterNumber ?? null,
          knownLatestChapterTitle: currentState?.knownLatestChapterTitle ?? null,
          detectedLatestChapterId: null,
          detectedLatestChapterTitle: null,
          detectedLatestChapterReleaseDate: null,
          pendingUpdateCount: 0,
          lastCheckedAt: checkedAt,
          lastDetectedAt: currentState?.lastDetectedAt ?? null,
        });
        continue;
      }

      if (!currentState?.knownLatestChapterId) {
        updateRepository.upsert({
          libraryEntryId: entry.libraryEntryId,
          knownLatestChapterId: latestChapter.chapterId,
          knownLatestChapterNumber: latestChapter.chapterNumber ?? null,
          knownLatestChapterTitle: latestChapter.title,
          detectedLatestChapterId: null,
          detectedLatestChapterTitle: null,
          detectedLatestChapterReleaseDate: null,
          pendingUpdateCount: 0,
          lastCheckedAt: checkedAt,
          lastDetectedAt: null,
        });
        continue;
      }

      let pendingUpdateCount = 0;
      const knownIndex = chapterPool.findIndex(
        (chapter) => chapter.chapterId === currentState.knownLatestChapterId,
      );

      if (knownIndex > 0) {
        pendingUpdateCount = knownIndex;
      } else if (knownIndex === -1 && currentState.knownLatestChapterNumber !== null) {
        const previousKnownChapterNumber = currentState.knownLatestChapterNumber;
        pendingUpdateCount = chapterPool.filter((chapter) => {
          if (chapter.chapterNumber === null) {
            return false;
          }

          return chapter.chapterNumber > previousKnownChapterNumber;
        }).length;
      } else if (knownIndex === -1 && latestChapter.chapterId !== currentState.knownLatestChapterId) {
        pendingUpdateCount = 1;
      }

      if (pendingUpdateCount > 0) {
        updatedCount += 1;
      }

      updateRepository.upsert({
        libraryEntryId: entry.libraryEntryId,
        knownLatestChapterId: currentState.knownLatestChapterId,
        knownLatestChapterNumber: currentState.knownLatestChapterNumber,
        knownLatestChapterTitle: currentState.knownLatestChapterTitle,
        detectedLatestChapterId: pendingUpdateCount > 0 ? latestChapter.chapterId : null,
        detectedLatestChapterTitle: pendingUpdateCount > 0 ? latestChapter.title : null,
        detectedLatestChapterReleaseDate:
          pendingUpdateCount > 0 ? latestChapter.releaseDate ?? null : null,
        pendingUpdateCount,
        lastCheckedAt: checkedAt,
        lastDetectedAt: pendingUpdateCount > 0 ? checkedAt : currentState.lastDetectedAt ?? null,
      });
    } catch {
      continue;
    }
  }

  return {
    checkedCount: entries.length,
    updatedCount,
    updates: updateRepository.listPendingUpdates(),
  };
}

export function listLibraryUpdates() {
  const repository = new LibraryUpdateRepository(getDatabase());
  return repository.listPendingUpdates();
}
