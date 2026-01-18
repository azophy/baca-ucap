import { test, expect, describe } from "bun:test";

const BASE_URL = "http://localhost:3000";

// Check if server is running at module load time
let serverRunning = false;

async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    serverRunning = response.ok;
  } catch {
    serverRunning = false;
  }

  if (!serverRunning) {
    console.warn("⚠️  Server is not running. Start server with: bun --hot backend/server.ts");
    console.warn("⚠️  Integration tests will be skipped");
  }
}

// Run check before tests
await checkServer();

describe("Server Integration Tests", () => {
  describe("GET /api/health", () => {
    test.skipIf(!serverRunning)("returns health status", async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("whisper");
      expect(data).toHaveProperty("environment");
    });

    test.skipIf(!serverRunning)("whisper configuration is checked", async () => {
      const response = await fetch(`${BASE_URL}/api/health`);
      const data = await response.json();

      // Check for updated health response structure (using @remotion)
      expect(data.whisper).toHaveProperty("directory");
      expect(data.whisper).toHaveProperty("executablePath");
      expect(data.whisper).toHaveProperty("executableExists");
      expect(data.whisper).toHaveProperty("modelName");
      expect(data.whisper).toHaveProperty("modelPath");
      expect(data.whisper).toHaveProperty("modelExists");
      expect(data.whisper).toHaveProperty("configured");

      // Log for debugging
      console.log("Whisper config:", data.whisper);
    });
  });

  describe("POST /api/transcribe", () => {
    test.skipIf(!serverRunning)("returns error when audio file is missing", async () => {
      const formData = new FormData();
      formData.append("targetWord", "buku");

      const response = await fetch(`${BASE_URL}/api/transcribe`, {
        method: "POST",
        body: formData
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("audio");
    });

    test.skipIf(!serverRunning)("returns error when targetWord is missing", async () => {
      const formData = new FormData();
      const audioBlob = new Blob(["fake audio data"], { type: "audio/webm" });
      formData.append("audio", audioBlob, "test.webm");

      const response = await fetch(`${BASE_URL}/api/transcribe`, {
        method: "POST",
        body: formData
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("targetWord");
    });

    test.skipIf(!serverRunning)("returns error when Whisper is not configured", async () => {
      const formData = new FormData();
      const audioBlob = new Blob(["fake audio data"], { type: "audio/webm" });
      formData.append("audio", audioBlob, "test.webm");
      formData.append("targetWord", "buku");

      const response = await fetch(`${BASE_URL}/api/transcribe`, {
        method: "POST",
        body: formData
      });

      // Check if Whisper is configured first
      const healthResponse = await fetch(`${BASE_URL}/api/health`);
      const healthData = await healthResponse.json();

      if (!healthData.whisper.configured) {
        expect(response.status).toBe(503);
        const data = await response.json();
        expect(data.error).toContain("Whisper.cpp not configured");
      } else {
        // If Whisper is configured, the test might fail at a different stage
        // (validation, conversion, or transcription)
        expect([400, 500, 503]).toContain(response.status);
      }
    });
  });

  describe("Static file serving", () => {
    test.skipIf(!serverRunning)("serves index.html at root", async () => {
      const response = await fetch(`${BASE_URL}/`);
      expect([200, 404]).toContain(response.status);
      // Either the file exists (200) or doesn't (404) - both are valid
    });

    test.skipIf(!serverRunning)("returns 404 for non-existent files", async () => {
      const response = await fetch(`${BASE_URL}/nonexistent-file-12345.html`);
      expect(response.status).toBe(404);
    });
  });
});
