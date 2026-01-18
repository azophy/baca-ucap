/**
 * Whisper.cpp integration module
 * Handles audio transcription using @remotion/install-whisper-cpp
 */

import { transcribe } from "@remotion/install-whisper-cpp";
import { join } from "path";

// Configuration
// WHISPER_PATH now points to the directory containing Whisper.cpp binaries
const WHISPER_DIR = process.env.WHISPER_PATH || join(import.meta.dir, "whisper");
// WHISPER_MODEL is now just the model name (e.g., "small", "base", "medium")
const MODEL_NAME = process.env.WHISPER_MODEL || "small";
// WHISPER_VERSION should match the version installed by setup script
const WHISPER_VERSION = process.env.WHISPER_VERSION || "1.5.5";

export interface TranscriptionResult {
  text: string;
  success: boolean;
  error?: string;
}

/**
 * Transcribe audio file using Whisper.cpp via @remotion/install-whisper-cpp
 * @param audioFilePath Path to the audio file to transcribe
 * @returns Promise with transcription result
 */
export async function transcribeAudio(audioFilePath: string): Promise<TranscriptionResult> {
  try {
    // Log debug information
    console.log(`[Whisper] Directory: ${WHISPER_DIR}`);
    console.log(`[Whisper] Version: ${WHISPER_VERSION}`);
    console.log(`[Whisper] Model: ${MODEL_NAME}`);
    console.log(`[Whisper] Audio file: ${audioFilePath}`);

    // Call transcribe() from @remotion/install-whisper-cpp
    const result = await transcribe({
      inputPath: audioFilePath,
      whisperPath: WHISPER_DIR,
      whisperCppVersion: WHISPER_VERSION,
      model: MODEL_NAME,
      language: 'id', // Indonesian language
      tokenLevelTimestamps: false,
    });

    // The transcribe() API returns a structured object with transcription as an array
    // Extract text from each transcription item and join them
    const transcription = result.transcription
      .map(item => item.text)
      .join(' ')
      .trim();

    if (!transcription) {
      console.log(`[Whisper] Warning: Empty transcription received`);
      return {
        text: "",
        success: false,
        error: "Empty transcription received from Whisper.cpp"
      };
    }

    console.log(`[Whisper] Transcription: ${transcription}`);

    return {
      text: transcription,
      success: true
    };
  } catch (error) {
    console.error(`[Whisper] Transcription error:`, error);

    const errorMessage = error instanceof Error
      ? error.message
      : String(error);

    return {
      text: "",
      success: false,
      error: `Whisper.cpp transcription failed: ${errorMessage}`
    };
  }
}

/**
 * Check if Whisper.cpp is available and configured
 */
export async function checkWhisperAvailable(): Promise<boolean> {
  try {
    // Check if whisper directory exists
    const whisperDirExists = await Bun.file(join(WHISPER_DIR, "main")).exists();

    // Check if model file exists (model files are now in the whisper root dir)
    const modelPath = join(WHISPER_DIR, `ggml-${MODEL_NAME}.bin`);
    const modelExists = await Bun.file(modelPath).exists();

    console.log(`[Whisper] Directory check: ${WHISPER_DIR} - ${whisperDirExists ? 'found' : 'not found'}`);
    console.log(`[Whisper] Model check: ${modelPath} - ${modelExists ? 'found' : 'not found'}`);

    return whisperDirExists && modelExists;
  } catch (error) {
    console.error(`[Whisper] Availability check error:`, error);
    return false;
  }
}
