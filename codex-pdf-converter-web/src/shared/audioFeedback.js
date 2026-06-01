function getReadAloudBuddyState({ isDemoPlaying = false, isRecording = false, hasScore = false } = {}) {
  if (isRecording) {
    return 'recording';
  }
  if (isDemoPlaying) {
    return 'demo_playing';
  }
  if (hasScore) {
    return 'scored';
  }
  return 'idle';
}

function getListeningBuddyState({ isPlaying = false } = {}) {
  return isPlaying ? 'listening' : 'idle';
}

module.exports = {
  getReadAloudBuddyState,
  getListeningBuddyState
};
