# Project Rules & Coding Standards

## General Principles
- **Privacy-first:** All user data must remain local unless explicitly required and documented.
- **Zero-CLI:** The end-user experience must not require command-line interaction.
- **Cross-platform:** All features must work on Windows, macOS, and Linux.

## Code Quality
- **Type Safety:** Use TypeScript for all frontend code. Use type hints in Python backend.
- **Linting:** All code must pass ESLint (frontend) and follow PEP8 (backend).
- **Testing:** All new features and bugfixes must include tests (to be placed in `/tests`).

## Frontend (React + Tauri)
- Use functional components and React hooks.
- Use Tailwind CSS for all styling.
- Keep UI logic and business logic separated.
- Use Tauri APIs for native integration; do not use Node.js APIs directly.

## Backend (Python + FastAPI)
- Use FastAPI for all HTTP APIs.
- All endpoints must include proper error handling and validation.
- Use async functions for I/O-bound operations.
- Document all endpoints with OpenAPI (FastAPI auto-generates docs).

## Documentation
- All new features must be documented in the PRD and relevant markdown files in `/docs`.
- Update dependency files (`package.json`, `requirements.txt`) as changes are made.
- Keep this rules file up to date as standards evolve.
- **Continuous Planning:** After completing any task, always check the current plan (e.g., NEXT_STEPS_EXECUTION_PLAN.md) and proactively suggest the next actionable step to maintain project momentum.

## Contribution
- All contributions must be made via pull requests.
- PRs must reference related issues or feature requests.
- Code reviews are required before merging.
