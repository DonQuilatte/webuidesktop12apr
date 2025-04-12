import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import OnboardingWizard from "../OnboardingWizard";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import * as apiService from "../services/api";
import { invoke } from "@tauri-apps/api/core";
import '../styles/modern.css'; 

// Mock API service
vi.mock("../services/api", () => ({
  fetchPreferences: vi.fn(),
  savePreferences: vi.fn(),
  saveOnboardingData: vi.fn(), 
  submitTelemetry: vi.fn(),
}));

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

// Mock global fetch and alert
global.fetch = vi.fn();
window.alert = vi.fn();

// Helper function to render the component
const customRender = (ui: React.ReactElement) => {
  return render(ui);
};

// Helper function to navigate to a specific step
const navigateToStep = async (stepNumber: number) => {
  vi.useFakeTimers();

  for (let currentStep = 0; currentStep < stepNumber; currentStep++) {
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    if (currentStep === 2) {
      const startButton = await screen.findByRole("button", { name: /Start Download/i });
      await act(async () => { 
        fireEvent.click(startButton); 
        vi.advanceTimersByTime(15000); 
      });
    }

    const nextButton = await screen.findByRole("button", { name: /next/i });
    
    if (!nextButton.hasAttribute('disabled')) {
      await act(async () => { 
        fireEvent.click(nextButton);
        vi.runAllTimers();
      });
    }
  }
};

