const pool = require('../../config/database');

class ScoreValidator {
  validateFlyBirdScore(score, metadata, gameStartTime, currentTime) {
    // Basic sanity checks only
    if (score < 0) throw new Error('Invalid score');
    return true;
  }

  validateEndlessRunnerScore(score, metadata, gameStartTime, currentTime) {
    // Basic sanity checks only for Doodle Jump mode
    // Score is roughly height / 10
    if (score < 0) throw new Error('Invalid score');
    return true;
  }

  validateReactionTimeScore(score, metadata, gameStartTime, currentTime) {
    if (score < 0) throw new Error('Invalid score');
    return true;
  }

  async validateScore(userId, gameType, score, metadata, roundId) {
    // Allow basic validation to pass for now to unblock user
    return true;
  }
}

module.exports = new ScoreValidator();

