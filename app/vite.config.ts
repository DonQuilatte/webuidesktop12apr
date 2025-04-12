import { defineConfig, AliasOptions } from 'vite' // Import AliasOptions
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(() => {
  const isTest = process.env.VITEST || process.env.NODE_ENV === 'test';

  // Define alias with explicit type
  const alias: AliasOptions = isTest
    ? {
        '@tauri-apps/api/tauri': path.resolve(__dirname, 'src/__mocks__/tauri-mock.ts'),
      }
    : {}; // Keep the empty object for the non-test case

  return {
    plugins: [react()],
    resolve: {
      alias: alias, // Use the typed variable
    },
    test: {
      environment: "jsdom",
      setupFiles: "src/__tests__/setup.ts"
    }
  };
});
