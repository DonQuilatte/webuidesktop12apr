# Next Steps Plan

## 1. Current State

- **PRD**: Clear on privacy, zero-CLI, cross-platform, and local-only data. Features and non-goals are well defined. Some open questions remain (future features, privacy guarantees, update/patching).
- **Frontend**: React + Tauri onboarding wizard UI is implemented (steps 0-5). Uses Tailwind for styling. Unit tests pass but need expansion for new steps.
- **Backend**: FastAPI API includes `/health`, `/preferences` (GET/POST), `/onboarding` (POST), and `/telemetry` (POST) endpoints. Unit tests pass for `/health` but need expansion for new endpoints.
- **Testing**: Both unit and E2E tests exist and now pass.
- **Dependency Management**: Documented and up to date.
- **Project Rules**: Enforced via linting, type safety, and test requirements.

---

## 2. Gaps and Open Questions

- **PRD Open Questions**:
  - What additional features are planned for future releases?
  - What are the specific privacy guarantees and threat models?
  - How will updates and patching be handled?
- **Onboarding Wizard**:
  - UI is complete, but logic for persisting/retrieving preferences and submitting telemetry is missing.
- **Backend**:
  - API endpoints exist but lack comprehensive testing.
- **Packaging/Distribution**:
  - No evidence of PyInstaller or Tauri build/test automation in codebase.
- **Documentation**:
  - PRD and rules are up to date, but feature-specific docs may be missing.

---

## 3. Suggested Next Steps

### A. Product/Feature Development
- **Integrate Frontend and Backend**: Connect onboarding wizard to backend endpoints for data persistence and retrieval.
- **Integrate Frontend and Backend**: Connect onboarding wizard to backend endpoints for data persistence and retrieval.

### B. Privacy & Security
- **Define Privacy Guarantees**: Update PRD with explicit privacy guarantees and threat models.
- **Data Handling**: Ensure all user data is stored locally and document the storage mechanism.

### C. Packaging & Distribution
- **Automate Build**: Add scripts for Tauri and PyInstaller builds. Test cross-platform packaging.
- **Update CSP**: Ensure Tauri CSP matches backend port (currently 5002 in code, 5000 in config).

### D. Testing & QA
- **Add Backend Tests**: Cover new API endpoints (`/preferences`, `/onboarding`, `/telemetry`).
- **Add Frontend Tests**: Cover new onboarding steps (Preferences, Completion).
- **Expand E2E Tests**: Cover full onboarding flow, including new features and backend interaction.
- **Add Integration Tests**: Test frontend-backend integration specifically.

### E. Documentation
- **Update PRD**: Fill in open questions and log changes.
- **Add Feature Docs**: Document onboarding flow, backend API, and packaging process.

---

## 4. Architecture Overview

```mermaid
flowchart TD
    subgraph Frontend [Tauri + React]
        A[OnboardingWizard.tsx]
        B[Other React Components]
    end
    subgraph Backend [FastAPI]
        C[main.py]
        D[Health Endpoint]
        E[Preferences/Telemetry Endpoints]
    end
    A -- invoke, HTTP/API --> C
    C --> D
    C --> E
    A -- Local Storage --> F[(User Data)]