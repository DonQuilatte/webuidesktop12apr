# Plan: Update Documentation and Tests

**Goal:** Align PRD, plans, and tests with the recently completed onboarding UI steps, backend API expansion, and local storage implementation.

**Steps:**

1.  **Update Plan Files (`docs/NEXT_STEPS_PLAN.md`, `docs/NEXT_STEPS_EXECUTION_PLAN.md`):** 
    *   Update architecture diagrams to include the local storage implementation using Tauri's native capabilities.
    *   Add new section on local storage implementation and its benefits (reduced backend dependency).

2.  **Update Backend Tests (`tests/`):**
    *   Create a new file `tests/test_api.py` (or add to `tests/test_health.py`).
    *   Implement `pytest` tests using `httpx.AsyncClient` and `ASGITransport` for:
        *   `POST /preferences`: Test saving valid preferences.
        *   `GET /preferences`: Test retrieving saved preferences and default values.
        *   `POST /onboarding`: Test saving onboarding data (currently same as preferences).
        *   `POST /telemetry`: Test submitting valid telemetry data.
    *   Consideration: Add tests for invalid data or error conditions if applicable.

3.  **Update Frontend Tests (`app/src/__tests__/OnboardingWizard.test.tsx`):**
    *   Add tests for Tauri command invocations:
        *   Test `get_preferences` command for retrieving preferences.
        *   Test `save_preferences` command for saving preferences.
        *   Test `save_onboarding_data` command for recording completion.
        *   Test `store_telemetry_event` command for logging telemetry.

4.  **Update PRD (`docs/PRD.md`):**
    *   Add details about the local storage implementation and its benefits.
    *   Update the System Compatibility Check section to describe the enhanced UI with status indicators and gradient progress bars.

5.  **Create New Documentation for Local Storage Implementation:**
    *   Document the Tauri commands implemented for local storage:
        *   `get_preferences`: Fetches user preferences from local storage.
        *   `save_preferences`: Saves user preferences to local storage.
        *   `save_onboarding_data`: Records completion of onboarding.
        *   `store_telemetry_event`: Stores telemetry events locally.
    *   Explain the benefits of using local storage over HTTP API calls (reduced backend dependency, improved reliability).
    *   Document the file structure and format of the locally stored data.
    *   Provide examples of how to use the local storage API in the frontend.

6.  **Update System Compatibility Check Documentation:**
    *   Document the enhanced UI with status indicators (good, warning, critical).
    *   Describe the gradient progress bars that change color based on status.
    *   Explain the thresholds for different status levels.
    *   Provide screenshots or mockups of the enhanced UI.

**Status:** In progress (4/6 steps completed)