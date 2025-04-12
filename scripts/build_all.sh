#!/bin/bash
set -e

echo "Starting full application build..."

# Ensure scripts are executable
chmod +x scripts/build_backend.sh
chmod +x scripts/build_frontend.sh
chmod +x scripts/build_tauri.sh

# Clean previous builds (optional)
echo "Cleaning previous build artifacts..."
rm -rf dist
rm -rf build
rm -rf app/build
rm -rf app/src-tauri/target

# Run builds in order
./scripts/build_backend.sh
# Frontend build might be implicitly handled by 'tauri build' depending on config
# ./scripts/build_frontend.sh
./scripts/build_tauri.sh

echo "Full application build finished."
