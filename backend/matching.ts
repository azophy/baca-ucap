/**
 * Normalization and matching logic for speech-to-text comparison
 * Following PRD requirements for heavy normalization
 */

/**
 * Normalize text according to PRD rules:
 * - Lowercase
 * - Trim whitespace
 * - Remove punctuation
 * - Collapse multiple spaces
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Collapse multiple spaces to single space
}

/**
 * Check if the transcribed text matches the target word
 * Primary rule: normalized transcription must contain the target word
 * Extra filler words are tolerated
 *
 * @param targetWord The expected word to read
 * @param transcript The transcribed speech
 * @returns true if the transcript contains the target word
 */
export function isMatch(targetWord: string, transcript: string): boolean {
  const normalizedTarget = normalizeText(targetWord);
  const normalizedTranscript = normalizeText(transcript);

  return normalizedTranscript.includes(normalizedTarget);
}

/**
 * Evaluate a transcription against a target word
 * Returns detailed information about the match
 */
export function evaluateTranscription(targetWord: string, transcript: string) {
  const normalizedTarget = normalizeText(targetWord);
  const normalizedTranscript = normalizeText(transcript);
  const isCorrect = normalizedTranscript.includes(normalizedTarget);

  return {
    transcript,
    normalizedTranscript,
    isCorrect
  };
}
