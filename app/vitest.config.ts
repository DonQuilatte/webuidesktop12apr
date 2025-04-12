import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["src/__tests__/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@tauri-apps/api/tauri": path.resolve(__dirname, "src/__mocks__/tauri-mock.ts"),
    },
  },
});
