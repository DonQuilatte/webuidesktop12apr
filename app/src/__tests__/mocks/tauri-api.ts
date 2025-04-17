// Mock for Tauri API
import { vi } from 'vitest';

// Default mock responses
const defaultResponses = {
  get_os_info: "TestOS x86_64",
  get_disk_space: [200 * 1024 * 1024 * 1024, 500 * 1024 * 1024 * 1024], // [free, total] in bytes
  get_memory_info: [8 * 1024 * 1024 * 1024, 16 * 1024 * 1024 * 1024], // [free, total] in bytes
  check_network_status: true,
  save_preferences: { success: true },
  save_onboarding_data: { success: true },
  submit_telemetry: { success: true },
  start_backend_download: true,
  check_backend_download_progress: 50, // 50% progress
  complete_backend_download: true
};

// Store custom responses for specific tests
let customResponses: Record<string, any> = {};

// Reset custom responses to defaults
export const resetMocks = () => {
  customResponses = {};
};

// Set a custom response for a specific command
export const mockResponse = (command: string, response: any) => {
  customResponses[command] = response;
};

// Mock implementation of invoke
export const mockInvoke = vi.fn((command: string, ...args: any[]) => {
  // Check if there's a custom response for this command
  if (command in customResponses) {
    const response = customResponses[command];
    
    // If the response is a function, call it with the arguments
    if (typeof response === 'function') {
      return Promise.resolve(response(...args));
    }
    
    // Otherwise, return the response
    return Promise.resolve(response);
  }
  
  // If there's no custom response, use the default
  if (command in defaultResponses) {
    return Promise.resolve(defaultResponses[command as keyof typeof defaultResponses]);
  }
  
  // If there's no default response, return a generic success response
  return Promise.resolve({ success: true });
});

// Setup the mock for @tauri-apps/api/core
export const setupTauriMock = () => {
  vi.mock('@tauri-apps/api/core', () => ({
    invoke: mockInvoke
  }));
};
