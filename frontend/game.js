/**
 * Baca & Ucap - Main Game Logic
 */

// Game State
const state = {
  timeLeft: 60,
  score: 0,
  currentWord: "",
  words: [],
  currentWordIndex: 0,
  isRecording: false,
  gameActive: false,
  mediaRecorder: null,
  audioStream: null
};

// DOM Elements
const elements = {
  timeLeft: document.getElementById('time-left'),
  scoreCorrect: document.getElementById('score-correct'),
  wordsRemaining: document.getElementById('words-remaining'),
  currentWord: document.getElementById('current-word'),
  recordBtn: document.getElementById('record-btn'),
  startBtn: document.getElementById('start-btn'),
  instructions: document.getElementById('instructions'),
  feedback: document.getElementById('feedback'),
  feedbackEmoji: document.getElementById('feedback-emoji'),
  loading: document.getElementById('loading'),
  endScreen: document.getElementById('end-screen'),
  finalScore: document.getElementById('final-score'),
  playAgainBtn: document.getElementById('play-again-btn')
};

// Constants
const GAME_DURATION = 60; // seconds
const CSV_PATH = '/words/words.csv';
const API_ENDPOINT = '/api/transcribe';

/**
 * Load words from CSV file
 */
async function loadWords() {
  try {
    const response = await fetch(CSV_PATH);
    const text = await response.text();
    const words = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    return words;
  } catch (error) {
    console.error('Failed to load words:', error);
    alert('Gagal memuat kata-kata. Silakan refresh halaman.');
    return [];
  }
}

/**
 * Shuffle array (Fisher-Yates algorithm)
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Initialize game
 */
async function initGame() {
  // Load words
  const allWords = await loadWords();
  if (allWords.length === 0) return;

  // Shuffle words
  state.words = shuffleArray(allWords);
  state.currentWordIndex = 0;

  // Update UI
  updateUI();
}

/**
 * Start game
 */
async function startGame() {
  // Request microphone permission
  try {
    state.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    console.error('Microphone permission denied:', error);
    alert('Mikrofon diperlukan untuk bermain. Silakan izinkan akses mikrofon.');
    return;
  }

  // Reset state
  state.timeLeft = GAME_DURATION;
  state.score = 0;
  state.currentWordIndex = 0;
  state.gameActive = true;

  // Shuffle words again
  state.words = shuffleArray(state.words);

  // Hide start button, show record button and instructions
  elements.startBtn.classList.add('hidden');
  elements.recordBtn.disabled = false;
  elements.instructions.classList.remove('hidden');

  // Show first word
  nextWord();

  // Start timer
  startTimer();

  // Update UI
  updateUI();
}

/**
 * Start countdown timer
 */
