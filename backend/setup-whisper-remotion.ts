#!/usr/bin/env bun
/**
 * Setup script for Whisper.cpp using @remotion/install-whisper-cpp
 *
 * This script automates:
 * 1. Installing Whisper.cpp binaries (version 1.5.5)
 * 2. Downloading the small model for Indonesian transcription
 *
 * Usage:
 *   bun backend/setup-whisper-remotion.ts
 */

import { installWhisperCpp, downloadWhisperModel } from '@remotion/install-whisper-cpp';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const WHISPER_DIR = join(import.meta.dir, 'whisper');
const WHISPER_VERSION = '1.5.5';
const MODEL_NAME = 'small';

console.log('=========================================');
console.log('Baca & Ucap - Whisper.cpp Setup');
console.log('Using @remotion/install-whisper-cpp');
console.log('=========================================');
console.log('');

// Check if directory exists and remove it (let installWhisperCpp create it fresh)
if (existsSync(WHISPER_DIR)) {
  console.log('Whisper directory already exists at:', WHISPER_DIR);
  console.log('Removing existing installation...');
  rmSync(WHISPER_DIR, { recursive: true, force: true });
  console.log('');
}

try {
  // Step 1: Install Whisper.cpp (will create the directory)
  console.log(`Installing Whisper.cpp v${WHISPER_VERSION}...`);
  console.log('This may take a few minutes...');
  console.log('');

  const whisperPath = await installWhisperCpp({
    to: WHISPER_DIR,
    version: WHISPER_VERSION,
  });

  console.log('✓ Whisper.cpp installed successfully');
  console.log('  Binary path:', whisperPath);
  console.log('');

  // Step 2: Download model
  console.log(`Downloading Whisper '${MODEL_NAME}' model...`);
  console.log('This may take a few minutes...');
  console.log('');

  const modelPath = await downloadWhisperModel({
    folder: WHISPER_DIR,
    model: MODEL_NAME,
  });

  console.log('✓ Model downloaded successfully');
  console.log('  Model path:', modelPath);
  console.log('');

  // Success summary
  console.log('=========================================');
  console.log('Setup Complete!');
  console.log('=========================================');
  console.log('');
  console.log('Whisper.cpp has been installed at:', WHISPER_DIR);
  console.log('Model file:', modelPath);
  console.log('');
  console.log('Environment variables:');
  console.log(`  WHISPER_PATH=${WHISPER_DIR}`);
  console.log(`  WHISPER_MODEL=${MODEL_NAME}`);
  console.log('');
  console.log('You can now start the server with:');
  console.log('  bun --hot backend/server.ts');
  console.log('');

} catch (error) {
  console.error('');
  console.error('=========================================');
  console.error('Setup Failed');
  console.error('=========================================');
  console.error('');

  if (error instanceof Error) {
    console.error('Error:', error.message);

    // Provide helpful troubleshooting info
    if (error.message.includes('cmake') || error.message.includes('make') || error.message.includes('gcc')) {
      console.error('');
      console.error('Missing build tools. Please install:');
      console.error('  - git');
      console.error('  - build-essential (gcc, make)');
      console.error('  - cmake');
      console.error('');
      console.error('On Debian/Ubuntu:');
      console.error('  sudo apt-get update');
      console.error('  sudo apt-get install -y git build-essential cmake');
      console.error('');
      console.error('On macOS:');
      console.error('  brew install git cmake');
      console.error('  xcode-select --install');
    }
  } else {
    console.error('Unknown error:', error);
  }

  console.error('');
  process.exit(1);
}
