const pool = require('../config/database');
const eventService = require('./eventService');

class LeaderboardService {
  async getEventLeaderboard(eventId, includePlayingStatus = false, activeRoundId = null) {
    const leaderboard = await eventService.getEventLeaderboard(eventId);

    if (includePlayingStatus && activeRoundId) {
      const roundPlayers = await this.getRoundPlayers(activeRoundId);
      
      return leaderboard.map(entry => {
        const player = roundPlayers.find(p => p.user_id === entry.id);
        return {
          ...entry,
          isPlaying: player?.status === 'playing',
          currentScore: player?.score || 0
        };
      });
    }

    return leaderboard;
  }

  async getRoundPlayers(roundId) {
    const gameService = require('./gameService');
    return await gameService.getRoundPlayers(roundId);
  }

  async getUserRank(eventId, userId) {
    const leaderboard = await eventService.getEventLeaderboard(eventId);
    const rank = leaderboard.findIndex(entry => entry.id === userId);
    
    if (rank === -1) {
      return { rank: null, score: 0 };
    }

    return {
      rank: rank + 1,
      score: leaderboard[rank].total_score,
      totalPlayers: leaderboard.length
    };
  }
}

module.exports = new LeaderboardService();

