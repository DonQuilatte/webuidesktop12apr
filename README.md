# Privacy-First Open WebUI Desktop App

Cross-platform, privacy-first, zero-CLI desktop app with Tauri + React frontend and frozen Python backend.

## Monorepo Structure
- `/app`: Tauri + React frontend
- `/backend`: Python backend (PyInstaller frozen)
- `/docs`: Documentation
- `/scripts`: Automation scripts
- `/tests`: Test suites


## Building the Application

To build the full application (backend executable and Tauri app), run the combined build script:

```bash
./scripts/build_all.sh
```

This script will:
1. Ensure all individual build scripts (`build_backend.sh`, `build_frontend.sh`, `build_tauri.sh`) are executable.
2. Clean previous build artifacts.
3. Build the Python backend using PyInstaller (output in `/dist`).
4. Build the Tauri application (output in `app/src-tauri/target/release`).

Refer to the individual scripts in `/scripts` for details on each step.
