# Product Requirements Document (PRD)

## Product Name (Working Title)

**Baca & Ucap**

## 1. Overview

A minimal web-based game to help early readers (ages 4–7) practice reading Indonesian words aloud. The game presents words visually and asks children to pronounce them. Speech is transcribed using a self-hosted Whisper.cpp (small model) backend and compared against the expected word using forgiving normalization logic. The primary goal is to encourage repetition, confidence, and fun through simple scoring, emojis, animations, and sound effects.

The product is intentionally small in scope, optimized for home use, and designed to run on a VPS using Bun.

---

## 2. Goals & Success Criteria

### Goals

* Help children practice reading Indonesian words aloud
* Encourage confidence and repetition through playful feedback
* Keep the experience extremely simple and distraction-free

### Success Criteria

* Child can complete a 60-second session without adult assistance
* Speech recognition works reasonably well for children’s voices
* Clear visual feedback for correct / incorrect answers
* Game runs smoothly on mobile and tablet browsers

---

## 3. Target Users

* Children aged **4–7 years**
* Early readers (simple words)
* Supervised use, but game should be usable independently

---

## 4. Core Gameplay Loop

1. Game starts (60-second timer begins)
2. A single Indonesian word is shown on screen
3. Child presses a **big record button** and reads the word aloud
4. Audio is recorded in-browser and sent to backend
5. Backend transcribes audio using Whisper.cpp
6. Transcription is normalized and compared with target word
7. Immediate feedback is shown:

   * ✅ Correct → emoji, animation, positive sound
   * ❌ Incorrect → emoji, brief animation, neutral sound
8. Next word appears automatically
9. Loop continues until timer ends
10. Final score is shown

---

## 5. Game Rules

* Session length: **60 seconds**
* Word order: **Random**, no repeats within a session
* Incorrect answers:

  * Show ❌ feedback
  * Automatically move to next word
  * No retries
* Score display during game:

  * "X correct"
  * "Y words remaining"

---

## 6. Content Management

### Word Source

* Words are loaded from a **CSV file**
* CSV format:

  ```
  buku
  meja
  ayam
  ```

### Assumptions

* Words are simple Indonesian words suitable for early readers
* CSV is provided and updated manually by developer/parent

---

## 7. Speech Recognition & Answer Evaluation

### Speech-to-Text

* Backend uses **Whisper.cpp (small model)**
* Self-hosted on VPS

### Normalization Rules (Heavy Normalization)

Applied to both target word and transcription:

* Lowercase
* Trim whitespace
* Remove punctuation
* Collapse multiple spaces

### Matching Logic

* Primary rule: normalized transcription must contain the target word
* Extra filler words are tolerated

Example:

* Target: `buku`
* Transcription: `buku uh` → ✅ Correct

---

## 8. User Interface & UX

### General Principles

* Large text and buttons
* Minimal text on screen
* Bright, friendly visuals
* No reading instructions required

### Key UI Elements

* Large word display (center screen)
* Big record button (tap-friendly)
* Countdown timer
* Score counters
* Feedback animations (emoji-based)

### Audio

* No text-to-speech (TTS)
* Simple sound effects for feedback only

---

## 9. Persistence

* No login or accounts
* Use **localStorage** only
* Stored data:

  * Last score
  * Best score (optional)

---

## 10. Technical Architecture

### Frontend

* Web-based (HTML + JS or minimal framework)
* Responsive design (mobile-first)
* Browser audio recording via Web Audio / MediaRecorder API

### Backend

* Bun runtime
* HTTP API for:

  * Receiving audio blobs
  * Running Whisper.cpp inference
  * Returning transcription

### Deployment

* VPS-hosted
* Single service deployment
* No external APIs required

---

## 11. Privacy & Safety

* Audio is **not stored**
* Audio used only for immediate transcription
* No analytics
* No tracking
* Child-safe by default

---

## 12. Non-Goals (Out of Scope for MVP)

* User accounts or login
* Multiple difficulty levels
* Parent dashboard
* Progress analytics per word
* Leaderboards or social features
* Cloud STT APIs

---

## 13. Future Ideas (Explicitly Not in MVP)

* Difficulty tiers
* Syllable-level feedback
* Parent-configurable word sets via UI
* Offline mode
* Multiple child profiles

---

## 14. Open Questions (Post-MVP)

* How forgiving should matching be for very unclear pronunciation?
* Should whisper model be swapped or fine-tuned later?
* Should sound effects be configurable (on/off)?

---

## 15. Definition of Done (MVP)

* 60-second playable reading game
* CSV-driven word list
* Whisper.cpp transcription working end-to-end
* Clear visual feedback
* Runs reliably on mobile browser
* Deployed on VPS using Bun

