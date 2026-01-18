import { serve } from "bun";
import { join } from "path";
import { saveToTempFile, validateAudioFile, convertToWav, cleanupTempFiles } from "./audio";
import { transcribeAudio, checkWhisperAvailable } from "./whisper";
import { evaluateTranscription } from "./matching";

const PORT = process.env.PORT || 3000;

const server = serve({
  port: PORT,

  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // API endpoints
    if (path === "/api/transcribe" && req.method === "POST") {
      const tempFiles: string[] = [];

      try {
        // Check if Whisper.cpp is available
        const whisperAvailable = await checkWhisperAvailable();
        if (!whisperAvailable) {
          return new Response(
            JSON.stringify({
              error: "Whisper.cpp not configured. Please set up Whisper.cpp and model files."
            }),
            {
              status: 503,
              headers: { "Content-Type": "application/json" }
            }
          );
        }

        // Parse multipart form data
        const formData = await req.formData();
        const audioFile = formData.get("audio");
        const targetWord = formData.get("targetWord");

        if (!audioFile || !(audioFile instanceof Blob)) {
          return new Response(
            JSON.stringify({ error: "Missing or invalid audio file" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        if (!targetWord || typeof targetWord !== "string") {
          return new Response(
            JSON.stringify({ error: "Missing or invalid targetWord" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Save audio to temporary file
        const audioPath = await saveToTempFile(audioFile, "webm");
        tempFiles.push(audioPath);

        // Validate audio file
        const validation = await validateAudioFile(audioPath);
        if (!validation.valid) {
          return new Response(
            JSON.stringify({ error: validation.error }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Convert to WAV format (required by Whisper.cpp)
        const conversionResult = await convertToWav(audioPath);
        if (!conversionResult.success || !conversionResult.outputPath) {
          return new Response(
            JSON.stringify({ error: conversionResult.error || "Audio conversion failed" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        const wavPath = conversionResult.outputPath;
        tempFiles.push(wavPath);

        // Transcribe audio using Whisper.cpp
        const transcriptionResult = await transcribeAudio(wavPath);
        if (!transcriptionResult.success) {
          return new Response(
            JSON.stringify({ error: transcriptionResult.error || "Transcription failed" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        // Evaluate transcription against target word
        const evaluation = evaluateTranscription(targetWord, transcriptionResult.text);

        // Return result
        return new Response(
          JSON.stringify({
            transcript: evaluation.transcript,
            isCorrect: evaluation.isCorrect
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }
        );
      } catch (error) {
        console.error("Error in /api/transcribe:", error);
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : "Internal server error"
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" }
          }
        );
      } finally {
        // Clean up temporary files
        await cleanupTempFiles(tempFiles);
      }
    }

    // Static file serving
    const publicDir = join(import.meta.dir, "..", "public");
    const frontendDir = join(import.meta.dir, "..", "frontend");
    const wordsDir = join(import.meta.dir, "..", "words");

    // Try to serve from public directory first
    let filePath = join(publicDir, path === "/" ? "index.html" : path);
    let file = Bun.file(filePath);

    if (await file.exists()) {
      return new Response(file);
    }

    // Try to serve from words directory
    filePath = join(wordsDir, path.replace(/^\/words\//, ""));
    file = Bun.file(filePath);

    if (await file.exists()) {
      return new Response(file);
    }

    // Fallback to frontend directory for development
    filePath = join(frontendDir, path === "/" ? "index.html" : path);
    file = Bun.file(filePath);

    if (await file.exists()) {
      return new Response(file);
    }

    // 404 Not Found
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running on http://localhost:${PORT}`);
