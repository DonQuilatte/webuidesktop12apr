# Product Requirements Document (PRD)

## Project Overview
A cross-platform, privacy-first, zero-CLI desktop app with a Tauri + React frontend and a frozen Python backend.

## Goals
- Provide a secure, user-friendly desktop application for all major platforms.
- Ensure all user data remains local by default.
- Require no command-line interaction for end users.

## Features

### 1. Onboarding Wizard
- Guide users through initial setup with a modern, intuitive interface.
- Collect only essential information (preferences, optional telemetry), respecting privacy.
- Includes steps for Welcome, System Check, Network Status, Backend Download, Preferences & Telemetry, and Completion.
- Features a sleek design with step indicators, custom form elements, and visual feedback.
- Supports both light and dark themes with smooth transitions.
- **Modern Design:** Features a modern, card-based layout with subtle animations, gradients, and custom-styled form elements, supporting both light and dark modes. Adheres to the Design System and Styling Guidelines outlined below.
- **System Compatibility Check:** Provides detailed system information with status indicators (good, warning, critical) and gradient progress bars that change color based on status.
- **Local Storage:** Uses Tauri's native capabilities for storing preferences and telemetry data locally, eliminating dependency on the backend server for basic functionality.

### 2. Main Application UI
- Responsive, modern interface using React and Tailwind CSS.
- Seamless integration with native OS features via Tauri.
- Consistent design system with custom components and animations.

### 3. Backend Services
- FastAPI-based Python backend for local data processing and API logic.
- Expose `/health`, `/preferences` (GET/POST), `/onboarding` (POST), and `/telemetry` (POST) endpoints.
- **Fallback Mechanism:** Application can function without the backend server by using Tauri's local storage capabilities.

### 4. Packaging & Distribution
- Use Tauri for secure, cross-platform packaging.
- Backend frozen with PyInstaller for easy distribution.

## Non-Goals
- No cloud storage or remote data processing by default.
- No required CLI usage for end users.

## Technical Requirements
- Frontend: React 19, Tailwind CSS 4, Vite 6, Tauri 2, TypeScript 5.7
- Backend: Python 3.10+, FastAPI, Uvicorn

## Design System and Styling Guidelines

To ensure a consistent, modern, and user-friendly experience, this application adopts design principles and components inspired by the Open WebUI project. The goal is to maintain visual consistency and leverage established best practices for UI/UX.

**Core Technologies:**
*   **Frontend Framework:** React with TypeScript
*   **Styling Framework:** TailwindCSS (utility-first approach)
*   **Responsive Design:** Optimized for desktop, laptop, and mobile using container queries and responsive utilities.

**Theme System:**
*   **Default Theme:** Ocean (blue, calming theme)
*   **Mode Support:**
    *   Light Mode
    *   Dark Mode (for reduced eye strain)
    *   OLED Dark Mode (true black backgrounds)
*   **Switching:** Supports manual theme/mode switching with persistence. _(Future goal: System preference detection)._

**Typography:**
*   **Primary Font:** "Inter" (general text)
*   **Secondary Font:** "Plus Jakarta Sans" (specific elements, e.g., headings)
*   **Monospace Font:** "Fira Code" (code blocks, technical content)
*   **Rendering:** Support for standard Markdown rendering. _(Future goal: Enhanced code block syntax highlighting, LaTeX rendering)._

**UI Components and Layout (Core Concepts):**
*   **Navigation:** Collapsible Sidebar (mobile) / Fixed Sidebar (desktop), minimal Header, clean Tab System.
*   **Interactive Elements:** Standardized Buttons (primary, secondary, icon), Inputs (text, dropdowns, toggles), Modals (centered, animated).
*   **Chat Interface (If Applicable):** Distinct message bubbles (user/AI), Markdown support, potential for rich content display (code blocks, media).
*   **Layout:** Clean, minimal design with adequate whitespace, consistent spacing, and responsive container sizing.

**Design Principles:**
*   **Clean and Minimal:** Avoid clutter, prioritize clarity.
*   **Responsive and Adaptive:** Ensure usability across screen sizes.
*   **Consistent Visual Language:** Maintain uniformity in colors, spacing, typography.
*   **Intuitive Navigation:** Make user flows clear and predictable.
*   **Performance:** Optimize assets and loading strategies.
*   **Accessibility:** Follow WCAG guidelines (contrast, keyboard navigation, ARIA attributes).

Developers should adhere to these guidelines when creating new components or modifying existing ones. Refer to TailwindCSS documentation and the established styles in `modern.css` (or equivalent). Custom components should be modular and reusable.

## Open Questions / To Be Defined
- [ ] What additional features are planned for future releases?
- [x] What are the specific privacy guarantees and threat models?
  - **Guarantees:** All user data (preferences, etc.) is stored locally on the user's machine (`preferences.json`). No data is sent to external servers by default. Anonymous telemetry (if explicitly enabled by the user) is logged locally (`telemetry.log`) and is not automatically transmitted.
  - **Threat Model (Basic):** Assumes the local machine is secure. Threats considered are unintentional data leakage during operation. Does not currently address threats like malicious local access or sophisticated attacks targeting local data files. (Further definition needed if cloud features are added).
- [ ] How will updates and patching be handled?

## Change Log
- _2025-04-13_: Implemented local storage for preferences using Tauri's native capabilities instead of HTTP API calls, eliminating dependency on the backend server for basic functionality. Enhanced System Compatibility Check screen with status indicators and gradient progress bars.
- _2025-04-12_: Initial PRD created.
- _2025-04-12_: Updated Features section for completed Onboarding steps (Preferences, Completion) and expanded Backend API (`/preferences`, `/onboarding`, `/telemetry`). Addressed privacy guarantees open question.
- _2025-04-12_: Pinned backend dependencies, updated frontend dependencies to target PRD versions, added build automation scripts.
- _2025-04-12_: Implemented comprehensive UI modernization with improved design system, dark/light mode support, custom components, and enhanced user experience. Updated onboarding wizard with step indicators, modern form elements, and visual feedback.
- _2025-04-12_: Improved reliability and coverage of tests for the Onboarding Wizard (`app/src/__tests__/OnboardingWizard.test.tsx`), addressing issues with async behavior, timeouts, and mocking.
- _2025-04-12_: Adopted Open WebUI Design and Styling Guidelines for UI consistency (documented in PRD).
- _2025-04-12_: Refactored backend file path handling to use environment variables. Fixed backend async test execution.
- _2025-04-12_: Improved reliability and coverage of tests for the onboarding wizard and backend API.
- _2025-04-10_: Implemented UI modernization with themes, animations, and improved layout for the onboarding wizard.

---

**Update this document as features, requirements, or architecture evolve.**
