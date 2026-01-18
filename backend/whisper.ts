/**
 * Whisper.cpp integration module
 * Handles audio transcription using self-hosted Whisper.cpp
 */

import { spawn } from "child_process";
import { join } from "path";

// Configuration
const WHISPER_EXECUTABLE = process.env.WHISPER_PATH || join(import.meta.dir, "whisper", "main");
const WHISPER_MODEL = process.env.WHISPER_MODEL || join(import.meta.dir, "whisper", "models", "ggml-small.bin");

export interface TranscriptionResult {
  text: string;
  success: boolean;
  error?: string;
}

/**
 * Transcribe audio file using Whisper.cpp
 * @param audioFilePath Path to the audio file to transcribe
 * @returns Promise with transcription result
 */
export async function transcribeAudio(audioFilePath: string): Promise<TranscriptionResult> {
  return new Promise((resolve) => {
    // Whisper.cpp command:
    // ./main -m models/ggml-small.bin -f audio.wav -l id --no-timestamps
    const args = [
      "-m", WHISPER_MODEL,
      "-f", audioFilePath,
      "-l", "id", // Indonesian language
      "--no-timestamps",
      "-nt" // No translation
    ];

    const whisper = spawn(WHISPER_EXECUTABLE, args);

    let stdout = "";
    let stderr = "";

    whisper.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    whisper.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    whisper.on("close", (code) => {
      if (code !== 0) {
        resolve({
          text: "",
          success: false,
          error: `Whisper.cpp exited with code ${code}: ${stderr}`
        });
        return;
      }

      // Extract transcription from output
      // Whisper.cpp outputs the transcription after several lines of metadata
      // We need to find and extract the actual transcribed text
      const transcription = extractTranscription(stdout);

      if (!transcription) {
        resolve({
          text: "",
          success: false,
          error: "Could not extract transcription from Whisper output"
        });
        return;
      }

      resolve({
        text: transcription,
        success: true
      });
    });

    whisper.on("error", (err) => {
      resolve({
        text: "",
        success: false,
        error: `Failed to spawn Whisper.cpp: ${err.message}`
      });
    });
  });
}

/**
 * Extract the transcription text from Whisper.cpp stdout
 * Whisper.cpp outputs include metadata, we need to extract just the transcribed text
 */
function extractTranscription(output: string): string {
  // Whisper.cpp output format typically includes the transcription after "[BLANK_AUDIO]" or similar markers
  // For simplicity, we'll take lines that don't start with common metadata patterns
  const lines = output.split('\n');

  // Look for lines that appear to be the actual transcription
  // Skip lines with: timestamps, metadata markers, progress indicators
  const transcriptionLines = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    if (trimmed.startsWith('[')) return false; // Skip metadata in brackets
    if (trimmed.match(/^\d+:\d+/)) return false; // Skip timestamps
    if (trimmed.includes('whisper_')) return false; // Skip debug info
    if (trimmed.includes('ggml_')) return false; // Skip model info
    if (trimmed.includes('load time')) return false; // Skip timing info
    if (trimmed.includes('sample time')) return false; // Skip timing info
    return true;
  });

  return transcriptionLines.join(' ').trim();
}

/**
 * Check if Whisper.cpp is available and configured
 */
export async function checkWhisperAvailable(): Promise<boolean> {
  try {
    const execFile = Bun.file(WHISPER_EXECUTABLE);
    const modelFile = Bun.file(WHISPER_MODEL);

    return await execFile.exists() && await modelFile.exists();
  } catch {
    return false;
  }
}
