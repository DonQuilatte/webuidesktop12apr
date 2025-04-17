import "@testing-library/jest-dom";
import { vi } from "vitest";

// Create a spy for the invoke function so tests can override behavior
const mockInvoke = vi.fn((cmd: string, args?: any) => { // Accept args
  console.log(`Mock invoke called: ${cmd}`, args); // Add logging
  switch (cmd) {
    case "get_os_info":
      return Promise.resolve("TestOS x86_64");
    case "get_disk_space":
      // [free, total] in bytes
      return Promise.resolve([200 * 1024 * 1024 * 1024, 500 * 1024 * 1024 * 1024]);
    case "get_memory_info":
      // [free, total] in bytes
      return Promise.resolve([8 * 1024 * 1024 * 1024, 16 * 1024 * 1024 * 1024]);
    case "check_network_status":
      return Promise.resolve(true);
    case "get_preferences": // Added case
      return Promise.resolve({ 
        preferences: { telemetry: false, theme: 'light' } 
      });
    case "save_preferences":
      return Promise.resolve({ success: true });
    case "save_onboarding_data":
      return Promise.resolve({ success: true });
    case "store_telemetry_event": // Renamed from submit_telemetry
      return Promise.resolve({ success: true }); 
    case "start_backend_download":
      return Promise.resolve(true);
    case "check_backend_download_progress":
      return Promise.resolve(50); // 50% progress
    case "complete_backend_download":
      return Promise.resolve(true);
    default:
      console.warn(`Unhandled mock invoke command: ${cmd}`); // Warn for unhandled
      return Promise.reject(new Error(`Unhandled mock command: ${cmd}`)); // Reject unhandled by default
  }
});

// Mock the Tauri API module
vi.mock('@tauri-apps/api/core', () => {
  return {
    invoke: mockInvoke // Use the spy
  };
});

// Export the mock for tests to use
export { mockInvoke };

// Mock fetch globally (keep existing)
global.fetch = vi.fn(() =>
  Promise.resolve(new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  }))
);
