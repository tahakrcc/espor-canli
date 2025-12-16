import './CountdownTimer.css';

interface Props {
  countdown: number;
}

export function CountdownTimer({ countdown }: Props) {
  return (
    <div className="countdown-container">
      <div className="countdown-number">{countdown}</div>
      <p className="countdown-text">Oyun başlıyor!</p>
    </div>
  );
}

