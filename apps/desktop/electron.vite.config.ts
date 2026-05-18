import { resolve } from "node:path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  main: {
    resolve: {
      alias: {
        "@contracts": resolve(__dirname, "src/shared/contracts"),
        "@db": resolve(__dirname, "src/db"),
        "@services": resolve(__dirname, "src/services"),
        "@main": resolve(__dirname, "src/main"),
        "@plugins": resolve(__dirname, "src/plugins"),
      },
    },
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    resolve: {
      alias: {
        "@contracts": resolve(__dirname, "src/shared/contracts"),
        "@plugins": resolve(__dirname, "src/plugins"),
      },
    },
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve(__dirname, "src/renderer/src"),
        "@contracts": resolve(__dirname, "src/shared/contracts"),
        "@services": resolve(__dirname, "src/services"),
        "@plugins": resolve(__dirname, "src/plugins"),
      },
    },
    plugins: [react()],
  },
});
