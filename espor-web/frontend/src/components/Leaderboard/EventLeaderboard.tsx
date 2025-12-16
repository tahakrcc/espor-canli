import './EventLeaderboard.css';

interface LeaderboardEntry {
  id: string;
  username: string;
  total_score: number;
  rounds_played: number;
  isPlaying?: boolean;
  currentScore?: number;
}

interface Props {
  leaderboard: LeaderboardEntry[];
  showPlayingStatus?: boolean;
}

export function EventLeaderboard({ leaderboard, showPlayingStatus = false }: Props) {
  return (
    <div className="leaderboard">
      <h2>Liderlik Tablosu</h2>
      {leaderboard.length === 0 ? (
        <p className="no-entries">Henüz skor yok</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Sıra</th>
              <th>Kullanıcı</th>
              <th>Toplam Skor</th>
              <th>Oynanan Tur</th>
              {showPlayingStatus && <th>Durum</th>}
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, index) => (
              <tr key={entry.id} className={entry.isPlaying ? 'playing' : ''}>
                <td>{index + 1}</td>
                <td>{entry.username}</td>
                <td>
                  {entry.total_score}
                  {entry.isPlaying && entry.currentScore !== undefined && (
                    <span className="current-score"> (+{entry.currentScore})</span>
                  )}
                </td>
                <td>{entry.rounds_played}</td>
                {showPlayingStatus && (
                  <td>
                    {entry.isPlaying && <span className="playing-badge">🟢 Oynuyor</span>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

