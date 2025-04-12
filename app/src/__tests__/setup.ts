// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { expect } from "vitest";
import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock @tauri-apps/api/tauri for all tests
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn((cmd: string) => {
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
      default:
        return Promise.resolve(null);
    }
  }),
}));
