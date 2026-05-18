import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { execFileSync } from "node:child_process";
import { getDatabase } from "@db/database";
import { ImportedContentRepository } from "@db/repositories/imported-content-repository";
import { LibraryRepository } from "@db/repositories/library-repository";
import { LOCAL_IMPORTS_SOURCE_ID } from "@contracts/plugin";
import type { ImportResult } from "@contracts/imports";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".avif"]);

let importsRoot = "";

function ensureInitialized() {
  if (!importsRoot) {
    throw new Error("Import service accessed before initialization.");
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "imported-title";
}

function listImageFiles(directoryPath: string) {
  if (!existsSync(directoryPath)) {
    return [];
  }

  return readdirSync(directoryPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(extname(entry.name).toLowerCase()))
    .map((entry) => join(directoryPath, entry.name))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
}

function listChapterDirectories(directoryPath: string) {
  if (!existsSync(directoryPath)) {
    return [];
  }

  return readdirSync(directoryPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(directoryPath, entry.name))
    .filter((childPath) => listImageFiles(childPath).length > 0)
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
}

function parseChapterNumberFromName(value: string) {
  const match = basename(value).match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function getRepositories() {
  const database = getDatabase();

  return {
    importedRepository: new ImportedContentRepository(database),
    libraryRepository: new LibraryRepository(database),
  };
}

function persistImportedDirectory(
  directoryPath: string,
  importType: "folder" | "cbz",
  explicitTitleName?: string,
  sourcePathOverride?: string,
): ImportResult {
  const { importedRepository, libraryRepository } = getRepositories();
  const chapterDirectories = listChapterDirectories(directoryPath);
  const rootImages = listImageFiles(directoryPath);
  const titleName = explicitTitleName ?? basename(directoryPath);
  const titleSlug = slugify(titleName);
  const coverPath =
    chapterDirectories.length > 0
      ? listImageFiles(chapterDirectories.at(-1) ?? "")[0] ?? null
      : rootImages[0] ?? null;
  const importedTitleId = importedRepository.createTitle({
    titleName,
    titleSlug,
    description: `Imported from local ${importType.toUpperCase()} content.`,
    coverPath,
    sourcePath: sourcePathOverride ?? directoryPath,
    importType,
  });

  const chapters =
    chapterDirectories.length > 0
      ? chapterDirectories.map((chapterDirectory) => ({
          chapterTitle: basename(chapterDirectory),
          chapterNumber: parseChapterNumberFromName(chapterDirectory),
          sourcePath: chapterDirectory,
          images: listImageFiles(chapterDirectory),
        }))
      : [
          {
            chapterTitle: "Chapter 1",
            chapterNumber: 1,
            sourcePath: directoryPath,
            images: rootImages,
          },
        ];

  for (const chapter of chapters) {
    const importedChapterId = importedRepository.createChapter({
      importedTitleId,
      chapterTitle: chapter.chapterTitle,
      chapterNumber: chapter.chapterNumber,
      sourcePath: chapter.sourcePath,
      availability: chapter.images.length > 0 ? "readable" : "unavailable",
    });

    for (const [index, imagePath] of chapter.images.entries()) {
      importedRepository.createPage({
        importedChapterId,
        pageIndex: index,
        assetPath: imagePath,
      });
    }
  }

  const libraryEntry = libraryRepository.addOrUpdateEntry({
    sourceId: LOCAL_IMPORTS_SOURCE_ID,
    sourceTitleId: importedTitleId,
    titleName,
    sourceTitleSlug: titleSlug,
    coverUrl: coverPath,
  });

  if (!libraryEntry) {
    throw new Error("Failed to create library entry for imported title.");
  }

  return {
    libraryEntry,
    importedTitleId,
    importKind: importType,
  };
}

function expandCbzToDirectory(filePath: string) {
  ensureInitialized();
  const archiveName = slugify(basename(filePath, extname(filePath)));
  const extractionRoot = join(importsRoot, "_extracted", `${archiveName}-${Date.now()}`);
  const tempZipPath = `${extractionRoot}.zip`;

  mkdirSync(join(importsRoot, "_extracted"), { recursive: true });
  mkdirSync(extractionRoot, { recursive: true });
  copyFileSync(filePath, tempZipPath);

  execFileSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-Command",
      `Expand-Archive -LiteralPath '${tempZipPath.replace(/'/g, "''")}' -DestinationPath '${extractionRoot.replace(/'/g, "''")}' -Force`,
    ],
    { stdio: "ignore" },
  );

  return extractionRoot;
}

export function initializeImportService(userDataPath: string) {
  importsRoot = join(userDataPath, "imports");
  mkdirSync(importsRoot, { recursive: true });
}

export function importFolderFromPath(directoryPath: string) {
  ensureInitialized();
  const stats = statSync(directoryPath);

  if (!stats.isDirectory()) {
    throw new Error("Selected path is not a directory.");
  }

  return persistImportedDirectory(directoryPath, "folder");
}

export function importCbzFromPath(filePath: string) {
  ensureInitialized();
  const extractedDirectory = expandCbzToDirectory(filePath);
  const titleName = basename(filePath, extname(filePath));
  return persistImportedDirectory(extractedDirectory, "cbz", titleName, filePath);
}

export function importPdfFromPath(filePath: string) {
  ensureInitialized();
  const { importedRepository, libraryRepository } = getRepositories();
  const titleName = basename(filePath, extname(filePath));
  const titleSlug = slugify(titleName);
  const importedTitleId = importedRepository.createTitle({
    titleName,
    titleSlug,
    description: "Imported from a local PDF document. Rendering pages is not available in the current runtime bundle.",
    coverPath: null,
    sourcePath: filePath,
    importType: "pdf",
  });

  importedRepository.createChapter({
    importedTitleId,
    chapterTitle: "Document",
    chapterNumber: 1,
    sourcePath: filePath,
    availability: "unavailable",
  });

  const libraryEntry = libraryRepository.addOrUpdateEntry({
    sourceId: LOCAL_IMPORTS_SOURCE_ID,
    sourceTitleId: importedTitleId,
    titleName,
    sourceTitleSlug: titleSlug,
    coverUrl: null,
  });

  if (!libraryEntry) {
    throw new Error("Failed to create library entry for imported PDF.");
  }

  return {
    libraryEntry,
    importedTitleId,
    importKind: "pdf" as const,
  };
}
