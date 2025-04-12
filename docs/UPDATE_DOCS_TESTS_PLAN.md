# Plan: Update Documentation and Tests

**Goal:** Align PRD, plans, and tests with the recently completed onboarding UI steps and backend API expansion.

**Steps:**

1.  **Update Plan Files (`docs/NEXT_STEPS_PLAN.md`, `docs/NEXT_STEPS_EXECUTION_PLAN.md`):**
    *   Modify the "Current State" sections to accurately reflect that the Onboarding Wizard UI (steps 4-5) is complete and the backend API includes `/preferences`, `/onboarding`, and `/telemetry` endpoints.
    *   Update the "Suggested Next Steps" / "Proposed Next Steps" sections to remove completed items and re-prioritize remaining tasks (e.g., Integration, Testing, Documentation).
2.  **Update Backend Tests (`tests/`):**
    *   Create a new file `tests/test_api.py` (or add to `tests/test_health.py`).
    *   Implement `pytest` tests using `httpx.AsyncClient` and `ASGITransport` for:
        *   `POST /preferences`: Test saving valid preferences.
        *   `GET /preferences`: Test retrieving saved preferences and default values.
        *   `POST /onboarding`: Test saving onboarding data (currently same as preferences).
        *   `POST /telemetry`: Test submitting valid telemetry data.
    *   Consideration: Add tests for invalid data or error conditions if applicable.
3.  **Update Frontend Tests (`app/src/__tests__/OnboardingWizard.test.tsx`):**
    *   Add new `it(...)` blocks to test:
        *   Rendering of the "Preferences & Telemetry" step.
        *   Interaction with telemetry checkbox and theme dropdown.
        *   Rendering of the "Completion & Guided Tour" step.
        *   Display of selected preferences in the completion summary.
        *   Interaction with the "Start Guided Tour" button.
4.  **Update PRD (`docs/PRD.md`):**
    *   Update "Features -> Backend Services" to list the new API endpoints.
    *   Update "Features -> Onboarding Wizard" to describe the implemented Preferences and Completion steps.
    *   Address the open question "[ ] What are the specific privacy guarantees and threat models?". *Note: This might require further input.*
    *   Add an entry to the "Change Log" detailing these updates.