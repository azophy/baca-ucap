# Step-by-Step Implementation Plan

**Project: Baca & Ucap (MVP)**

---

## Phase 0 — High-Level Architecture Decisions (Before Coding)

### 0.1 Decide Repo Structure (Single Repo, Two Concerns)

Keep it simple:

```
baca-ucap/
├─ backend/
│  ├─ server.ts
│  ├─ whisper/
│  │  ├─ whisper.cpp (submodule or binary)
│  │  └─ models/
│  └─ audio/
├─ frontend/
│  ├─ index.html
│  ├─ styles.css
│  ├─ game.js
│  └─ audio.js
├─ words/
│  └─ words.csv
├─ public/ (built frontend assets)
└─ README.md
```

**Rationale**

* One service
* Frontend served statically by Bun backend
* Whisper.cpp treated as a local dependency

---

### 0.2 Decide Data Flow (Critical)

**Flow**

```
Browser (MediaRecorder)
  → POST /transcribe (audio/webm)
    → Whisper.cpp inference
      → text result
        → normalization + match
          → JSON response
```

**Response payload**

```json
{
  "transcript": "buku uh",
  "normalizedTranscript": "buku uh",
  "isCorrect": true
}
```

---

## Phase 1 — Backend Foundation (Bun + Whisper.cpp)

### 1.1 Set Up Bun Backend

**Tasks**

* Initialize Bun project
* Add basic HTTP server
* Enable static file serving

**Key decisions**

* No framework (or minimal like Hono) to reduce overhead
* One POST endpoint: `/api/transcribe`

---

### 1.2 Integrate Whisper.cpp

**Tasks**

1. Build Whisper.cpp binary on VPS

   * Use **small model**
   * Confirm it runs via CLI
2. Store model in `backend/whisper/models/`
3. Create a wrapper function:

   * Accept audio file path
   * Execute Whisper.cpp via `spawn`
   * Capture stdout
   * Extract transcription text

**Important Constraints**

* Audio files are **temporary**
* Delete immediately after transcription
* Single request at a time is OK (MVP)

---

### 1.3 Audio Format Handling

**Tasks**

* Accept `audio/webm` or `audio/wav`
* Convert if necessary (ffmpeg)
* Enforce:

  * Max duration (e.g., 3–4 seconds)
  * Max file size

**Why**

* Protect VPS
* Keep inference fast for kids

---

### 1.4 Normalization & Matching Logic

Implement **exact PRD logic**, nothing more.

**Normalization function**

* lowercase
* trim
* remove punctuation
* collapse whitespace

**Matching rule**

```ts
normalizedTranscript.includes(normalizedTargetWord)
```

No Levenshtein, no phonetics (future only).

---

### 1.5 Backend API Contract (Lock This Early)

**POST /api/transcribe**

* Input: `multipart/form-data`

  * `audio`
  * `targetWord`
* Output:

```json
{
  "transcript": "buku uh",
  "isCorrect": true
}
```

---

## Phase 2 — Word Content System (CSV)

### 2.1 CSV Loader

**Tasks**

* Load CSV on server startup OR frontend load
* Parse into array of strings
* Filter empty lines

**Decision**

* Load CSV **frontend-side**
* Backend does NOT need to know word list

**Why**

* Simpler
* No extra API
* Easy parent editing

---

### 2.2 Randomization Logic

**Tasks**

* Shuffle words at game start
* Track index
* Ensure no repeats in session
* Stop when timer ends or words exhausted

---

## Phase 3 — Frontend Core Game Loop

### 3.1 UI Skeleton (Static First)

Build **non-interactive UI first**.

**Elements**

* Big word display (center)
* Big circular record button
* Timer (top)
* Score (correct / remaining)
* Emoji feedback layer (hidden initially)

Test visually on mobile early.

---

### 3.2 Game State Model

Define a single JS state object:

```js
state = {
  timeLeft: 60,
  score: 0,
  currentWord: "",
  remainingWords: [],
  isRecording: false,
  gameActive: false
}
```

Keep logic **explicit**, not clever.

---

### 3.3 Timer Logic

**Tasks**

* Start timer on game start
* Decrement every second
* End game at 0
* Disable record button when ended

No pause, no resume.

---

### 3.4 Audio Recording (Browser)

**Tasks**

* Use `navigator.mediaDevices.getUserMedia`
* Use `MediaRecorder`
* Start recording on button press
* Stop automatically after:

  * Button release OR
  * Fixed duration (e.g. 2.5 seconds)

**UX Rule**

* One tap = one recording
* No holding required if possible

---

### 3.5 Sending Audio to Backend

**Tasks**

* Convert Blob → FormData
* Include `targetWord`
* POST to `/api/transcribe`
* Show loading animation (spinner or thinking emoji)

---

## Phase 4 — Feedback & Flow

### 4.1 Immediate Feedback

**Correct**

* ✅ emoji
* Small bounce animation
* Positive sound

**Incorrect**

* ❌ emoji
* Neutral animation
* Neutral sound

**Rules**

* Show feedback ≤ 1 second
* Automatically move to next word
* No retry

---

### 4.2 Score & Progress Updates

**During game**

* Correct count
* Remaining words count

**End of game**

* Final score screen
* Simple celebratory message
* Optional “Play again” button

---

## Phase 5 — Persistence (localStorage)

### 5.1 Storage Keys

```js
lastScore
bestScore
```

**Tasks**

* Save score at end
* Load on page start
* Display subtly (not distracting)

---

## Phase 6 — Polish for Children (Very Important)

### 6.1 Visual Tuning

* Large fonts (≥48px for word)
* High contrast
* Friendly colors
* Avoid text-heavy UI

---

### 6.2 Audio UX

* Gentle sounds
* No loud effects
* No spoken instructions

---

### 6.3 Error Handling (Invisible to Child)

* Mic permission denied → simple icon + retry
* STT failure → treat as ❌ and continue
* No error text

---

## Phase 7 — Deployment (VPS)

### 7.1 VPS Setup

**Tasks**

* Install Bun
* Install ffmpeg
* Build Whisper.cpp
* Place model files

---

### 7.2 Production Run

* Single Bun process
* Serve frontend + API
* Optionally use systemd

---

### 7.3 Final Checks

* Mobile browser test (Android & iOS)
* Slow network simulation
* Child voice test (realistic)

---

## Phase 8 — Definition of Done Validation

Checklist:

* ✅ 60-second session works end-to-end
* ✅ CSV words load correctly
* ✅ Whisper.cpp transcribes child speech
* ✅ Feedback is instant and friendly
* ✅ No audio stored
* ✅ Runs reliably on mobile browser

---

## Suggested Implementation Order (Day-by-Day)

**Day 1**

* Backend + Whisper.cpp working via curl
* CSV loader
* Matching logic tested

**Day 2**

* Frontend UI + timer
* Audio recording
* API integration

**Day 3**

* Feedback animations
* Sounds
* Mobile polish
* Deployment

