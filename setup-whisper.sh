#!/bin/bash
# Wrapper script for Whisper.cpp setup using @remotion/install-whisper-cpp
# This script delegates to the TypeScript setup script

set -e  # Exit on error

echo "========================================="
echo "Baca & Ucap - Whisper.cpp Setup"
echo "Using @remotion/install-whisper-cpp"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "backend/server.ts" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "Error: Bun is not installed"
    echo ""
    echo "Please install Bun first:"
    echo "  curl -fsSL https://bun.sh/install | bash"
    echo ""
    exit 1
fi

echo "Bun found: $(bun --version)"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    bun install
    echo ""
fi

# Run the TypeScript setup script
echo "Running Whisper.cpp setup script..."
echo ""
bun backend/setup-whisper-remotion.ts
