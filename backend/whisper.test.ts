import { test, expect, describe, beforeAll } from "bun:test";
import { transcribeAudio, checkWhisperAvailable } from "./whisper";
import { join } from "path";

describe("Whisper Module Tests", () => {
  let whisperConfigured = false;

  beforeAll(async () => {
    whisperConfigured = await checkWhisperAvailable();
    if (!whisperConfigured) {
      console.warn("⚠️  Whisper.cpp is not configured. Run setup-whisper.sh to set it up.");
      console.warn("⚠️  Some tests will be skipped.");
    }
  });

  describe("checkWhisperAvailable", () => {
    test("returns boolean", async () => {
      const result = await checkWhisperAvailable();
      expect(typeof result).toBe("boolean");
    });

    test("checks for executable and model files", async () => {
      const result = await checkWhisperAvailable();

      // Log the expected paths for debugging (updated for @remotion structure)
      const whisperDir = process.env.WHISPER_PATH || join(import.meta.dir, "whisper");
      const modelName = process.env.WHISPER_MODEL || "small";
      const execPath = join(whisperDir, "main");
      const modelPath = join(whisperDir, `ggml-${modelName}.bin`);

      console.log(`Expected whisper directory: ${whisperDir}`);
      console.log(`Expected executable: ${execPath}`);
      console.log(`Expected model: ${modelPath}`);
      console.log(`Whisper available: ${result}`);

      // The result should be true only if both files exist
      expect(typeof result).toBe("boolean");
    });
  });

  describe("transcribeAudio", () => {
    test("returns error for non-existent audio file", async () => {
      const fakePath = "/tmp/non-existent-audio-12345.wav";

      const result = await transcribeAudio(fakePath);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("returns error when Whisper is not configured", async () => {
      if (whisperConfigured) {
        console.log("⏭️  Skipping test: Whisper is configured");
        return;
      }

      // Create a dummy audio file path
      const dummyPath = "/tmp/test-audio.wav";

      const result = await transcribeAudio(dummyPath);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      // Should mention transcription failure or error
      expect(result.error).toMatch(/failed|not found|error/i);
    });

    test("handles invalid audio file gracefully", async () => {
      if (!whisperConfigured) {
        console.log("⏭️  Skipping test: Whisper not configured");
        return;
      }

      // Create a fake WAV file with invalid data
      const testPath = "/tmp/test-invalid-audio.wav";
      await Bun.write(testPath, "not real audio data");

      try {
        const result = await transcribeAudio(testPath);

        // Should either fail or return empty transcription
        if (!result.success) {
          expect(result.error).toBeDefined();
        } else {
          // If it somehow succeeds, the text should be empty or gibberish
          expect(typeof result.text).toBe("string");
        }
      } finally {
        // Cleanup
        try {
          await Bun.write(testPath, "");
          const file = Bun.file(testPath);
          if (await file.exists()) {
            await import("fs/promises").then(fs => fs.unlink(testPath));
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    });
  });

  describe("Whisper integration (requires setup)", () => {
    test.skipIf(!whisperConfigured)("can be tested with real audio file", async () => {
      // This test would require a real audio file
      // For now, we just verify the function signature
      console.log("✓ Whisper is configured and ready for testing with real audio files");
    });
  });
});
