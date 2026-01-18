import { test, expect, describe } from "bun:test";
import { normalizeText, isMatch, evaluateTranscription } from "./matching";

describe("normalizeText", () => {
  test("converts to lowercase", () => {
    expect(normalizeText("BUKU")).toBe("buku");
    expect(normalizeText("BuKu")).toBe("buku");
  });

  test("trims whitespace", () => {
    expect(normalizeText("  buku  ")).toBe("buku");
    expect(normalizeText("\nbuku\t")).toBe("buku");
  });

  test("removes punctuation", () => {
    expect(normalizeText("buku!")).toBe("buku");
    expect(normalizeText("buku.")).toBe("buku");
    expect(normalizeText("buku,")).toBe("buku");
    expect(normalizeText("buku?")).toBe("buku");
  });

  test("collapses multiple spaces", () => {
    expect(normalizeText("buku   uh")).toBe("buku uh");
    expect(normalizeText("buku  uh  hmm")).toBe("buku uh hmm");
  });

  test("handles complex combinations", () => {
    expect(normalizeText("  BUKU!!  uh...  ")).toBe("buku uh");
  });
});

describe("isMatch", () => {
  test("exact match returns true", () => {
    expect(isMatch("buku", "buku")).toBe(true);
    expect(isMatch("meja", "meja")).toBe(true);
  });

  test("match with filler words returns true", () => {
    expect(isMatch("buku", "buku uh")).toBe(true);
    expect(isMatch("buku", "uh buku")).toBe(true);
    expect(isMatch("buku", "hmm buku ya")).toBe(true);
  });

  test("case insensitive matching", () => {
    expect(isMatch("buku", "BUKU")).toBe(true);
    expect(isMatch("BUKU", "buku")).toBe(true);
    expect(isMatch("BuKu", "BuKu")).toBe(true);
  });

  test("match with punctuation", () => {
    expect(isMatch("buku", "buku!")).toBe(true);
    expect(isMatch("buku", "buku.")).toBe(true);
  });

  test("incorrect word returns false", () => {
    expect(isMatch("buku", "meja")).toBe(false);
    expect(isMatch("buku", "ayam")).toBe(false);
  });

  test("partial word does not match", () => {
    expect(isMatch("buku", "bu")).toBe(false);
    expect(isMatch("buku", "ku")).toBe(false);
  });

  test("substring in longer word matches", () => {
    // This is expected behavior per PRD - contains check
    expect(isMatch("buku", "bukuku")).toBe(true);
  });
});

describe("evaluateTranscription", () => {
  test("returns correct structure for matching transcript", () => {
    const result = evaluateTranscription("buku", "buku uh");
    expect(result).toEqual({
      transcript: "buku uh",
      normalizedTranscript: "buku uh",
      isCorrect: true
    });
  });

  test("returns correct structure for non-matching transcript", () => {
    const result = evaluateTranscription("buku", "meja");
    expect(result).toEqual({
      transcript: "meja",
      normalizedTranscript: "meja",
      isCorrect: false
    });
  });

  test("handles complex transcription", () => {
    const result = evaluateTranscription("kucing", "  KUCING!!!  ya  ");
    expect(result.transcript).toBe("  KUCING!!!  ya  ");
    expect(result.normalizedTranscript).toBe("kucing ya");
    expect(result.isCorrect).toBe(true);
  });
});
