# Migration Guide: Whisper.cpp Refactoring

This guide helps you migrate from the manual Whisper.cpp installation to the new `@remotion/install-whisper-cpp` based setup.

## What Changed?

### Summary

We've refactored the application to use `@remotion/install-whisper-cpp` instead of manually compiling Whisper.cpp. This simplifies installation, ensures consistent versions, and reduces Docker build time.

### Key Changes

1. **Installation Method**: Now uses `@remotion/install-whisper-cpp` package instead of manual git clone + make
2. **Environment Variables**: Format has changed (see below)
3. **Model Location**: Model files moved from `whisper/models/` to `whisper/` root directory
4. **Dockerfile**: Simplified from multi-stage to single-stage build
5. **Setup Script**: New TypeScript-based setup script

## Migration Steps

### For Docker Users

If you're using Docker, the migration is automatic:

```bash
# Pull the latest code
git pull

# Rebuild the Docker image
docker-compose down
docker-compose build
docker-compose up -d
```

The new Dockerfile will automatically set up Whisper.cpp using the @remotion package.

### For Manual Installations

If you installed manually, follow these steps:

#### 1. Update Dependencies

```bash
# Pull the latest code
git pull

# Install new dependency
bun install
```

This will install `@remotion/install-whisper-cpp`.

#### 2. Remove Old Whisper Installation

```bash
# Backup your current installation (optional)
mv backend/whisper backend/whisper.old

# Or simply remove it
rm -rf backend/whisper
```

#### 3. Run New Setup Script

```bash
# Option A: Use the shell wrapper
./setup-whisper.sh

# Option B: Run TypeScript script directly
bun backend/setup-whisper-remotion.ts
```

This will:
- Download Whisper.cpp v1.5.5
- Download the small model
- Set up the correct directory structure

#### 4. Update Environment Variables (If Using .env)

If you have a `.env` file with custom Whisper paths, update it:

**Before:**
```env
WHISPER_PATH=/app/backend/whisper/main
WHISPER_MODEL=/app/backend/whisper/models/ggml-small.bin
```

**After:**
```env
WHISPER_PATH=/app/backend/whisper
WHISPER_MODEL=small
```

**Changes:**
- `WHISPER_PATH` now points to the **directory** (not the executable)
- `WHISPER_MODEL` is now just the **model name** (not the full path)

#### 5. Verify Installation

```bash
# Start the server
bun --hot backend/server.ts

# Check health endpoint
curl http://localhost:3000/api/health
```

You should see:
```json
{
  "status": "ok",
  "whisper": {
    "directory": "/path/to/backend/whisper",
    "executablePath": "/path/to/backend/whisper/main",
    "executableExists": true,
    "modelName": "small",
    "modelPath": "/path/to/backend/whisper/ggml-small.bin",
    "modelExists": true,
    "configured": true
  },
  ...
}
```

#### 6. Clean Up Old Installation (Optional)

If everything works, remove the backup:

```bash
rm -rf backend/whisper.old
```

## Directory Structure Comparison

### Before
```
backend/whisper/
├── main                  # Whisper executable
├── models/
│   ├── ggml-small.bin   # Model file
│   └── download-ggml-model.sh
├── Makefile
└── ... (many other source files)
```

### After
```
backend/whisper/
├── main                  # Whisper executable
├── ggml-small.bin       # Model file (moved to root)
└── ... (only necessary binaries and files)
```

## Troubleshooting

### "Whisper.cpp not configured" after migration

1. Check that the setup script completed successfully:
   ```bash
   ls -la backend/whisper/
   ```

   You should see:
   - `main` (executable)
   - `ggml-small.bin` (model file)

2. Verify permissions:
   ```bash
   chmod +x backend/whisper/main
   ```

3. Re-run setup if needed:
   ```bash
   rm -rf backend/whisper
   ./setup-whisper.sh
   ```

### Build errors with @remotion package

The @remotion package requires build tools. Make sure you have:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y git build-essential cmake

# macOS
brew install git cmake
# Or install Xcode Command Line Tools:
xcode-select --install
```

### Model download fails

If model download fails (network issues, etc.):

1. Re-run the setup script - it will retry the download
2. Check your internet connection
3. The model file is ~500MB - ensure you have enough disk space

### Old environment variables still in use

If you're using systemd or other process managers, make sure to update the environment variables in your service configuration:

```ini
# /etc/systemd/system/baca-ucap.service
[Service]
Environment=WHISPER_PATH=/var/www/baca-ucap/backend/whisper
Environment=WHISPER_MODEL=small
```

Then reload and restart:
```bash
sudo systemctl daemon-reload
sudo systemctl restart baca-ucap
```

## Rollback (If Needed)

If you encounter issues and need to rollback:

```bash
# Restore old installation
rm -rf backend/whisper
mv backend/whisper.old backend/whisper

# Checkout previous version
git checkout <previous-commit>

# Rebuild if using Docker
docker-compose build
```

## Benefits of New Approach

- ✅ Faster setup (no compilation needed)
- ✅ Consistent Whisper.cpp version across environments
- ✅ Simpler Dockerfile (single-stage build)
- ✅ Easier troubleshooting
- ✅ Better error messages
- ✅ Maintained by Remotion team

## Questions or Issues?

If you encounter any problems during migration, please:
1. Check this guide's Troubleshooting section
2. Review the updated README.md
3. Open an issue on GitHub with details about your setup
