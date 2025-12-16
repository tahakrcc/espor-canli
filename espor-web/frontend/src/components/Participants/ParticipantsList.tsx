import './ParticipantsList.css';

interface Participant {
  id: string;
  username: string;
  joined_at: string;
}

interface Props {
  participants: Participant[];
}

export function ParticipantsList({ participants }: Props) {
  return (
    <div className="participants-list">
      <h3>Katılımcılar ({participants.length})</h3>
      <ul>
        {participants.map((participant) => (
          <li key={participant.id}>
            <span className="username">{participant.username}</span>
            <span className="joined-time">
              {new Date(participant.joined_at).toLocaleTimeString('tr-TR')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

