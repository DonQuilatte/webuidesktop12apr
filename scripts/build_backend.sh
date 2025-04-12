#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

echo "Building Python backend..."

# Navigate to backend directory
cd backend

# Optional: Create and activate virtual environment
# python3 -m venv .venv
# source .venv/bin/activate

echo "Installing backend dependencies..."
pip install -r requirements.txt

echo "Running PyInstaller..."
# Adjust PyInstaller options as needed (e.g., --onefile, --name)
# Outputting to a common dist directory at the project root
pyinstaller main.py --distpath ../dist --workpath ../build/pyinstaller_backend --specpath . --clean -n backend_app

# Optional: Deactivate virtual environment
# deactivate

cd ..
echo "Backend build complete. Executable in dist/backend_app/"
