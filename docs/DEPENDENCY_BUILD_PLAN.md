# Dependency Management & Build Automation Plan

This plan outlines the steps to stabilize dependencies and automate the build process for the application.

## Phase 1: Dependency Management

**Goal:** Ensure reproducible builds and align dependencies with PRD targets.

**Tasks:**

1.  **Backend (`backend/requirements.txt`):**
    *   **Action:** Pin versions to ensure stability.
    *   **Proposed `requirements.txt` content:**
        ```
        fastapi==0.111.0
        uvicorn[standard]==0.29.0
        pydantic==2.7.1
        # Testing dependencies
        pytest==8.2.0
        httpx==0.27.0
        pytest-asyncio==0.23.6
        ```
    *   **Implementation Tool:** `write_to_file`

2.  **Frontend (`app/package.json`):**
    *   **Action:** Upgrade dependencies to target PRD versions (React 19, Tailwind 4, TS 5.7).
    *   **Upgrade Steps (During Implementation):**
        *   Update version strings in `app/package.json` for `react`, `react-dom`, `tailwindcss`, `typescript`, and related packages (e.g., `@types/*`, `@testing-library/react`, `@vitejs/plugin-react`, `typescript-eslint`) to target versions compatible with React 19, Tailwind 4, and TS 5.7.
        *   Run package manager install (`pnpm install`, `npm install`, or `yarn install`).
        *   Consult official migration guides for React 19, Tailwind 4, and TypeScript 5.7.
        *   Run type checking (`tsc --noEmit`), linting (`npm run lint`), and tests (`npm test`).
        *   Iteratively fix any errors, type issues, lint violations, or test failures.
    *   **Note:** This upgrade carries risk and requires careful execution and testing.

3.  **Documentation (`docs/DEPENDENCY_MANAGEMENT.md`):**
    *   **Action:** Update to reflect that backend dependencies are pinned and frontend dependencies are targeted for upgrade per the PRD. Mention the upgrade process.
    *   **Implementation Tool:** `apply_diff` or `insert_content`

## Phase 2: Build Automation

**Goal:** Create reliable scripts for building the backend executable and the final Tauri application.

**Tasks:**

1.  **Backend Build Script (`scripts/build_backend.sh`):**
    *   **Action:** Create script using PyInstaller.
    *   **Proposed Content:**
        ```bash
        #!/bin/bash
        set -e
        echo "Building Python backend..."
        cd backend
        # Optional: venv setup
        # python3 -m venv .venv && source .venv/bin/activate
        echo "Installing backend dependencies..."
        pip install -r requirements.txt
        echo "Running PyInstaller..."
        pyinstaller main.py --distpath ../dist --workpath ../build/pyinstaller_backend --specpath . --clean -n backend_app
        # Optional: deactivate
        cd ..
        echo "Backend build complete. Executable in dist/backend_app/"
        ```
    *   **Implementation Tool:** `write_to_file`

2.  **Frontend Build Script (`scripts/build_frontend.sh`):**
    *   **Action:** Create script to run the frontend build.
    *   **Proposed Content:**
        ```bash
        #!/bin/bash
        set -e
        echo "Building frontend..."
        cd app
        npm run build # Or pnpm build / yarn build
        cd ..
        echo "Frontend build complete."
        ```
    *   **Implementation Tool:** `write_to_file`

3.  **Tauri Build Script (`scripts/build_tauri.sh`):**
    *   **Action:** Create script to run the Tauri build.
    *   **Proposed Content:**
        ```bash
        #!/bin/bash
        set -e
        echo "Building Tauri application..."
        cd app
        npm run tauri build # Or npx tauri build
        cd ..
        echo "Tauri build complete. Artifacts in app/src-tauri/target/release/"
        ```
    *   **Implementation Tool:** `write_to_file`

4.  **Combined Build Script (`scripts/build_all.sh`):**
    *   **Action:** Create script orchestrating the individual builds.
    *   **Proposed Content:**
        ```bash
        #!/bin/bash
        set -e
        echo "Starting full application build..."
        chmod +x scripts/build_backend.sh
        chmod +x scripts/build_frontend.sh
        chmod +x scripts/build_tauri.sh
        echo "Cleaning previous build artifacts..."
        rm -rf dist build app/build app/src-tauri/target
        ./scripts/build_backend.sh
        # Frontend build might be implicitly handled by 'tauri build' depending on config
        # ./scripts/build_frontend.sh
        ./scripts/build_tauri.sh
        echo "Full application build finished."
        ```
    *   **Implementation Tool:** `write_to_file`

5.  **Documentation (`README.md` or `BUILDING.md`):**
    *   **Action:** Add instructions on using the build scripts.
    *   **Implementation Tool:** `apply_diff` or `insert_content`