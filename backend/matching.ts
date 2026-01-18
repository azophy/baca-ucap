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
 * Also checks space-removed version to handle cases like "ik an" matching "ikan"
 *
 * @param targetWord The expected word to read
 * @param transcript The transcribed speech
 * @returns true if the transcript contains the target word
 */
export function isMatch(targetWord: string, transcript: string): boolean {
  const normalizedTarget = normalizeText(targetWord);
  const normalizedTranscript = normalizeText(transcript);

  // Check if transcript contains the target word as-is
  if (normalizedTranscript.includes(normalizedTarget)) {
    return true;
  }

  // Also check with spaces removed to handle speech recognition issues
  // e.g., "ik an" should match "ikan"
  const targetNoSpaces = normalizedTarget.replace(/\s+/g, '');
  const transcriptNoSpaces = normalizedTranscript.replace(/\s+/g, '');

  return transcriptNoSpaces.includes(targetNoSpaces);
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
