#!/bin/bash
# Setup script for Whisper.cpp integration

set -e  # Exit on error

echo "========================================="
echo "Baca & Ucap - Whisper.cpp Setup"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "backend/server.ts" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Detect OS for installation instructions
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/debian_version ]; then
            echo "debian"
        elif [ -f /etc/redhat-release ]; then
            echo "redhat"
        else
            echo "linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    else
        echo "unknown"
    fi
}

OS=$(detect_os)

# Check for required tools
echo "Checking prerequisites..."

MISSING_TOOLS=()

if ! command -v git &> /dev/null; then
    MISSING_TOOLS+=("git")
fi

if ! command -v make &> /dev/null; then
    MISSING_TOOLS+=("make")
fi

if ! command -v gcc &> /dev/null && ! command -v clang &> /dev/null; then
    MISSING_TOOLS+=("gcc/clang")
fi

if ! command -v cmake &> /dev/null; then
    MISSING_TOOLS+=("cmake")
fi

if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
    echo "Error: Missing required tools: ${MISSING_TOOLS[*]}"
    echo ""
    echo "Please install the missing tools:"
    echo ""

    case $OS in
        "debian")
            echo "  sudo apt-get update"
            echo "  sudo apt-get install -y git build-essential cmake"
            ;;
        "redhat")
            echo "  sudo yum groupinstall 'Development Tools'"
            echo "  sudo yum install -y git cmake"
            ;;
        "macos")
            echo "  brew install git cmake"
            echo ""
            echo "  Or install Xcode Command Line Tools:"
            echo "  xcode-select --install"
            ;;
        *)
            echo "  Install: git, make, gcc (or clang), and cmake"
            ;;
    esac

    exit 1
fi

echo "Prerequisites OK"
echo ""

# Create whisper directory
WHISPER_DIR="backend/whisper"

if [ -d "$WHISPER_DIR" ]; then
    echo "Whisper directory already exists."
    read -p "Do you want to remove and reinstall? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Removing existing whisper directory..."
        rm -rf "$WHISPER_DIR"
    else
        echo "Keeping existing installation. Exiting."
        exit 0
    fi
fi

echo "Cloning Whisper.cpp repository..."
cd backend
git clone https://github.com/ggerganov/whisper.cpp whisper
cd whisper

echo ""
echo "Building Whisper.cpp..."
make

if [ ! -f "main" ]; then
    echo "Error: Build failed. 'main' executable not found."
    exit 1
fi

echo ""
echo "Build successful!"
echo ""

# Download model
echo "Downloading Whisper small model..."
echo "This may take a few minutes..."
cd models

if [ ! -f "download-ggml-model.sh" ]; then
    echo "Error: download-ggml-model.sh not found"
    exit 1
fi

bash download-ggml-model.sh small

if [ ! -f "ggml-small.bin" ]; then
    echo "Error: Model download failed. ggml-small.bin not found."
    exit 1
fi

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Whisper.cpp has been installed at: backend/whisper/"
echo "Model file: backend/whisper/models/ggml-small.bin"
echo ""
echo "You can now start the server with:"
echo "  bun --hot backend/server.ts"
echo ""
echo "To test Whisper.cpp directly:"
echo "  cd backend/whisper"
echo "  ./main -m models/ggml-small.bin -f /path/to/audio.wav -l id"
echo ""
