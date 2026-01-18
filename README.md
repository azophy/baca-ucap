# Baca & Ucap

A minimal web-based game to help early readers (ages 4-7) practice reading Indonesian words aloud.

## Features

- 60-second reading game sessions
- Speech recognition using self-hosted Whisper.cpp
- Simple, child-friendly interface
- Mobile-optimized design
- No login or accounts required
- Privacy-focused (no audio storage)

## Tech Stack

- **Runtime**: Bun
- **Backend**: Bun.serve() with native APIs
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Speech-to-Text**: Whisper.cpp (small model)
- **Audio Processing**: ffmpeg

## Prerequisites

### For Docker (Recommended)
- Docker
- Docker Compose (optional)

### For Manual Setup
- Bun (latest version)
- ffmpeg and ffprobe
- git, build-essential, cmake (required by @remotion/install-whisper-cpp)
- Internet connection (for downloading Whisper.cpp binaries and model)

## Setup Instructions

### 1. Install Dependencies

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Install build tools and ffmpeg (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y git build-essential cmake ffmpeg

# Or on macOS
brew install git cmake ffmpeg
# Or install Xcode Command Line Tools:
# xcode-select --install
```

### 2. Install Node Dependencies

```bash
bun install
```

### 3. Set Up Whisper.cpp

**Automated Setup (Recommended)**

We use `@remotion/install-whisper-cpp` to automatically download and install Whisper.cpp:

```bash
./setup-whisper.sh
```

The script will:
- Install Whisper.cpp v1.5.5 using @remotion package
- Download the small model for Indonesian transcription
- Set up the correct directory structure

**Manual Setup Alternative**

```bash
# Run the TypeScript setup script directly
bun backend/setup-whisper-remotion.ts
```

After setup, you should have:
- `backend/whisper/main` (Whisper.cpp executable)
- `backend/whisper/ggml-small.bin` (model file)

### 4. Configure Environment (Optional)

Create a `.env` file in the project root if you need custom paths:

```env
PORT=3000
WHISPER_PATH=/path/to/whisper  # Directory containing Whisper.cpp
WHISPER_MODEL=small             # Model name (small, base, medium, etc.)
TEMP_DIR=/tmp
```

**Note:** Environment variable format has changed:
- `WHISPER_PATH` now points to the directory (not the executable)
- `WHISPER_MODEL` is now just the model name (not the full path)

Bun automatically loads `.env` files.

### 5. Run the Server

```bash
# Development mode with hot reload
bun --hot backend/server.ts

# Or production mode
bun backend/server.ts
```

The server will start on `http://localhost:3000`

## Docker Setup (Recommended)

The easiest way to run the application is using Docker. All dependencies including Whisper.cpp and ffmpeg are automatically installed.

### Prerequisites

- Docker
- Docker Compose (optional, but recommended)

### Quick Start with Docker Compose

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

The application will be available at `http://localhost:3000`

### Using Docker CLI

```bash
# Build the image
docker build -t baca-ucap .

# Run the container
docker run -d \
  --name baca-ucap \
  -p 3000:3000 \
  -v $(pwd)/words:/app/words:ro \
  baca-ucap

# View logs
docker logs -f baca-ucap

# Stop and remove container
docker stop baca-ucap
docker rm baca-ucap
```

### Update Word List

With Docker Compose, you can update the word list without rebuilding:

1. Edit `words/words.csv` on your host machine
2. Restart the container: `docker-compose restart`

The words directory is mounted as a read-only volume.

### Docker Image Details

The Docker image:
- Based on Debian Bookworm Slim
- Includes Bun runtime
- Includes ffmpeg for audio processing
- Includes Whisper.cpp (installed via @remotion/install-whisper-cpp)
- Includes small model for Indonesian transcription
- Total size: ~1.5GB (includes 500MB model file)
- Single-stage build using automated setup

## Project Structure

```
baca-ucap/
├── backend/
│   ├── server.ts           # Main Bun server
│   ├── whisper.ts          # Whisper.cpp wrapper (using @remotion)
│   ├── audio.ts            # Audio processing utilities
│   ├── matching.ts         # Text normalization and matching
│   ├── matching.test.ts    # Tests for matching logic
│   ├── setup-whisper-remotion.ts  # Whisper.cpp setup script
│   └── whisper/            # Whisper.cpp installation (via @remotion)
│       ├── main            # Whisper executable
│       └── ggml-small.bin  # Model file
├── frontend/
│   ├── index.html          # Main game UI
│   ├── styles.css          # Child-friendly styles
│   └── game.js             # Game logic
├── words/
│   └── words.csv           # Indonesian word list
├── public/                 # Static assets (optional)
└── README.md
```

## Testing

```bash
# Run backend tests
bun test backend/matching.test.ts

# Test the server manually
curl -X POST http://localhost:3000/api/transcribe \
  -F "audio=@test.webm" \
  -F "targetWord=buku"
```

## Customizing Word List

Edit `words/words.csv` to add or remove words. One word per line:

```csv
buku
meja
ayam
kucing
```

Keep words simple and appropriate for ages 4-7.

## API Reference

### POST /api/transcribe

Transcribe audio and check against target word.

**Request:**
- Content-Type: `multipart/form-data`
- Fields:
  - `audio`: Audio file (webm, wav, etc.)
  - `targetWord`: Expected word

**Response:**
```json
{
  "transcript": "buku uh",
  "isCorrect": true
}
```

**Error Response:**
```json
{
  "error": "Error message"
}
```

## Deployment

### Docker Deployment (Recommended)

The easiest deployment method is using Docker:

```bash
# On your VPS, clone the repository
git clone <your-repo-url> baca-ucap
cd baca-ucap

# Build and run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f
```

Set up a reverse proxy (see Nginx section below) to handle HTTPS.

### VPS Deployment (Manual)

1. Install prerequisites on VPS (Bun, ffmpeg, build Whisper.cpp)
2. Clone repository
3. Run setup steps above
4. Use systemd or PM2 to manage the process

Example systemd service (`/etc/systemd/system/baca-ucap.service`):

```ini
[Unit]
Description=Baca & Ucap Game Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/baca-ucap
ExecStart=/usr/local/bin/bun backend/server.ts
Restart=always
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable baca-ucap
sudo systemctl start baca-ucap
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Privacy & Safety

- Audio files are processed in memory and immediately deleted
- No audio storage or logging
- No analytics or tracking
- No user accounts
- Safe for children

## Performance Notes

- Whisper.cpp small model is optimized for speed
- Target latency: < 2 seconds per transcription
- Audio is limited to 4 seconds max
- Works well on modest VPS (2GB RAM recommended)

## Troubleshooting

### "Whisper.cpp not configured" error
- Ensure `backend/whisper/main` exists and is executable
- Ensure `backend/whisper/ggml-small.bin` exists (note: model is now in whisper root, not models/ subdirectory)
- Run `./setup-whisper.sh` or `bun backend/setup-whisper-remotion.ts` to set up
- Check file permissions

### Audio recording not working
- Ensure HTTPS (microphone requires secure context)
- Check browser microphone permissions
- Test on supported browser (Chrome, Safari, Firefox)

### Slow transcription
- Consider using Whisper tiny model for faster inference
- Check VPS CPU resources
- Ensure ffmpeg is properly installed

## License

MIT

## Contributing

This is a personal project for educational use. Feel free to fork and adapt for your needs.
