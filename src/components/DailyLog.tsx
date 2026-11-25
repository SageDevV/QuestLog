import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store';

function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`));
}

export default function DailyLog() {
  const dailyLogs = useStore(s => s.dailyLogs);
  const saveDailyLog = useStore(s => s.saveDailyLog);
  const today = localDateKey();
  const todayEntry = dailyLogs.find(entry => entry.date === today);
  const [content, setContent] = useState(todayEntry?.content ?? '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setContent(todayEntry?.content ?? '');
  }, [todayEntry?.content]);

  const history = useMemo(() => dailyLogs.filter(entry => entry.date !== today).sort((a, b) => b.date.localeCompare(a.date)), [dailyLogs, today]);

  const handleSave = () => {
    saveDailyLog(today, content);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <section className="daily-log" aria-labelledby="daily-log-title">
      <header className="daily-log-header">
        <div>
          <p className="daily-log-kicker">SPRINT INTELLIGENCE // REGISTRO OPERACIONAL</p>
          <h2 id="daily-log-title">Daily Log</h2>
          <p>Registre entregas, decisões, bloqueios e próximos passos do sprint.</p>
        </div>
        <time dateTime={today}>{formatDate(today)}</time>
      </header>

      <div className="daily-log-editor">
        <label htmlFor="daily-log-content">Relato do dia</label>
        <textarea id="daily-log-content" value={content} onChange={event => { setContent(event.target.value); setSaved(false); }} placeholder={'• O que foi entregue hoje?\n• Quais decisões técnicas foram tomadas?\n• Há bloqueios ou próximos passos?'} rows={10} />
        <div className="daily-log-actions">
          <span>{saved ? 'Registro sincronizado.' : 'Seu registro fica salvo no MissionLog.'}</span>
          <button type="button" onClick={handleSave}>Salvar registro</button>
        </div>
      </div>

      <div className="daily-log-history">
        <h3>Registros anteriores</h3>
        {history.length === 0 ? <p className="daily-log-empty">Nenhum registro anterior. O histórico do sprint vai aparecer aqui.</p> : history.map(entry => (
          <article key={entry.id} className="daily-log-entry">
            <time dateTime={entry.date}>{formatDate(entry.date)}</time>
            <p>{entry.content}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
