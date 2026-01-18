# Docker Quick Reference

## Quick Start

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

Access the app at: http://localhost:3000

## Common Commands

### Build and Run

```bash
# Build the image
docker-compose build

# Start in detached mode
docker-compose up -d

# Start with build
docker-compose up -d --build

# View logs
docker-compose logs -f app

# Stop containers
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Maintenance

```bash
# Restart the application
docker-compose restart

# Update word list (no rebuild needed)
# 1. Edit words/words.csv
# 2. Run:
docker-compose restart

# Access container shell
docker-compose exec app bash

# View container status
docker-compose ps

# Check resource usage
docker stats baca-ucap
```

### Troubleshooting

```bash
# View detailed logs
docker-compose logs -f --tail=100

# Test Whisper.cpp inside container
docker-compose exec app /app/backend/whisper/main --help

# Check if model exists
docker-compose exec app ls -lh /app/backend/whisper/models/

# Test API endpoint
curl -X POST http://localhost:3000/api/transcribe \
  -F "audio=@test.webm" \
  -F "targetWord=buku"
```

### Using Docker CLI (without Compose)

```bash
# Build
docker build -t baca-ucap .

# Run
docker run -d \
  --name baca-ucap \
  -p 3000:3000 \
  -v $(pwd)/words:/app/words:ro \
  --restart unless-stopped \
  baca-ucap

# Stop
docker stop baca-ucap

# Remove
docker rm baca-ucap

# View logs
docker logs -f baca-ucap
```

## Production Deployment

### 1. Clone repository on VPS

```bash
git clone <your-repo> baca-ucap
cd baca-ucap
```

### 2. Configure environment (optional)

Create `.env` file if needed:

```env
PORT=3000
NODE_ENV=production
```

### 3. Start with Docker Compose

```bash
docker-compose up -d
```

### 4. Set up Nginx reverse proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Required for large audio uploads
        client_max_body_size 10M;
    }
}
```

### 5. Enable HTTPS with Certbot

```bash
sudo certbot --nginx -d your-domain.com
```

## Image Information

- **Base Image**: debian:bookworm-slim
- **Runtime**: Bun (latest)
- **Dependencies**: ffmpeg, Whisper.cpp, ggml-small.bin model
- **Size**: ~1.5GB (includes 500MB model file)
- **Build Time**: ~5-10 minutes (first build, includes Whisper.cpp compilation)

## Health Check

The container includes a health check that runs every 30 seconds:

```bash
# View health status
docker inspect baca-ucap | grep -A 10 Health
```

## Updates

### Update application code

```bash
git pull
docker-compose down
docker-compose up -d --build
```

### Update word list only

```bash
# Edit words/words.csv
docker-compose restart
```

No rebuild needed as words directory is mounted as volume.

## Cleanup

```bash
# Remove stopped containers
docker-compose down

# Remove images
docker rmi baca-ucap

# Remove all unused Docker resources
docker system prune -a
```

## Performance Tips

- First transcription may be slower as model loads into memory
- Subsequent transcriptions are faster
- Monitor container resources with `docker stats`
- For production, ensure VPS has at least 2GB RAM
- Consider using Whisper tiny model for faster inference (trade-off: lower accuracy)