function startTimer() {
  const timerInterval = setInterval(() => {
    state.timeLeft--;
    elements.timeLeft.textContent = state.timeLeft;

    if (state.timeLeft <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);
}

/**
 * Show next word
 */
function nextWord() {
  if (state.currentWordIndex >= state.words.length) {
    // No more words, end game
    endGame();
    return;
  }

  state.currentWord = state.words[state.currentWordIndex];
  elements.currentWord.textContent = state.currentWord;
  updateUI();
}

/**
 * Update UI
 */
function updateUI() {
  elements.scoreCorrect.textContent = state.score;
  elements.wordsRemaining.textContent = Math.max(0, state.words.length - state.currentWordIndex);
  elements.timeLeft.textContent = state.timeLeft;
}

/**
 * Start recording
 */
async function startRecording() {
  if (!state.gameActive || state.isRecording) return;

  state.isRecording = true;
  elements.recordBtn.classList.add('recording');

  try {
    // Create MediaRecorder
    const options = { mimeType: 'audio/webm' };
    state.mediaRecorder = new MediaRecorder(state.audioStream, options);

    const audioChunks = [];

    state.mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    state.mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      await sendAudioToAPI(audioBlob);
    };

    state.mediaRecorder.start();

    // Auto-stop after 3 seconds
    setTimeout(() => {
      if (state.isRecording) {
        stopRecording();
      }
    }, 3000);

  } catch (error) {
    console.error('Recording failed:', error);
    state.isRecording = false;
    elements.recordBtn.classList.remove('recording');
  }
}

/**
 * Stop recording
 */
function stopRecording() {
  if (!state.isRecording || !state.mediaRecorder) return;

  state.mediaRecorder.stop();
  state.isRecording = false;
  elements.recordBtn.classList.remove('recording');
}

/**
 * Send audio to API for transcription
 */
async function sendAudioToAPI(audioBlob) {
  // Show loading
  elements.loading.classList.remove('hidden');
  elements.recordBtn.disabled = true;

  try {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('targetWord', state.currentWord);

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    // Hide loading
    elements.loading.classList.add('hidden');

    if (response.ok) {
      handleTranscriptionResult(result);
    } else {
      // Treat API errors as incorrect
      handleTranscriptionResult({ isCorrect: false, transcript: '' });
    }

  } catch (error) {
    console.error('API request failed:', error);
    elements.loading.classList.add('hidden');
    // Treat errors as incorrect
    handleTranscriptionResult({ isCorrect: false, transcript: '' });
  }
}

/**
 * Handle transcription result
 */
function handleTranscriptionResult(result) {
  const isCorrect = result.isCorrect;

  // Update score
  if (isCorrect) {
    state.score++;
    updateUI();
  }

  // Show feedback
  showFeedback(isCorrect);

  // Move to next word after delay
  setTimeout(() => {
    if (state.gameActive) {
      state.currentWordIndex++;
      nextWord();
      elements.recordBtn.disabled = false;
    }
  }, 1000);
}

/**
 * Show feedback animation
 */
function showFeedback(isCorrect) {
  const emoji = isCorrect ? '✅' : '❌';
  elements.feedbackEmoji.textContent = emoji;
  elements.feedback.classList.remove('hidden');

  // Play sound (if implemented)
  playSound(isCorrect);

  // Hide after 1 second
  setTimeout(() => {
    elements.feedback.classList.add('hidden');
  }, 1000);
}

/**
 * Play feedback sound
 */
function playSound(isCorrect) {
  // Placeholder for sound effects
  // Can be implemented with Web Audio API or <audio> elements
  // For MVP, we'll skip this or use simple beep sounds
}

/**
 * End game
 */
function endGame() {
  state.gameActive = false;
  elements.recordBtn.disabled = true;
  elements.instructions.classList.add('hidden');

  // Stop audio stream
  if (state.audioStream) {
    state.audioStream.getTracks().forEach(track => track.stop());
    state.audioStream = null;
  }

  // Save score to localStorage
  saveScore(state.score);

  // Show end screen
  elements.finalScore.textContent = state.score;
  elements.endScreen.classList.remove('hidden');
}

/**
 * Save score to localStorage
 */
function saveScore(score) {
  localStorage.setItem('lastScore', score);

  const bestScore = parseInt(localStorage.getItem('bestScore') || '0');
  if (score > bestScore) {
    localStorage.setItem('bestScore', score);
  }
}

/**
 * Reset game
 */
function resetGame() {
  // Hide end screen
  elements.endScreen.classList.add('hidden');

  // Reset state
  state.timeLeft = GAME_DURATION;
  state.score = 0;
  state.currentWordIndex = 0;
  state.gameActive = false;

  // Shuffle words
  state.words = shuffleArray(state.words);

  // Show start button
  elements.startBtn.classList.remove('hidden');
  elements.recordBtn.disabled = true;

  // Reset word display
  elements.currentWord.textContent = 'Tekan Mulai';

  // Update UI
  updateUI();
}

/**
 * Event Listeners
 */
elements.startBtn.addEventListener('click', startGame);
elements.playAgainBtn.addEventListener('click', resetGame);

// Record button - tap to record
elements.recordBtn.addEventListener('mousedown', startRecording);
elements.recordBtn.addEventListener('touchstart', (e) => {
  e.preventDefault();
  startRecording();
});

elements.recordBtn.addEventListener('mouseup', stopRecording);
elements.recordBtn.addEventListener('touchend', (e) => {
  e.preventDefault();
  stopRecording();
});

// Prevent context menu on record button
elements.recordBtn.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Spacebar - hold to record (alternative to button)
document.addEventListener('keydown', (e) => {
  // Only handle spacebar if game is active and not already recording
  if (e.code === 'Space' && state.gameActive && !state.isRecording) {
    e.preventDefault();
    startRecording();
  }
});

document.addEventListener('keyup', (e) => {
  // Only handle spacebar if recording
  if (e.code === 'Space' && state.isRecording) {
    e.preventDefault();
    stopRecording();
  }
});

/**
 * Initialize on load
 */
initGame();
