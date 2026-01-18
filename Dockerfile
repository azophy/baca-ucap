# Multi-stage build for Baca & Ucap

# Stage 1: Build Whisper.cpp
FROM debian:bookworm-slim AS whisper-builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Clone and build Whisper.cpp
WORKDIR /tmp/whisper
RUN git clone https://github.com/ggerganov/whisper.cpp . && \
    make

# Download the small model
WORKDIR /tmp/whisper/models
RUN bash download-ggml-model.sh small

# Stage 2: Runtime image
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Create app directory
WORKDIR /app

# Copy Whisper.cpp binary and model from builder stage
COPY --from=whisper-builder /tmp/whisper/main /app/backend/whisper/main
COPY --from=whisper-builder /tmp/whisper/models/ggml-small.bin /app/backend/whisper/models/ggml-small.bin

# Make whisper executable
RUN chmod +x /app/backend/whisper/main

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy application source
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY words/ ./words/

# Set environment variables
ENV PORT=3000
ENV WHISPER_PATH=/app/backend/whisper/main
ENV WHISPER_MODEL=/app/backend/whisper/models/ggml-small.bin
ENV TEMP_DIR=/tmp
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Run the application
CMD ["bun", "backend/server.ts"]
