import { ipcMain } from "electron";
import type { AddLibraryEntryInput } from "@contracts/library";
import { addToLibrary, listLibraryEntries } from "@library/library-service";

const ADD_TO_LIBRARY_CHANNEL = "library:add";
const LIST_LIBRARY_CHANNEL = "library:list";

export function registerLibraryIpc() {
  ipcMain.handle(ADD_TO_LIBRARY_CHANNEL, (_, input: AddLibraryEntryInput) => addToLibrary(input));
  ipcMain.handle(LIST_LIBRARY_CHANNEL, () => listLibraryEntries());
}
