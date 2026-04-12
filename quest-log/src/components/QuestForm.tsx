import { useState } from 'react';
import { QuestDifficulty, DIFFICULTY_CONFIG, RecurrenceType, QuestTag, Quest } from '../types';
import { generateOccurrences, validateRecurrenceConfig } from '../recurrenceUtils';
import { useStore } from '../store';

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const RECURRENCE_OPTIONS: { type: RecurrenceType; label: string }[] = [ { type: 'single', label: 'Única' }, { type: 'daily', label: 'Diária' }, { type: 'weekly', label: 'Semanal' } ];
const TAGS: QuestTag[] = ['💪 Saúde' , '📚 Estudo' , '💼 Trabalho' , '🎮 Lazer' , '🧙 Magia' , '🗡️ Combate' , '🌎 Explorar'];

export default function QuestForm() {
  const addQuest = useStore(s => s.addQuest);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('medium');
  const [tag, setTag] = useState<QuestTag>('💪 Saúde');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [open, setOpen] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('single');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let config;
    if (recurrenceType === 'single') config = { type: recurrenceType, startDate: scheduledDate };
    else config = { type: recurrenceType, startDate: `${new Date().getFullYear()}-01-01`, endDate: `${new Date().getFullYear()}-12-31`, weekdays: recurrenceType === 'weekly' ? selectedWeekdays : undefined };

    const error = validateRecurrenceConfig(config);
    if (error) { setFormError(error); return; }

    const timestamps = generateOccurrences(config);
    const quests: Quest[] = timestamps.map(ts => ({
      id: crypto.randomUUID(), title: title.trim(), description: description.trim(), difficulty, tag, completed: false, createdAt: Date.now(), scheduledDate: ts, recurrenceType
    }));

    addQuest(quests);
    setOpen(false); setTitle('');
  };

  if (!open) return <button className="new-quest-btn" onClick={() => setOpen(true)}>➕ Formatar Nova Missão</button>;

  return (
    <form className="quest-form" onSubmit={handleSubmit}>
      <input placeholder="Título épico da missão..." value={title} onChange={e => setTitle(e.target.value)} autoFocus required />
      <textarea placeholder="Sussurre a descrição (opcional)..." value={description} onChange={e => setDescription(e.target.value)} rows={2} />

      <div className="recurrence-selector">
        {RECURRENCE_OPTIONS.map(opt => ( <button key={opt.type} type="button" className={`recurrence-btn ${recurrenceType === opt.type ? 'selected' : ''}`} onClick={() => setRecurrenceType(opt.type)}>{opt.label}</button> ))}
      </div>
      {recurrenceType === 'single' && <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />}
      
      {recurrenceType === 'weekly' && (
        <div className="weekday-selector">
          {WEEKDAY_LABELS.map((label, i) => (
            <button key={i} type="button" className={`weekday-btn ${selectedWeekdays.includes(i) ? 'selected' : ''}`} onClick={() => setSelectedWeekdays(p => p.includes(i)? p.filter(x=>x!==i):[...p, i])}>{label}</button>
          ))}
        </div>
      )}

      {formError && <div className="form-error">{formError}</div>}

      <div style={{display:'flex', gap:'8px', overflowX:'auto', padding:'10px 0', whiteSpace: 'nowrap'}}>
        {TAGS.map(t => <button type="button" key={t} onClick={()=>setTag(t)} style={{padding:'6px 12px', background: tag === t ? '#4ade80':'rgba(255,255,255,0.05)', color:'#fff', border:'none', borderRadius:'20px', cursor:'pointer', fontSize:'0.85rem'}}>{t}</button>)}
      </div>

      <div className="difficulty-selector">
        {(Object.keys(DIFFICULTY_CONFIG) as QuestDifficulty[]).map(d => {
          const cfg = DIFFICULTY_CONFIG[d];
          return <button key={d} type="button" className={`diff-btn ${difficulty === d ? 'selected' : ''}`} style={{ borderColor: difficulty === d ? cfg.color : 'transparent' }} onClick={() => setDifficulty(d)}>{cfg.emoji} {cfg.label}<small>+{cfg.xp}XP</small></button>;
        })}
      </div>
      
      <div className="form-actions" style={{marginTop:'10px'}}>
        <button type="submit" className="submit-btn" style={{background:'#e94560'}}>🏹 Declarar Missão</button>
        <button type="button" className="cancel-btn" onClick={() => setOpen(false)}>Recuar</button>
      </div>
    </form>
  );
}
