# Simplified single-stage build for Baca & Ucap
# Using @remotion/install-whisper-cpp for Whisper.cpp installation

FROM debian:bookworm-slim

# Install all dependencies (build tools needed by @remotion, runtime dependencies)
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    cmake \
    curl \
    unzip \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash && \
    ln -s /root/.bun/bin/bun /usr/local/bin/bun
ENV PATH="/root/.bun/bin:${PATH}"

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies (includes @remotion/install-whisper-cpp)
RUN bun install --frozen-lockfile

# Copy application source FIRST
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY words/ ./words/

# Run Whisper.cpp setup using @remotion package AFTER copying source
RUN bun backend/setup-whisper-remotion.ts

# Set environment variables (updated format)
ENV PORT=3000
ENV WHISPER_PATH=/app/backend/whisper
ENV WHISPER_MODEL=small
ENV TEMP_DIR=/tmp
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Run the application
CMD ["bun", "backend/server.ts"]