describe("OnboardingWizard", () => {
  const mockInvoke = invoke as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers(); 

    // Setup API service mocks
    (apiService.fetchPreferences as Mock).mockResolvedValue({
      telemetry: false,
      theme: "light",
    });
    (apiService.savePreferences as Mock).mockResolvedValue({ success: true });
    (apiService.submitTelemetry as Mock).mockResolvedValue({ success: true });
    (apiService.saveOnboardingData as Mock).mockResolvedValue({ success: true });

    // Setup Tauri invoke mocks
    mockInvoke.mockImplementation((cmd: string) => {
      switch (cmd) {
        case "get_os_info": 
          return Promise.resolve("TestOS x86_64");
        case "get_disk_space": 
          return Promise.resolve([200 * (1024**3), 500 * (1024**3)]);
        case "get_memory_info": 
          return Promise.resolve([8 * (1024**2), 16 * (1024**2)]);
        case "check_network_status": 
          return Promise.resolve(true);
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
  });

  it("should render the Welcome step initially", async () => {
    customRender(<OnboardingWizard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Setup Wizard/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/Welcome & Privacy Overview/i)).toBeInTheDocument();
    
    const privacyCheckbox = await screen.findByRole("checkbox", { name: /privacy policy/i });
    expect(privacyCheckbox).toBeInTheDocument();
  });

  it("should navigate to the System Check step (Step 1) on Next", async () => {
    customRender(<OnboardingWizard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Setup Wizard/i)).toBeInTheDocument();
    });
    
    const nextButton = await screen.findByRole("button", { name: /next/i });
    await act(async () => { 
      fireEvent.click(nextButton);
    });
    
    expect(await screen.findByText(/Operating System/i)).toBeInTheDocument();
    expect(mockInvoke).toHaveBeenCalledWith("get_os_info");
  });

  it("should navigate to the Network Status step (Step 2) on Next", async () => {
    customRender(<OnboardingWizard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Setup Wizard/i)).toBeInTheDocument();
    });
    
    const nextButton = await screen.findByRole("button", { name: /next/i });
    await act(async () => { 
      fireEvent.click(nextButton);
    });
    await act(async () => { 
      fireEvent.click(nextButton);
    });
    
    expect(await screen.findByText(/Network Status:/i)).toBeInTheDocument();
    expect(await screen.findByText(/Online/i)).toBeInTheDocument();
    expect(mockInvoke).toHaveBeenCalledWith("check_network_status");
  });

  it("should navigate to the Backend Download step (Step 3) on Next", async () => {
    customRender(<OnboardingWizard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Setup Wizard/i)).toBeInTheDocument();
    });
    
    const nextButton = await screen.findByRole("button", { name: /next/i });
    await act(async () => { 
      fireEvent.click(nextButton);
    });
    await act(async () => { 
      fireEvent.click(nextButton);
    });
    await act(async () => { 
      fireEvent.click(nextButton);
    });
    
    expect(await screen.findByRole("heading", { name: /Downloading backend components/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Start Download/i })).toBeInTheDocument();
  });

  it("should navigate to the Preferences step (Step 4) on Next", async () => {
    vi.useFakeTimers();
    customRender(<OnboardingWizard />);
    
    try {
      await act(async () => {
        await navigateToStep(4);
      });
      
      expect(screen.getByText(/Preferences & Telemetry/i)).toBeInTheDocument();
      
      const telemetryCheckbox = await screen.findByRole("checkbox", { name: /telemetry/i });
      expect(telemetryCheckbox).toBeInTheDocument();
      
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  }, { timeout: 60000 });

  it("should navigate to the Setup Complete step (Step 5) on Next", async () => {
    vi.useFakeTimers();
    customRender(<OnboardingWizard />);
    
    try {
      await act(async () => {
        await navigateToStep(5);
      });
      
      expect(screen.getByText(/Setup Complete!/i)).toBeInTheDocument();
      
      expect(screen.getByText(/Your Preferences/i)).toBeInTheDocument();
      
      expect(screen.getByRole("button", { name: /Start Guided Tour/i })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  }, { timeout: 60000 });

  it("should navigate back correctly", async () => {
    customRender(<OnboardingWizard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Setup Wizard/i)).toBeInTheDocument();
    });
    
    const nextButton = await screen.findByRole("button", { name: /next/i });
    await act(async () => { 
      fireEvent.click(nextButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Operating System/i)).toBeInTheDocument();
    });
    
    await act(async () => { 
      fireEvent.click(screen.getByRole("button", { name: /back/i }));
    });
    
    expect(await screen.findByText(/Welcome & Privacy Overview/i)).toBeInTheDocument();
  });

  it("should disable Back button on the first step", async () => {
    customRender(<OnboardingWizard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Setup Wizard/i)).toBeInTheDocument();
    });
    
    expect(screen.getByRole("button", { name: /back/i })).toBeDisabled();
  });

  it("should show Finish button on the last step", async () => {
    customRender(<OnboardingWizard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Setup Wizard/i)).toBeInTheDocument();
    });
    
    const nextButton = await screen.findByRole("button", { name: /next/i });
    await act(async () => { 
      fireEvent.click(nextButton);
    });
    await act(async () => { 
      fireEvent.click(nextButton);
    });
    await act(async () => { 
      fireEvent.click(nextButton);
    });
    await act(async () => { 
      fireEvent.click(nextButton);
    });
    await act(async () => { 
      fireEvent.click(nextButton);
    });
    
    expect(screen.queryByRole("button", { name: /next/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /finish/i })).toBeInTheDocument();
  });

  it("[Step 0] should allow checking/unchecking privacy consent", async () => {
    customRender(<OnboardingWizard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Setup Wizard/i)).toBeInTheDocument();
    });
    
    const privacyCheckbox = await screen.findByRole("checkbox", { name: /privacy policy/i });

    expect(privacyCheckbox).not.toBeChecked();
    await act(async () => { fireEvent.click(privacyCheckbox); });
    expect(privacyCheckbox).toBeChecked();
  });

  it("[Step 1] should display system information correctly", async () => {
    customRender(<OnboardingWizard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Setup Wizard/i)).toBeInTheDocument();
    });
    
    const nextButton = await screen.findByRole("button", { name: /next/i });
    await act(async () => { 
      fireEvent.click(nextButton);
    });
    
    expect(await screen.findByText("TestOS x86_64")).toBeInTheDocument();
    expect(await screen.findByText(/200 GB free \/ 500 GB total/i)).toBeInTheDocument();
    expect(await screen.findByText(/8192.00 MB free \/ 16384.00 MB total/i)).toBeInTheDocument();
  });

  it("[Step 1] should display loading state", async () => {
    mockInvoke.mockImplementation((cmd: string) => {
      if (["get_os_info", "get_disk_space", "get_memory_info"].includes(cmd)) {
        return new Promise(resolve => setTimeout(() => resolve("Delayed Info"), 50));
      }
      return Promise.resolve(true);
    });
    
    customRender(<OnboardingWizard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Setup Wizard/i)).toBeInTheDocument();
    });
    
    const nextButton = await screen.findByRole("button", { name: /next/i });
    await act(async () => { 
      fireEvent.click(nextButton);
    });
    
    expect(await screen.findByText(/Loading system information.../i)).toBeInTheDocument();
    expect(await screen.findByText("Delayed Info", {}, { timeout: 200 })).toBeInTheDocument();
  });

  it("[Step 1] should display error state", async () => {
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === "get_disk_space") return Promise.reject(new Error("Disk read error"));
      if (cmd === "get_os_info") return Promise.resolve("TestOS");
      if (cmd === "get_memory_info") return Promise.resolve([8 * (1024**2), 16 * (1024**2)]);
      return Promise.resolve(true);
    });

    customRender(<OnboardingWizard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Setup Wizard/i)).toBeInTheDocument();
    });
    
    const nextButton = await screen.findByRole("button", { name: /next/i });
    await act(async () => { 
      fireEvent.click(nextButton);
    });
    
    expect(await screen.findByText(/0 Bytes free \/ 0 Bytes total/i)).toBeInTheDocument();
    expect(screen.getByText("TestOS")).toBeInTheDocument(); 
    expect(await screen.findByText(/8192.00 MB free \/ 16384.00 MB total/i)).toBeInTheDocument(); 
  });

  it("[Step 2] should display online status", async () => {
    mockInvoke.mockResolvedValue(true); 
    customRender(<OnboardingWizard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Setup Wizard/i)).toBeInTheDocument();
    });
    
    const nextButton = await screen.findByRole("button", { name: /next/i });
    await act(async () => { 
      fireEvent.click(nextButton);
    });
    await act(async () => { 
      fireEvent.click(nextButton);
    });
    
    expect(await screen.findByText(/Online/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Retry Connection/i})).not.toBeInTheDocument();
  });

  it("[Step 2] should display offline status and retry button", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === 'check_network_status') return false;
      return true;
    });

    customRender(<OnboardingWizard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Setup Wizard/i)).toBeInTheDocument();
    });
    
    const nextButton = await screen.findByRole("button", { name: /next/i });
    await act(async () => { 
      fireEvent.click(nextButton);
    });
    await act(async () => { 
      fireEvent.click(nextButton);
    });
    
    expect(await screen.findByText(/Offline/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry Connection/i})).toBeInTheDocument();
  });

  it("[Step 2] should retry network check when offline and Retry is clicked", async () => {
    mockInvoke.mockImplementation(async (cmd: string) => { 
      if (cmd === 'check_network_status') return false;
      return true;
    });

    customRender(<OnboardingWizard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Setup Wizard/i)).toBeInTheDocument();
    });
    
    const nextButton = await screen.findByRole("button", { name: /next/i });
    await act(async () => { 
      fireEvent.click(nextButton);
    });
    await act(async () => { 
      fireEvent.click(nextButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Offline/i)).toBeInTheDocument();
    });
    
    const retryButton = screen.getByRole("button", { name: /Retry Connection/i});
    const initialInvokeCalls = mockInvoke.mock.calls.length;

    mockInvoke.mockImplementation(async (cmd: string) => { 
      if (cmd === 'check_network_status') return true;
      return true;
    });

    await act(async () => { fireEvent.click(retryButton); });

    expect(await screen.findByText(/Online/i)).toBeInTheDocument();
    expect(mockInvoke.mock.calls.length).toBe(initialInvokeCalls + 1);
    expect(mockInvoke).toHaveBeenLastCalledWith('check_network_status');
  });

  it("[Step 2] should display network error state", async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {}); 
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === 'check_network_status') throw new Error("Network check failed");
      return true;
    });

    customRender(<OnboardingWizard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Setup Wizard/i)).toBeInTheDocument();
    });
    
    const nextButton = await screen.findByRole("button", { name: /next/i });
    await act(async () => { 
      fireEvent.click(nextButton);
    });
    await act(async () => { 
      fireEvent.click(nextButton);
    });
    
    expect(await screen.findByText(/Failed to check network status/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry network check/i })).toBeInTheDocument();

    consoleErrorSpy.mockRestore(); 
  });

  it("[Step 3] should simulate download progress on 'Start Download' click", async () => {
    vi.mocked(invoke).mockImplementation(async (cmd) => {
      if (cmd === 'start_backend_download') {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ success: true });
          }, 15000); 
        });
      }
      return Promise.resolve(true);
    });

    vi.useFakeTimers();
    customRender(<OnboardingWizard />);
    
    await waitFor(() => {
      expect(screen.getByText(/Setup Wizard/i)).toBeInTheDocument();
    });
    
    const nextButton = await screen.findByRole("button", { name: /next/i });
    await act(async () => { 
      fireEvent.click(nextButton);
    });
    await act(async () => { 
      fireEvent.click(nextButton);
    });
    await act(async () => { 
      fireEvent.click(nextButton);
    });
    
    const startButton = await screen.findByRole("button", { name: /Start Download/i });

    await act(async () => { fireEvent.click(startButton); });

    await waitFor(() => expect(screen.queryByRole("button", { name: /Start Download/i })).not.toBeInTheDocument());
    expect(screen.getByText(/% complete/i)).toBeInTheDocument(); 
    expect(screen.getByText(/Est. time: \d+s/i)).toBeInTheDocument(); 

    await act(async () => { vi.advanceTimersByTime(15000); });

    await waitFor(async () => {
      expect(await screen.findByText(/100% complete/i)).toBeInTheDocument();
      expect(screen.getByText(/Download complete!/i)).toBeInTheDocument();
    }); 

    await waitFor(() => {
      expect(apiService.submitTelemetry).toHaveBeenCalledWith('backend_download_completed', expect.anything());
    }); 

    vi.useRealTimers();
  }, { timeout: 60000 }); 

  // Add more tests for Step 4 and Step 5 as needed
});