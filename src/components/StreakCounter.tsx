import { useStore } from '../store';

const DAY_MS = 86400000;

export default function StreakCounter() {
  const streak = useStore(s => s.hero.streak ?? 0);
  const lastDate = useStore(s => s.hero.streakLastDate);
  const resetStreak = useStore(s => s.resetStreak);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const daysSince = lastDate === undefined ? Infinity : Math.round((todayStart.getTime() - lastDate) / DAY_MS);
  // A streak is broken once a full day passes without completing a quest
  const current = daysSince <= 1 ? streak : 0;

  const handleReset = () => {
    if (window.confirm('Reiniciar o streak?')) resetStreak();
  };

  return (
    <div className={`streak-counter${current > 0 ? ' active' : ''}`} title="Dias seguidos completando missões">
      <span className="streak-fire" aria-hidden="true">🔥</span>
      <span aria-label={`Streak de ${current} dias`}>{current}</span>
      <button className="streak-reset" onClick={handleReset} title="Reiniciar streak" aria-label="Reiniciar streak">↺</button>
    </div>
  );
}
