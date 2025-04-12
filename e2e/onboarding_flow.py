"""
E2E test for the onboarding wizard using Playwright MCP server.

This script demonstrates how to use the Playwright MCP server's tools to:
- Launch the app in the browser
- Step through the onboarding wizard
- Assert that each step appears in order
- Take a screenshot at the end

To run:
1. Start the frontend dev server (e.g., `npm run dev` in app/)
2. Use the MCP client to execute this script, or adapt the logic to your automation framework.
"""

import time

from mcp_client import PlaywrightMCPClient  # Hypothetical MCP client library

APP_URL = "http://localhost:5173"

def run_onboarding_flow():
    client = PlaywrightMCPClient()
    client.navigate(APP_URL)
    assert "Setup Wizard" in client.get_visible_text()

    # Step 1: Welcome & Privacy Overview
    assert "Welcome & Privacy Overview" in client.get_visible_text()
    client.click("button:has-text('Next')")

    # Step 2: System Compatibility Check
    assert "System Compatibility Check" in client.get_visible_text()
    client.click("button:has-text('Next')")

    # Step 3: Network Status
    assert "Network Status" in client.get_visible_text()
    client.click("button:has-text('Next')")

    # Step 4: Backend Download
    assert "Backend Download" in client.get_visible_text()
    client.click("button:has-text('Start Download')")
    # Wait for download to complete (simulate progress)
    time.sleep(7)
    assert "Download complete!" in client.get_visible_text()
    client.click("button:has-text('Next')")

    # Step 5: Preferences & Telemetry (placeholder)
    assert "Preferences & Telemetry" in client.get_visible_text()
    client.click("button:has-text('Next')")

    # Step 6: Completion & Guided Tour (placeholder)
    assert "Completion & Guided Tour" in client.get_visible_text()
    client.screenshot("onboarding-complete.png")

    print("Onboarding E2E flow completed successfully.")

if __name__ == "__main__":
    run_onboarding_flow()
