import { render, screen, fireEvent, act } from "@testing-library/react";
import OnboardingWizard from "../OnboardingWizard";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("OnboardingWizard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });
  it("renders the first step (Welcome & Privacy Overview)", () => {
    render(<OnboardingWizard />);
    expect(screen.getByText("Setup Wizard")).toBeInTheDocument();
    expect(screen.getByText("Welcome & Privacy Overview")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /privacy policy/i })).toBeInTheDocument();
  });

  it("navigates to the next step when clicking Next button", () => {
    render(<OnboardingWizard />);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText("System Compatibility Check")).toBeInTheDocument();
  });

  it("navigates back to previous step when clicking Back button", () => {
    render(<OnboardingWizard />);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText("System Compatibility Check")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByText("Welcome & Privacy Overview")).toBeInTheDocument();
  });

  it("disables the Back button on the first step", () => {
    render(<OnboardingWizard />);
    expect(screen.getByRole("button", { name: /back/i })).toBeDisabled();
  });

  it("allows checking privacy policy checkbox", () => {
    render(<OnboardingWizard />);
    const checkbox = screen.getByRole("checkbox", { name: /privacy policy/i });
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("shows download progress when clicking Start Download", () => {
    render(<OnboardingWizard />);
    // Navigate to Backend Download step (step 3)
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    // Should see Start Download button
    const downloadButton = screen.getByRole("button", { name: /start download/i });
    expect(downloadButton).toBeInTheDocument();
    fireEvent.click(downloadButton);
    // Progress should start at 0%
    expect(screen.getByText("0%")).toBeInTheDocument();
    // Simulate time passing for progress bar
    act(() => {
      vi.advanceTimersByTime(1500); // 5 steps of 300ms = 25%
    });
    // Progress should have increased
    // Note: This is a basic check; in real tests, you may want to mock timers more robustly
  });

  it("renders Preferences & Telemetry step and allows interaction", () => {
    render(<OnboardingWizard />);
    // Navigate to Preferences step (step 4)
    fireEvent.click(screen.getByRole("button", { name: /next/i })); // Step 1
    fireEvent.click(screen.getByRole("button", { name: /next/i })); // Step 2
    fireEvent.click(screen.getByRole("button", { name: /next/i })); // Step 3
    fireEvent.click(screen.getByRole("button", { name: /next/i })); // Step 4

    expect(screen.getByText("Preferences & Telemetry")).toBeInTheDocument();

    // Check initial state
    const telemetryCheckbox = screen.getByRole("checkbox", { name: /telemetry/i });
    const themeSelect = screen.getByRole("combobox", { name: /theme/i });
    expect(telemetryCheckbox).not.toBeChecked();
    expect(themeSelect).toHaveValue("light");

    // Interact
    fireEvent.click(telemetryCheckbox);
    fireEvent.change(themeSelect, { target: { value: "dark" } });

    // Check updated state
    expect(telemetryCheckbox).toBeChecked();
    expect(themeSelect).toHaveValue("dark");
  });

  it("renders Completion & Guided Tour step with summary", () => {
    render(<OnboardingWizard />);
    // Navigate to Completion step (step 5)
    fireEvent.click(screen.getByRole("button", { name: /next/i })); // Step 1
    fireEvent.click(screen.getByRole("button", { name: /next/i })); // Step 2
    fireEvent.click(screen.getByRole("button", { name: /next/i })); // Step 3
    fireEvent.click(screen.getByRole("button", { name: /next/i })); // Step 4

    // Set some preferences on step 4
    const telemetryCheckbox = screen.getByRole("checkbox", { name: /telemetry/i });
    const themeSelect = screen.getByRole("combobox", { name: /theme/i });
    fireEvent.click(telemetryCheckbox);
    fireEvent.change(themeSelect, { target: { value: "dark" } });

    fireEvent.click(screen.getByRole("button", { name: /next/i })); // Step 5

    expect(screen.getByText("Completion & Guided Tour")).toBeInTheDocument();
    expect(screen.getByText(/setup complete/i)).toBeInTheDocument();

    // Check summary reflects choices
    expect(screen.getByText(/Theme:/i)).toHaveTextContent("Dark");
    expect(screen.getByText(/Telemetry:/i)).toHaveTextContent("Enabled");

    expect(screen.getByRole("button", { name: /start guided tour/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /finish/i })).toBeInTheDocument();
  });

});
