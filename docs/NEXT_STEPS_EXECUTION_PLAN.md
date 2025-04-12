# Next Steps Execution Plan

## 1. Review Summary

- **PRD**: Clear goals—privacy-first, zero-CLI, cross-platform, local-only data. Features and non-goals are well defined.
- **Plan**: NEXT_STEPS_PLAN.md is up to date and identifies current state, gaps, and next steps.
- **Frontend (OnboardingWizard.tsx)**:
  - Steps 0–5 UI is implemented. Logic for steps 0-3 is present. Logic for steps 4-5 (preferences/telemetry) is UI-only and needs backend integration.
- **Backend (main.py)**:
  - API includes `/health`, `/preferences` (GET/POST), `/onboarding` (POST), and `/telemetry` (POST) endpoints.
- **Testing**: Unit tests pass for frontend (steps 0-3) and backend (`/health`). Tests are missing for new UI steps and new backend endpoints. E2E tests cover basic flow but need expansion.
- **Packaging/Distribution**: No automation for Tauri or PyInstaller builds yet.
- **Docs**: PRD and rules are up to date; feature-specific docs may be missing.

---

## 2. Proposed Next Steps

### A. Product/Feature Development
- **Integrate Frontend and Backend**
  - Connect onboarding wizard (steps 4-5) to backend endpoints (`/preferences`, `/telemetry`) for data persistence and retrieval.
- **Integrate Frontend and Backend**
  - Connect onboarding wizard to backend endpoints for data persistence and retrieval.

### B. Privacy & Security
- **Define Privacy Guarantees**
  - Update PRD with explicit privacy guarantees and threat models.
- **Data Handling**
  - Ensure all user data is stored locally and document the storage mechanism.

### C. Packaging & Distribution
- **Automate Build**
  - Add scripts for Tauri and PyInstaller builds.
  - Test cross-platform packaging.
- **Update CSP**
  - Ensure Tauri CSP matches backend port.

### D. Testing & QA
- **Add Backend Tests**
  - Cover new API endpoints (`/preferences`, `/onboarding`, `/telemetry`).
- **Add Frontend Tests**
  - Cover new onboarding steps (Preferences, Completion).
- **Expand E2E Tests**
  - Cover full onboarding flow, including new features and backend interaction.
- **Add Integration Tests**
  - Test frontend-backend integration specifically.

### E. Documentation
- **Update PRD**
  - Fill in open questions and log changes.
- **Add Feature Docs**
  - Document onboarding flow, backend API, and packaging process.

---

## 3. Architecture Diagram

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