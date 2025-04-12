#!/bin/bash
set -e

echo "Building Tauri application..."
cd app
# This assumes the backend executable is already built and Tauri is configured to find it if needed (e.g., via sidecar or manual placement)
# If not using sidecar, ensure the backend executable from build_backend.sh is placed where the final app expects it.
npm run tauri build # Or npx tauri build
cd ..
echo "Tauri build complete. Artifacts in app/src-tauri/target/release/"
