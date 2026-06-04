import fs from "node:fs";
import zlib from "node:zlib";
import * as protobuf from "protobufjs";
import type { TachiyomiBackupManga, TachiyomiBackupCategory, TachiyomiBackupResult } from "@contracts/backup";

export function parseTachiyomiBackup(filePath: string): TachiyomiBackupResult {
  const buffer = fs.readFileSync(filePath);
  const unzipped = zlib.gunzipSync(buffer);
  const reader = protobuf.Reader.create(unzipped);

  return decodeRaw(reader);
}

function decodeRaw(reader: protobuf.Reader): TachiyomiBackupResult {
  const mangas: TachiyomiBackupManga[] = [];
  const categories: TachiyomiBackupCategory[] = [];
  const end = reader.len;

  while (reader.pos < end) {
    const tag = reader.uint32();
    const wireType = tag & 7;
    const id = tag >>> 3;

    if (id === 1 && wireType === 2) { // BackupManga list
      const len = reader.uint32();
      const nextPos = reader.pos + len;
      try {
        const manga = decodeBackupManga(reader, len);
        if (manga.title) {
          mangas.push(manga);
        }
      } catch (error) {
        console.error("Failed to parse a BackupManga object:", error);
      }
      reader.pos = nextPos;
    } else if (id === 2 && wireType === 2) { // BackupCategory list
      const len = reader.uint32();
      const nextPos = reader.pos + len;
      try {
        const category = decodeBackupCategory(reader, len);
        if (category.name) {
          categories.push(category);
        }
      } catch (error) {
        console.error("Failed to parse a BackupCategory object:", error);
      }
      reader.pos = nextPos;
    } else {
      reader.skipType(wireType);
    }
  }

  return { manga: mangas, categories };
}

function decodeBackupCategory(reader: protobuf.Reader, length: number): TachiyomiBackupCategory {
  const end = reader.pos + length;
  let name = "";
  let order = 0;

  while (reader.pos < end) {
    const tag = reader.uint32();
    const wireType = tag & 7;
    const id = tag >>> 3;

    if (id === 1 && wireType === 2) { // name (string)
      name = reader.string();
    } else if (id === 2 && wireType === 0) { // order (int)
      order = reader.int32();
    } else {
      reader.skipType(wireType);
    }
  }

  return { name, order };
}

function decodeBackupManga(reader: protobuf.Reader, length: number): TachiyomiBackupManga {
  const end = reader.pos + length;
  const manga: TachiyomiBackupManga = {
    title: "",
    url: "",
    sourceId: "",
    readChapterCount: 0,
    readChapterNumbers: [],
    categoryIds: [],
  };

  while (reader.pos < end) {
    const tag = reader.uint32();
    const wireType = tag & 7;
    const id = tag >>> 3;

    if (id === 1 && wireType === 2) { // Nested manga object (Official Tachiyomi)
      const len = reader.uint32();
      const nextPos = reader.pos + len;
      decodeMangaObject(reader, len, manga);
      reader.pos = nextPos;
    } else if (id === 1 && wireType === 0) { // Flat manga object (Tachimanga)
      manga.sourceId = reader.int64().toString();
    } else if (id === 2 && wireType === 2) { // Flat url
      manga.url = reader.string();
    } else if (id === 3 && wireType === 2) { // Flat title
      manga.title = reader.string();
    } else if (id === 6 && wireType === 2) { // flat cover
      reader.string();
    } else if (id === 16 && wireType === 2) { // chapters array
      const len = reader.uint32();
      const nextPos = reader.pos + len;
      decodeChapterObject(reader, len, manga);
      reader.pos = nextPos;
    } else if (id === 17 && wireType === 0) { // categoryId (single varint)
      manga.categoryIds.push(reader.int32());
    } else if (id === 17 && wireType === 2) { // categoryIds (packed repeated)
      const pLen = reader.uint32();
      const pEnd = reader.pos + pLen;
      while (reader.pos < pEnd) {
        manga.categoryIds.push(reader.int32());
      }
    } else {
      reader.skipType(wireType);
    }
  }

  return manga;
}

function decodeMangaObject(reader: protobuf.Reader, length: number, manga: TachiyomiBackupManga) {
  const end = reader.pos + length;

  while (reader.pos < end) {
    const tag = reader.uint32();
    const wireType = tag & 7;
    const id = tag >>> 3;

    if (id === 1) { // source (int64)
      manga.sourceId = reader.int64().toString();
    } else if (id === 2 && wireType === 2) { // url
      manga.url = reader.string();
    } else if (id === 3 && wireType === 2) { // title
      manga.title = reader.string();
    } else {
      reader.skipType(wireType);
    }
  }
}

function decodeChapterObject(reader: protobuf.Reader, length: number, manga: TachiyomiBackupManga) {
  const end = reader.pos + length;
  let isRead = false;
  let chapterNumber: number | null = null;

  while (reader.pos < end) {
    const tag = reader.uint32();
    const wireType = tag & 7;
    const id = tag >>> 3;

    if (id === 4 && wireType === 0) { // read boolean
      isRead = reader.bool();
    } else if (id === 9 && wireType === 5) { // chapter number (float)
      chapterNumber = reader.float();
    } else {
      reader.skipType(wireType);
    }
  }

  if (isRead) {
    manga.readChapterCount++;
    if (chapterNumber !== null) {
      manga.readChapterNumbers.push(chapterNumber);
    }
  }
}
