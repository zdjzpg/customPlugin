const test = require('node:test');
const assert = require('node:assert/strict');
const { getReadAloudBuddyState, getListeningBuddyState } = require('../src/shared/audioFeedback');

test('getReadAloudBuddyState prioritizes recording over demo and score', () => {
  assert.equal(getReadAloudBuddyState({ isDemoPlaying: true, isRecording: true, hasScore: true }), 'recording');
  assert.equal(getReadAloudBuddyState({ isDemoPlaying: true, isRecording: false, hasScore: false }), 'demo_playing');
  assert.equal(getReadAloudBuddyState({ isDemoPlaying: false, isRecording: false, hasScore: true }), 'scored');
  assert.equal(getReadAloudBuddyState({ isDemoPlaying: false, isRecording: false, hasScore: false }), 'idle');
});

test('getListeningBuddyState returns listening only while playback is active', () => {
  assert.equal(getListeningBuddyState({ isPlaying: true }), 'listening');
  assert.equal(getListeningBuddyState({ isPlaying: false }), 'idle');
});
