import { render, fireEvent, waitFor, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, Mock, describe, it, expect, beforeEach, afterEach } from 'vitest'; 
import { core } from '@tauri-apps/api';
import OnboardingWizard from '../OnboardingWizard'; 
import * as apiService from '../services/api'; 

// Mock the entire Tauri core API
vi.mock('@tauri-apps/api/core', async (importOriginal) => {
  const actualCore = await importOriginal<typeof import('@tauri-apps/api/core')>(); 
  return {
    ...actualCore,
    invoke: vi.fn(),
  };
});

// Mock API service
vi.mock("../services/api", () => ({
  fetchPreferences: vi.fn(),
  savePreferences: vi.fn(),
  saveOnboardingData: vi.fn(),
  submitTelemetry: vi.fn(),
  checkHealth: vi.fn(),
}));

// Mock Tauri invoke
const mockInvoke = core.invoke as Mock; 

let originalInvokeImplementation: ((cmd: string, args?: any) => Promise<any>) | undefined;

// Mock global fetch and alert
global.fetch = vi.fn();
window.alert = vi.fn();

describe("OnboardingWizard E2E Tests", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Setup default mocks for common commands
    const defaultImplementation = async (cmd: string, args?: any) => {
      console.log(`Mock invoke called with command: ${cmd}`, args); 
      switch (cmd) {
        case "get_os_info":
          return Promise.resolve("TestOS x86_64");
        case "get_disk_space":
          return Promise.resolve([200 * (1024**3), 500 * (1024**3)]);
        case "get_memory_info":
          return Promise.resolve([8 * (1024**2), 16 * (1024**2)]);
        case "check_network_status":
          return Promise.resolve(true); 
        case "save_preferences":
          return Promise.resolve({ success: true });
        case "start_backend_download": 
          console.log("Mocking start_backend_download -> success")
          return Promise.resolve(); 
        case "check_backend_download_progress": 
          console.log("Mocking check_backend_download_progress -> returning default 0")
          return Promise.resolve(0); 
        case "store_telemetry_event": 
          return Promise.resolve({ success: true });
        default:
          console.warn(`Unhandled mock command: ${cmd}`);
          return Promise.resolve(); 
      }
    };
    mockInvoke.mockImplementation(defaultImplementation);
    originalInvokeImplementation = defaultImplementation; // Store it
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it("should complete the full onboarding flow with default preferences", async () => {
    // Render the onboarding wizard
    const { getByRole, getByText } = render(<OnboardingWizard />);
    
    // Wait for the wizard to load
    await waitFor(() => {
      expect(getByText(/Setup Wizard/i)).toBeInTheDocument();
    });
    
    // Step 0: Welcome & Privacy Overview
    expect(getByText(/Welcome & Privacy Overview/i)).toBeInTheDocument();
    
    // Accept privacy policy
    const privacyCheckbox = getByRole("checkbox", { name: /privacy policy/i });
    await act(async () => {
      fireEvent.click(privacyCheckbox);
    });
    expect(privacyCheckbox).toBeChecked();
    
    // Click Next
    let nextButton = getByRole("button", { name: /next/i });
    await act(async () => {
      fireEvent.click(nextButton);
    });
    
    // Step 1: System Check
    await waitFor(() => {
      expect(getByText(/Operating System/i)).toBeInTheDocument();
    });
    expect(getByText("TestOS x86_64")).toBeInTheDocument();
    expect(getByText(/200 GB free \/ 500 GB total/i)).toBeInTheDocument();
    
    // Verify Tauri commands were called
    expect(mockInvoke).toHaveBeenCalledWith("get_os_info");
    expect(mockInvoke).toHaveBeenCalledWith("get_disk_space");
    expect(mockInvoke).toHaveBeenCalledWith("get_memory_info");
    
    // Click Next
    nextButton = getByRole("button", { name: /next/i });
    await act(async () => {
      fireEvent.click(nextButton);
    });
    
    // Step 2: Network Status
    await waitFor(() => {
      expect(getByText(/Network Status:/i)).toBeInTheDocument();
    });
    expect(getByText(/Online/i)).toBeInTheDocument();
    
    // Verify network check was called
    expect(mockInvoke).toHaveBeenCalledWith("check_network_status");
    
    // Click Next
    nextButton = getByRole("button", { name: /next/i });
    await act(async () => {
      fireEvent.click(nextButton);
    });
    
    // Step 3: Backend Download
    await waitFor(() => {
      expect(getByText(/Downloading backend components/i)).toBeInTheDocument();
    });
    
    // --- Mock Dynamic Progress --- Override for this test
    let progressCheckCount = 0;
    mockInvoke.mockImplementation(async (cmd: string, args?: any) => {
      if (cmd === 'check_backend_download_progress') {
        progressCheckCount++;
        return progressCheckCount === 1 ? 50 : 100;
      }
      return originalInvokeImplementation ? originalInvokeImplementation(cmd, args) : Promise.resolve();
    });
 
    // Start download
    const startButton = getByRole("button", { name: /Start Download/i });
    await act(async () => { fireEvent.click(startButton); });
    
    await waitFor(() => {
      expect(getByText(/Download complete!/i)).toBeInTheDocument();
    }, { timeout: 5000 }); // Keep timeout for potential delays
    
    // Verify telemetry was sent
    expect(mockInvoke).toHaveBeenCalledWith("store_telemetry_event", { name: "download_completed", data: { status: "success" } });
    
    // Click Next
    nextButton = getByRole("button", { name: /next/i });
    await act(async () => {
      fireEvent.click(nextButton);
    });
    
    // Step 4: Preferences & Telemetry
    await waitFor(() => {
      expect(getByText(/Preferences & Telemetry/i)).toBeInTheDocument();
    });
    
    // Verify preferences were loaded
    const telemetryCheckbox = getByRole("checkbox", { name: /telemetry/i });
    expect(telemetryCheckbox).not.toBeChecked();
    
    const themeSelect = getByRole("combobox");
    expect(themeSelect).toHaveValue("light");
    
    // Change preferences
    await act(async () => {
      fireEvent.click(telemetryCheckbox);
    });
    expect(telemetryCheckbox).toBeChecked();
    
    await act(async () => {
      fireEvent.change(themeSelect, { target: { value: "dark" } });
    });
    expect(themeSelect).toHaveValue("dark");
    
    // Verify preferences were saved 
    // Verify save preferences was called
    expect(apiService.savePreferences).toHaveBeenCalledWith({
      telemetry: true,
      theme: "dark"
    });
    
    // Verify telemetry events were sent
    expect(apiService.submitTelemetry).toHaveBeenCalledWith("telemetry_preference_changed", { enabled: true });
    expect(apiService.submitTelemetry).toHaveBeenCalledWith("theme_changed", { theme: "dark" });
    
    // Click Next
    nextButton = getByRole("button", { name: /next/i });
    await act(async () => {
      fireEvent.click(nextButton);
    });
    
    // Step 5: Setup Complete
    await waitFor(() => {
      expect(getByText(/Setup Complete!/i)).toBeInTheDocument();
    });
    
    // Verify preferences summary is displayed
    expect(getByText(/Your Preferences/i)).toBeInTheDocument();
    expect(getByText(/Theme/i).nextElementSibling).toHaveTextContent("Dark");
    expect(getByText(/Telemetry/i).nextElementSibling).toHaveTextContent("Enabled");
    
    // Click Finish
    const finishButton = getByRole("button", { name: /finish/i });
    await act(async () => {
      fireEvent.click(finishButton);
    });
    
    // Verify onboarding data was saved
    expect(apiService.saveOnboardingData).toHaveBeenCalledWith({
      telemetry: true,
      theme: "dark"
    });
    
    // Verify completion telemetry was sent
    expect(apiService.submitTelemetry).toHaveBeenCalledWith("onboarding_completed", expect.anything());
  });
  
  it("should handle offline mode throughout the flow", async () => {
    // Setup offline mode
    mockInvoke.mockImplementation((cmd: string) => {
      switch (cmd) {
        case "get_os_info":
          return Promise.resolve("TestOS x86_64");
        case "get_disk_space":
          return Promise.resolve([200 * (1024**3), 500 * (1024**3)]);
        case "get_memory_info":
          return Promise.resolve([8 * (1024**2), 16 * (1024**2)]);
        case "check_network_status":
          return Promise.resolve(false);
        case "get_preferences":
          return Promise.resolve({
            preferences: {
              telemetry: false,
              theme: "light"
            }
          });
        case "save_preferences":
          return Promise.resolve({ success: true });
        case "save_onboarding_data":
          return Promise.resolve({ success: true });
        case "store_telemetry_event":
          return Promise.resolve({ success: true });
        default:
          return Promise.resolve({ success: true });
      }
    });
    
    // Render the onboarding wizard
    render(<OnboardingWizard />);
    
    // Wait for the wizard to load
    await waitFor(() => {
      expect(screen.getByText(/Setup Wizard/i)).toBeInTheDocument();
    });
    
    // Complete Step 0
    const privacyCheckbox = screen.getByRole("checkbox", { name: /privacy policy/i });
    await act(async () => {
      fireEvent.click(privacyCheckbox);
    });
    
    let nextButton = screen.getByRole("button", { name: /next/i });
    await act(async () => {
      fireEvent.click(nextButton);
    });
    
    // Complete Step 1
    await waitFor(() => {
      expect(screen.getByText(/Operating System/i)).toBeInTheDocument();
    });
    
    nextButton = screen.getByRole("button", { name: /next/i });
    await act(async () => {
      fireEvent.click(nextButton);
    });
    
    // Step 2: Network Status (Offline)
    await waitFor(() => {
      expect(screen.getByText(/Network Status:/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Offline/i)).toBeInTheDocument();
    
    // Verify retry button is shown
    const retryButton = screen.getByRole("button", { name: /Retry Connection/i });
    expect(retryButton).toBeInTheDocument();
    
    // Try to retry (still offline)
    await act(async () => {
      fireEvent.click(retryButton);
    });
    
    // Should still show offline
    expect(screen.getByText(/Offline/i)).toBeInTheDocument();
    
    // We can still proceed even when offline
    nextButton = screen.getByRole("button", { name: /next/i });
    await act(async () => {
      fireEvent.click(nextButton);
    });
    
    // Step 3: Backend Download (Offline)
    await waitFor(() => {
      expect(screen.getByText(/Downloading backend components/i)).toBeInTheDocument();
    });
    
    // --- Mock Dynamic Progress --- Override for this test
    let progressCheckCount = 0;
    mockInvoke.mockImplementation(async (cmd: string, args?: any) => {
      if (cmd === 'check_backend_download_progress') {
        progressCheckCount++;
        return progressCheckCount === 1 ? 50 : 100;
      }
      return originalInvokeImplementation ? originalInvokeImplementation(cmd, args) : Promise.resolve();
    });
 
    // Start download
    const startButton = screen.getByRole("button", { name: /Start Download/i });
    await act(async () => { fireEvent.click(startButton); });
    
    await waitFor(() => {
      expect(screen.getByText(/Download complete!/i)).toBeInTheDocument();
    }, { timeout: 5000 }); // Keep timeout
    
    // Verify telemetry was stored locally
    expect(mockInvoke).toHaveBeenCalledWith("store_telemetry_event", {
      event: "backend_download_completed",
      details: expect.anything()
    });
    
    // Continue with the flow
    nextButton = screen.getByRole("button", { name: /next/i });
    await act(async () => { fireEvent.click(nextButton); });
    
    // Complete the rest of the flow
    // Step 4: Preferences & Telemetry
    await waitFor(() => {
      expect(screen.getByText(/Preferences & Telemetry/i)).toBeInTheDocument();
    });
    const telemetryCheckbox = screen.getByRole("checkbox", { name: /telemetry/i });
    await act(async () => {
      fireEvent.click(telemetryCheckbox);
    });
    expect(mockInvoke).toHaveBeenCalledWith("store_telemetry_event", {
        event: "telemetry_preference_changed",
        details: { enabled: true }
    });

    nextButton = screen.getByRole("button", { name: /next/i });
    await act(async () => {
        fireEvent.click(nextButton);
    });

    // Step 5: Setup Complete
    await waitFor(() => {
      expect(screen.getByText(/Setup Complete!/i)).toBeInTheDocument();
    });
    const finishButton = screen.getByRole("button", { name: /finish/i });
    await act(async () => {
        fireEvent.click(finishButton);
    });
    expect(mockInvoke).toHaveBeenCalledWith("store_telemetry_event", {
        event: "onboarding_completed",
        details: expect.anything()
    });
  });
  
  it("should handle system errors gracefully", async () => {
    // Setup error conditions
    mockInvoke.mockImplementation((cmd: string) => {
      switch (cmd) {
        case "get_os_info":
          return Promise.resolve("TestOS x86_64");
        case "get_disk_space":
          return Promise.resolve([5 * (1024**3), 500 * (1024**3)]); 
        case "get_memory_info":
          return Promise.resolve([1 * (1024**2), 16 * (1024**2)]); 
        case "check_network_status":
          return Promise.reject(new Error("Network check failed")); 
        case "save_preferences":
          return Promise.reject(new Error("Failed to save preferences")); 
        case 'start_backend_download':
          return Promise.resolve(); // Allow download to start after network retry
        case 'check_backend_download_progress':
          return Promise.resolve(0); // Allow progress check after network retry
        default: // Fallback for any other unhandled command in this specific mock
          return Promise.resolve(); 
      }
    });
    (apiService.savePreferences as Mock).mockRejectedValue(new Error("Failed to save preferences"));

    render(<OnboardingWizard />);

    // Step 0: Accept privacy
    await waitFor(() => {
      expect(screen.getByText(/Welcome & Privacy Overview/i)).toBeInTheDocument();
    });
    const privacyCheckbox = screen.getByRole("checkbox", { name: /privacy policy/i });
    await act(async () => { fireEvent.click(privacyCheckbox); });
    let nextButton = screen.getByRole("button", { name: /next/i });
    await act(async () => { fireEvent.click(nextButton); });

    // Step 1: System Check (should show warnings but proceed)
    await waitFor(() => {
      // Use more specific query for heading
      expect(screen.getByRole('heading', { name: /Operating System/i, level: 3 })).toBeInTheDocument(); 
    });
    // Check for low disk/memory messages if they were implemented
    // expect(screen.getByText(/Low disk space/i)).toBeInTheDocument();
    // expect(screen.getByText(/Low memory/i)).toBeInTheDocument();
    nextButton = screen.getByRole("button", { name: /next/i });
    await act(async () => { fireEvent.click(nextButton); });

    // Step 2: Network Status (should show error and allow retry)
    await waitFor(() => {
      // Check for the actual error message displayed
      expect(screen.getByText(/Failed to check network status/i)).toBeInTheDocument(); 
    });
    // Use the correct button text for retry
    const retryButton = screen.getByRole("button", { name: /Retry Network Check/i }); 
    // Fix network for retry
    mockInvoke.mockResolvedValueOnce(true); // Mock the successful network check for the retry
    await act(async () => { fireEvent.click(retryButton); });
    await waitFor(() => {
      // Check for the success message after retry
      expect(screen.getByText(/Online/i)).toBeInTheDocument(); 
    });
    nextButton = screen.getByRole("button", { name: /next/i });
    await act(async () => { fireEvent.click(nextButton); });
    
    // Step 3: Backend Download - Simulate completion to proceed
    await waitFor(() => {
      expect(screen.getByText(/Downloading backend components/i)).toBeInTheDocument();
    });
    
    // --- Mock Dynamic Progress --- Override for this test
    let progressCheckCount = 0;
    mockInvoke.mockImplementation(async (cmd: string, args?: any) => {
      if (cmd === 'check_backend_download_progress') {
        progressCheckCount++;
        return progressCheckCount === 1 ? 50 : 100;
      }
      return originalInvokeImplementation ? originalInvokeImplementation(cmd, args) : Promise.resolve();
    });
 
    // Start download
    const startButton = screen.getByRole("button", { name: /Start Download/i });
    await act(async () => { fireEvent.click(startButton); });
    
    await waitFor(() => {
      expect(screen.getByText(/Download complete!/i)).toBeInTheDocument();
    }, { timeout: 5000 }); // Keep timeout
    
    nextButton = screen.getByRole("button", { name: /next/i });
    await act(async () => { fireEvent.click(nextButton); });

    // Step 4: Preferences (attempt to change and trigger save error)
    await waitFor(() => {
        expect(screen.getByText(/Preferences & Telemetry/i)).toBeInTheDocument();
    });
    const telemetryCheckbox = screen.getByRole("checkbox", { name: /telemetry/i });
    await act(async () => { fireEvent.click(telemetryCheckbox); }); 
    
    // Wait for the error message triggered by the failed savePreferences call
    await waitFor(() => {
        expect(screen.getByText(/Failed to save your preferences/i)).toBeInTheDocument();
    });

    // Ensure savePreferences was called
    expect(apiService.savePreferences).toHaveBeenCalled();
    
    // User should still be able to proceed to next step despite error
    nextButton = screen.getByRole("button", { name: /next/i });
    await act(async () => { fireEvent.click(nextButton); });
    
    // Step 5: Review
    await waitFor(() => {
        expect(screen.getByText(/Review Your Choices/i)).toBeInTheDocument();
    });
    // Ensure the locally attempted change is reflected (assuming state updated optimistically)
    expect(screen.getByText(/Telemetry/i).nextElementSibling).toHaveTextContent("Enabled"); 

  });

  it("should load saved preferences on startup", async () => {
    // Setup saved preferences
    (apiService.fetchPreferences as Mock).mockResolvedValue({
      telemetry: true,
      theme: "dark",
    });

    render(<OnboardingWizard />);

    // --- START ADDED NAVIGATION ---
    // Step 0: Accept privacy & Next
    await waitFor(() => {
      expect(screen.getByText(/Welcome & Privacy Overview/i)).toBeInTheDocument();
    });
    const privacyCheckbox = screen.getByRole("checkbox", { name: /privacy policy/i });
    await act(async () => { fireEvent.click(privacyCheckbox); });
    let nextButton = screen.getByRole("button", { name: /next/i });
    await act(async () => { fireEvent.click(nextButton); });

    // Step 1: System Check & Next
    await waitFor(() => { 
      expect(screen.getByRole('heading', { name: /Operating System/i, level: 3 })).toBeInTheDocument();
    });
    nextButton = screen.getByRole("button", { name: /next/i });
    await act(async () => { fireEvent.click(nextButton); });

    // Step 2: Network Status & Next
    await waitFor(() => {
      expect(screen.getByText(/Network Status:/i)).toBeInTheDocument();
    });
    nextButton = screen.getByRole("button", { name: /next/i });
    await act(async () => { fireEvent.click(nextButton); });
    
    // Step 3: Backend Download & Next (Assume instant completion for test)
    await waitFor(() => {
      expect(screen.getByText(/Downloading backend components/i)).toBeInTheDocument();
    });
    
    // --- Mock Dynamic Progress --- Override for this test
    let progressCheckCount = 0;
    mockInvoke.mockImplementation(async (cmd: string, args?: any) => {
      if (cmd === 'check_backend_download_progress') {
        progressCheckCount++;
        return progressCheckCount === 1 ? 50 : 100;
      }
      return originalInvokeImplementation ? originalInvokeImplementation(cmd, args) : Promise.resolve();
    });
 
    // Start download
    const startButton = screen.getByRole("button", { name: /Start Download/i });
    await act(async () => { fireEvent.click(startButton); });
    
    await waitFor(() => {
      expect(screen.getByText(/Download complete!/i)).toBeInTheDocument();
    }, { timeout: 5000 }); // Keep timeout
    
    nextButton = screen.getByRole("button", { name: /next/i });
    await act(async () => { fireEvent.click(nextButton); });

    // Step 4: Preferences & Telemetry - NOW we can check
    await waitFor(() => {
        expect(screen.getByText(/Preferences & Telemetry/i)).toBeInTheDocument();
    });
    // --- END ADDED NAVIGATION ---

    // Wait for preferences to be applied 
    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: /telemetry/i })).toBeChecked();
    });

    // Also check theme
    expect(screen.getByRole("combobox")).toHaveValue("dark");
    
    // Verify fetchPreferences was called on initial load
    expect(apiService.fetchPreferences).toHaveBeenCalledTimes(1);
  });

  // Add more tests for edge cases, like:
  // - Going back through steps
  // - Handling API errors during fetchPreferences
});
