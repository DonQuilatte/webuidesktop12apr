# Product Requirements Document (PRD)

## Project Overview
A cross-platform, privacy-first, zero-CLI desktop app with a Tauri + React frontend and a frozen Python backend.

## Goals
- Provide a secure, user-friendly desktop application for all major platforms.
- Ensure all user data remains local by default.
- Require no command-line interaction for end users.

## Features

### 1. Onboarding Wizard
- Guide users through initial setup.
- Collect only essential information (preferences, optional telemetry), respecting privacy.
- Includes steps for Welcome, System Check, Network Status, Backend Download, Preferences & Telemetry, and Completion.

### 2. Main Application UI
- Responsive, modern interface using React and Tailwind CSS.
- Seamless integration with native OS features via Tauri.

### 3. Backend Services
- FastAPI-based Python backend for local data processing and API logic.
- Expose `/health`, `/preferences` (GET/POST), `/onboarding` (POST), and `/telemetry` (POST) endpoints.

### 4. Packaging & Distribution
- Use Tauri for secure, cross-platform packaging.
- Backend frozen with PyInstaller for easy distribution.

## Non-Goals
- No cloud storage or remote data processing by default.
- No required CLI usage for end users.

## Technical Requirements
- Frontend: React 19, Tailwind CSS 4, Vite 6, Tauri 2, TypeScript 5.7
- Backend: Python 3.10+, FastAPI, Uvicorn

## Open Questions / To Be Defined
- [ ] What additional features are planned for future releases?
- [x] What are the specific privacy guarantees and threat models?
  - **Guarantees:** All user data (preferences, etc.) is stored locally on the user's machine (`preferences.json`). No data is sent to external servers by default. Anonymous telemetry (if explicitly enabled by the user) is logged locally (`telemetry.log`) and is not automatically transmitted.
  - **Threat Model (Basic):** Assumes the local machine is secure. Threats considered are unintentional data leakage during operation. Does not currently address threats like malicious local access or sophisticated attacks targeting local data files. (Further definition needed if cloud features are added).
- [ ] How will updates and patching be handled?

## Change Log
- _2025-04-12_: Initial PRD created.
- _2025-04-12_: Updated Features section for completed Onboarding steps (Preferences, Completion) and expanded Backend API (`/preferences`, `/onboarding`, `/telemetry`). Addressed privacy guarantees open question.

---

**Update this document as features, requirements, or architecture evolve.**
