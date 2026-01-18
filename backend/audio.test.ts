import { test, expect, describe, afterEach } from "bun:test";
import { saveToTempFile, validateAudioFile, convertToWav, cleanupTempFile, cleanupTempFiles } from "./audio";
import { join } from "path";
import { existsSync } from "fs";

const TEMP_DIR = process.env.TEMP_DIR || "/tmp";
const testFiles: string[] = [];

// Cleanup test files after each test
afterEach(async () => {
  await cleanupTempFiles(testFiles);
  testFiles.length = 0;
});

describe("Audio Module Tests", () => {
  describe("saveToTempFile", () => {
    test("saves blob to temporary file", async () => {
      const testData = new Blob(["test audio data"], { type: "audio/webm" });
      const filepath = await saveToTempFile(testData, "webm");
      testFiles.push(filepath);

      expect(filepath).toContain(TEMP_DIR);
      expect(filepath).toMatch(/\.webm$/);

      const file = Bun.file(filepath);
      expect(await file.exists()).toBe(true);
    });

    test("saves ArrayBuffer to temporary file", async () => {
      const testData = new TextEncoder().encode("test audio data");
      const filepath = await saveToTempFile(testData.buffer, "wav");
      testFiles.push(filepath);

      expect(filepath).toContain(TEMP_DIR);
      expect(filepath).toMatch(/\.wav$/);

      const file = Bun.file(filepath);
      expect(await file.exists()).toBe(true);
    });

    test("generates unique filenames", async () => {
      const testData = new Blob(["test data"]);
      const filepath1 = await saveToTempFile(testData, "webm");
      const filepath2 = await saveToTempFile(testData, "webm");
      testFiles.push(filepath1, filepath2);

      expect(filepath1).not.toBe(filepath2);
    });
  });

  describe("cleanupTempFile", () => {
    test("removes temporary file", async () => {
      const testData = new Blob(["test data"]);
      const filepath = await saveToTempFile(testData, "webm");

      expect(await Bun.file(filepath).exists()).toBe(true);

      await cleanupTempFile(filepath);

      expect(await Bun.file(filepath).exists()).toBe(false);
    });

    test("handles non-existent file gracefully", async () => {
      const fakePath = join(TEMP_DIR, "non-existent-file-12345.webm");
      // Should not throw, just log error
      await cleanupTempFile(fakePath);
      // If we get here without throwing, test passes
      expect(true).toBe(true);
    });
  });

  describe("cleanupTempFiles", () => {
    test("removes multiple files", async () => {
      const testData = new Blob(["test data"]);
      const files = [
        await saveToTempFile(testData, "webm"),
        await saveToTempFile(testData, "wav"),
        await saveToTempFile(testData, "mp3")
      ];

      for (const file of files) {
        expect(await Bun.file(file).exists()).toBe(true);
      }

      await cleanupTempFiles(files);

      for (const file of files) {
        expect(await Bun.file(file).exists()).toBe(false);
      }
    });
  });

  describe("validateAudioFile", () => {
    test("validates file size limit", async () => {
      // Create a file larger than 5MB
      const largeData = new Uint8Array(6 * 1024 * 1024); // 6MB
      const filepath = await saveToTempFile(largeData.buffer, "webm");
      testFiles.push(filepath);

      const result = await validateAudioFile(filepath);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("too large");
    });

    test("returns error for non-existent file", async () => {
      const fakePath = join(TEMP_DIR, "non-existent-audio-12345.webm");

      const result = await validateAudioFile(fakePath);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("convertToWav", () => {
    test("returns error for non-existent file", async () => {
      const fakePath = join(TEMP_DIR, "non-existent-audio-12345.webm");

      const result = await convertToWav(fakePath);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("returns error for invalid audio file", async () => {
      // Create a fake audio file with invalid data
      const testData = new Blob(["not real audio data"]);
      const filepath = await saveToTempFile(testData, "webm");
      testFiles.push(filepath);

      const result = await convertToWav(filepath);

      // Should fail because it's not valid audio
      expect(result.success).toBe(false);
      if (result.outputPath) {
        testFiles.push(result.outputPath);
      }
    });
  });
});
