/**
 * Audio file handling module
 * Manages temporary audio files, validation, and format conversion
 */

import { join } from "path";
import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { unlink } from "fs/promises";

// Configuration
const TEMP_DIR = process.env.TEMP_DIR || "/tmp";
const MAX_DURATION_SECONDS = 4;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export interface AudioValidationResult {
  valid: boolean;
  error?: string;
  duration?: number;
  size?: number;
}

export interface AudioConversionResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

/**
 * Save audio blob to temporary file
 * @param audioData Audio file data
 * @param extension File extension (e.g., 'webm', 'wav')
 * @returns Path to saved temporary file
 */
export async function saveToTempFile(audioData: Blob | ArrayBuffer, extension: string): Promise<string> {
  const filename = `audio_${randomUUID()}.${extension}`;
  const filepath = join(TEMP_DIR, filename);

  // Convert to ArrayBuffer if needed
  const buffer = audioData instanceof Blob
    ? await audioData.arrayBuffer()
    : audioData;

  await Bun.write(filepath, buffer);
  return filepath;
}

/**
 * Validate audio file (size and duration)
 * @param filepath Path to audio file
 * @returns Validation result
 */
export async function validateAudioFile(filepath: string): Promise<AudioValidationResult> {
  try {
    const file = Bun.file(filepath);
    const size = file.size;

    // Check file size
    if (size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `File too large: ${(size / 1024 / 1024).toFixed(2)}MB (max ${MAX_FILE_SIZE_MB}MB)`,
        size
      };
    }

    // Check duration using ffprobe
    const duration = await getAudioDuration(filepath);

    if (duration > MAX_DURATION_SECONDS) {
      return {
        valid: false,
        error: `Audio too long: ${duration.toFixed(1)}s (max ${MAX_DURATION_SECONDS}s)`,
        duration,
        size
      };
    }

    return {
      valid: true,
      duration,
      size
    };
  } catch (error) {
    return {
      valid: false,
      error: `Validation failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Get audio duration using ffprobe
 * @param filepath Path to audio file
 * @returns Duration in seconds
 */
function getAudioDuration(filepath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      filepath
    ]);

    let output = "";

    ffprobe.stdout.on("data", (data) => {
      output += data.toString();
    });

    ffprobe.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe exited with code ${code}`));
        return;
      }

      const duration = parseFloat(output.trim());
      if (isNaN(duration)) {
        reject(new Error("Could not parse duration"));
        return;
      }

      resolve(duration);
    });

    ffprobe.on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * Convert audio to WAV format (required by Whisper.cpp)
 * @param inputPath Path to input audio file
 * @returns Conversion result with output path
 */
export async function convertToWav(inputPath: string): Promise<AudioConversionResult> {
  const outputPath = inputPath.replace(/\.[^.]+$/, '.wav');

  return new Promise((resolve) => {
    // ffmpeg command to convert to WAV format suitable for Whisper.cpp:
    // 16kHz, mono, 16-bit PCM
    const ffmpeg = spawn("ffmpeg", [
      "-i", inputPath,
      "-ar", "16000",      // 16kHz sample rate
      "-ac", "1",          // Mono
      "-c:a", "pcm_s16le", // 16-bit PCM
      "-y",                // Overwrite output file
      outputPath
    ]);

    let stderr = "";

    ffmpeg.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    ffmpeg.on("close", (code) => {
      if (code !== 0) {
        resolve({
          success: false,
          error: `ffmpeg exited with code ${code}: ${stderr}`
        });
        return;
      }

      resolve({
        success: true,
        outputPath
      });
    });

    ffmpeg.on("error", (err) => {
      resolve({
        success: false,
        error: `Failed to spawn ffmpeg: ${err.message}`
      });
    });
  });
}

/**
 * Clean up temporary file
 * @param filepath Path to file to delete
 */
export async function cleanupTempFile(filepath: string): Promise<void> {
  try {
    await unlink(filepath);
  } catch (error) {
    console.error(`Failed to cleanup temp file ${filepath}:`, error);
  }
}

/**
 * Clean up multiple temporary files
 * @param filepaths Array of file paths to delete
 */
export async function cleanupTempFiles(filepaths: string[]): Promise<void> {
  await Promise.all(filepaths.map(fp => cleanupTempFile(fp)));
}
