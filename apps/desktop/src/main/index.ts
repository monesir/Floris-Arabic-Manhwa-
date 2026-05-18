import { app, BrowserWindow } from "electron";
import { join } from "node:path";
import { initializeDatabase } from "@db/database";
import { applyPhaseOneSchema } from "@db/schema";
import { registerAnalyticsIpc } from "@main/ipc/analytics";
import { registerDownloadsIpc } from "@main/ipc/downloads";
import { registerImportsIpc } from "@main/ipc/imports";
import { registerLibraryIpc } from "@main/ipc/library";
import { registerPluginIpc } from "@main/ipc/plugins";
import { registerReaderIpc } from "@main/ipc/reader";
import { registerSettingsIpc } from "@main/ipc/settings";
import { registerSourceIpc } from "@main/ipc/sources";
import { initializeDownloadService } from "@services/downloads/download-service";
import { initializeImportService } from "@services/imports/import-service";
import { bootstrapReaderAnalytics } from "@services/reader/reader-service";
import { bootstrapPluginRegistry } from "@services/plugins/plugin-registry";
import { bootstrapSettingsState } from "@services/settings/settings-service";

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 760,
    backgroundColor: "#0f1117",
    title: "FloirsMNH",
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    void mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

function scheduleSmokeExit() {
  const timeout = Number(process.env.FLOIRSMNH_SMOKE_EXIT_MS);

  if (!Number.isFinite(timeout) || timeout <= 0) {
    return;
  }

  setTimeout(() => {
    app.quit();
  }, timeout);
}

app.whenReady().then(() => {
  const userDataPath = app.getPath("userData");
  const database = initializeDatabase(join(userDataPath, "floirsmnh.db"));

  if (process.env.FLOIRSMNH_SMOKE_LOG_PATHS === "1") {
    console.log(`FLOIRSMNH_USER_DATA=${userDataPath}`);
  }

  applyPhaseOneSchema(database);
  bootstrapSettingsState();
  bootstrapReaderAnalytics();
  bootstrapPluginRegistry(userDataPath);
  initializeDownloadService(userDataPath);
  initializeImportService(userDataPath);
  registerAnalyticsIpc();
  registerDownloadsIpc();
  registerImportsIpc();
  registerLibraryIpc();
  registerReaderIpc();
  registerSettingsIpc();
  registerPluginIpc(userDataPath);
  registerSourceIpc();
  createMainWindow();
  scheduleSmokeExit();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
