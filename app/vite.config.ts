import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isTest = process.env.VITEST || process.env.NODE_ENV === 'test';
  return {
    plugins: [react()],
    resolve: {
      alias: isTest
        ? {
            '@tauri-apps/api/tauri': path.resolve(__dirname, 'src/__mocks__/tauri-mock.ts'),
          }
        : {},
    },
    test: {
      environment: "jsdom",
      setupFiles: "src/__tests__/setup.ts"
    }
  };
});
