#!/bin/bash
set -e

echo "Building frontend..."
cd app
npm run build # Or pnpm build / yarn build
cd ..
echo "Frontend build complete."
