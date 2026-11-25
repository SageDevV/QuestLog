import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store';

function durationLabel(seconds: number, hundredths = false): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const wholeSeconds = Math.floor(seconds % 60);
  const base = hours > 0 ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(wholeSeconds).padStart(2, '0')}` : `${String(minutes).padStart(2, '0')}:${String(wholeSeconds).padStart(2, '0')}`;
  return hundredths ? `${base}.${String(Math.floor((seconds % 1) * 100)).padStart(2, '0')}` : base;
}

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function ClockTools() {
  const timers = useStore(s => s.countdownTimers);
  const alarms = useStore(s => s.sprintAlarms);
  const addTimer = useStore(s => s.addCountdownTimer);
  const startTimer = useStore(s => s.startCountdownTimer);
  const pauseTimer = useStore(s => s.pauseCountdownTimer);
  const resetTimer = useStore(s => s.resetCountdownTimer);
  const deleteTimer = useStore(s => s.deleteCountdownTimer);
  const addAlarm = useStore(s => s.addSprintAlarm);
  const toggleAlarm = useStore(s => s.toggleSprintAlarm);
  const markAlarmTriggered = useStore(s => s.markSprintAlarmTriggered);
  const deleteAlarm = useStore(s => s.deleteSprintAlarm);
  const [now, setNow] = useState(Date.now());
  const [timerLabel, setTimerLabel] = useState('');
  const [timerMinutes, setTimerMinutes] = useState('25');
  const [alarmLabel, setAlarmLabel] = useState('');
  const [alarmTime, setAlarmTime] = useState('09:00');
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchBase, setStopwatchBase] = useState(0);
  const [stopwatchStartedAt, setStopwatchStartedAt] = useState<number | null>(null);
  const [ringing, setRinging] = useState<string[]>([]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const date = new Date(now);
    const currentTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    const today = localDateKey(date);
    timers.forEach(timer => {
      if (timer.endsAt && timer.endsAt <= now && !timer.completed) {
        pauseTimer(timer.id);
        setRinging(current => current.includes(timer.id) ? current : [...current, timer.id]);
      }
    });
    alarms.forEach(alarm => {
      if (alarm.enabled && alarm.time === currentTime && alarm.lastTriggeredDate !== today) {
        markAlarmTriggered(alarm.id, today);
        setRinging(current => current.includes(alarm.id) ? current : [...current, alarm.id]);
      }
    });
  }, [now, timers, alarms, pauseTimer, markAlarmTriggered]);

  const stopwatchSeconds = stopwatchBase + (stopwatchRunning && stopwatchStartedAt ? (now - stopwatchStartedAt) / 1000 : 0);
  const runningTimers = useMemo(() => timers.filter(timer => timer.endsAt), [timers]);

  const createTimer = (event: React.FormEvent) => {
    event.preventDefault();
    const minutes = Number(timerMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    addTimer(timerLabel, minutes * 60);
    setTimerLabel('');
  };

  const createAlarm = (event: React.FormEvent) => {
    event.preventDefault();
    if (!alarmTime) return;
    addAlarm(alarmLabel, alarmTime);
    setAlarmLabel('');
  };

  const toggleStopwatch = () => {
    if (stopwatchRunning && stopwatchStartedAt) {
      setStopwatchBase(stopwatchSeconds);
      setStopwatchStartedAt(null);
      setStopwatchRunning(false);
    } else {
      setStopwatchStartedAt(Date.now());
      setStopwatchRunning(true);
    }
  };

  return (
    <section className="clock-tools" aria-labelledby="clock-tools-title">
      <header className="clock-tools-header"><div><p>TIME SYSTEM // FOCUS CONTROL</p><h2 id="clock-tools-title">Relógios</h2><span>Crie timers, despertadores e acompanhe o tempo de foco.</span></div><b>{runningTimers.length} timer{runningTimers.length !== 1 ? 's' : ''} ativo{runningTimers.length !== 1 ? 's' : ''}</b></header>

      {ringing.length > 0 && <div className="clock-alert" role="alert"><span>⚡ SINAL DE TEMPO CONCLUÍDO</span><button type="button" onClick={() => setRinging([])}>Confirmar</button></div>}

      <div className="clock-tools-grid">
        <div className="clock-panel"><h3>Timer</h3><form onSubmit={createTimer} className="clock-create-form"><input value={timerLabel} onChange={event => setTimerLabel(event.target.value)} placeholder="Nome do foco (opcional)" /><div><input type="number" min="1" value={timerMinutes} onChange={event => setTimerMinutes(event.target.value)} aria-label="Duração em minutos" /><span>minutos</span></div><button type="submit">+ Criar timer</button></form><div className="clock-item-list">{timers.length === 0 ? <p className="clock-empty">Nenhum timer criado.</p> : timers.map(timer => { const remaining = timer.endsAt ? Math.max(0, Math.ceil((timer.endsAt - now) / 1000)) : timer.remainingSeconds; return <article key={timer.id} className={`timer-item ${remaining === 0 ? 'finished' : ''}`}><div><span>{timer.label}</span><strong>{durationLabel(remaining)}</strong></div><div className="timer-actions">{timer.endsAt ? <button type="button" onClick={() => pauseTimer(timer.id)}>Pausar</button> : <button type="button" onClick={() => startTimer(timer.id)} disabled={remaining === 0}>Iniciar</button>}<button type="button" onClick={() => resetTimer(timer.id)}>↺</button><button type="button" onClick={() => deleteTimer(timer.id)}>×</button></div></article>; })}</div></div>

        <div className="clock-panel"><h3>Despertador</h3><form onSubmit={createAlarm} className="clock-create-form"><input value={alarmLabel} onChange={event => setAlarmLabel(event.target.value)} placeholder="Lembrete (opcional)" /><div><input type="time" value={alarmTime} onChange={event => setAlarmTime(event.target.value)} aria-label="Horário do despertador" /></div><button type="submit">+ Criar despertador</button></form><div className="clock-item-list">{alarms.length === 0 ? <p className="clock-empty">Nenhum despertador criado.</p> : alarms.map(alarm => <article key={alarm.id} className={`alarm-item ${alarm.enabled ? '' : 'disabled'}`}><div><strong>{alarm.time}</strong><span>{alarm.label}</span></div><div className="timer-actions"><button type="button" onClick={() => toggleAlarm(alarm.id)}>{alarm.enabled ? 'Ativo' : 'Inativo'}</button><button type="button" onClick={() => deleteAlarm(alarm.id)}>×</button></div></article>)}</div></div>
      </div>

      <div className="clock-panel stopwatch-panel"><h3>Cronômetro</h3><strong className="stopwatch-display">{durationLabel(stopwatchSeconds, true)}</strong><div className="stopwatch-actions"><button type="button" className="stopwatch-primary" onClick={toggleStopwatch}>{stopwatchRunning ? 'Pausar' : 'Iniciar'}</button><button type="button" onClick={() => { setStopwatchRunning(false); setStopwatchBase(0); setStopwatchStartedAt(null); }}>Zerar</button></div></div>
    </section>
  );
}
