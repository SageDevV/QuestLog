import { useState } from 'react';
import { Quest, DIFFICULTY_CONFIG, AGENT_CONFIG, QuestAgent } from '../types';
import { getDaysInMonth, getFirstDayOfWeek, formatMonthYear, groupQuestsByDay } from '../calendarUtils';

interface QuestCalendarProps {
  quests: Quest[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onDeleteSeries: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Quest>) => void;
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const AGENTS: QuestAgent[] = ['Claude', 'Codex', 'Gemini', 'Kiro', 'Gamma', 'Manual'];

export default function QuestCalendar({ quests, onComplete, onDelete, onDeleteSeries, onUpdate }: QuestCalendarProps) {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [tempDesc, setTempDesc] = useState('');
  const [tempAgentLabel, setTempAgentLabel] = useState<QuestAgent | undefined>(undefined);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);
  const questsByDay = groupQuestsByDay(quests, currentYear, currentMonth);

  function goToPrevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
    setSelectedDay(null);
  }

  function goToNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
    setSelectedDay(null);
  }

  function handleDayClick(day: number) {
    setSelectedDay(prev => (prev === day ? null : day));
    setEditingId(null);
  }

  const handleStartEdit = (quest: Quest) => {
    setEditingId(quest.id);
    setTempTitle(quest.title);
    setTempDesc(quest.description || '');
    setTempAgentLabel(quest.agentLabel);
  };

  const handleSave = (id: string) => {
    onUpdate(id, { title: tempTitle, description: tempDesc, agentLabel: tempAgentLabel });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTempTitle('');
    setTempDesc('');
    setTempAgentLabel(undefined);
  };

  const selectedQuests = selectedDay ? questsByDay.get(selectedDay) ?? [] : [];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="quest-calendar">
      <div className="calendar-header">
        <button onClick={goToPrevMonth} aria-label="Mês anterior">◀</button>
        <h2>{formatMonthYear(currentYear, currentMonth)}</h2>
        <button onClick={goToNextMonth} aria-label="Próximo mês">▶</button>
      </div>

      <div className="calendar-grid">
        {DAY_LABELS.map(label => (
          <div key={label} className="calendar-day-label">{label}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="calendar-day empty" />;
          const dayQuests = questsByDay.get(day);
          const hasQuests = !!dayQuests && dayQuests.length > 0;
          const isSelected = selectedDay === day;
          return (
            <div
              key={day}
              className={`calendar-day${hasQuests ? ' has-quests' : ''}${isSelected ? ' selected' : ''}`}
              onClick={() => handleDayClick(day)}
            >
              <span>{day}</span>
              {hasQuests && <span className="quest-indicator">{dayQuests.length}</span>}
            </div>
          );
        })}
      </div>

      {selectedDay !== null && (
        <div className="day-panel">
          <h3>Dia {selectedDay}</h3>
          {selectedQuests.length === 0 ? (
            <p className="empty-msg">Nenhuma missão neste dia</p>
          ) : (
            selectedQuests.map(quest => {
              const cfg = DIFFICULTY_CONFIG[quest.difficulty];
              const isEditing = editingId === quest.id;

              return (
                <div key={quest.id} className={`day-panel-quest ${isEditing ? 'editing' : ''}`}>
                  {isEditing ? (
                    <div className="calendar-quick-edit">
                      <input 
                        type="text"
                        value={tempTitle}
                        onChange={e => setTempTitle(e.target.value)}
                        placeholder="Título..."
                        autoFocus
                      />
                      <textarea 
                        value={tempDesc}
                        onChange={e => setTempDesc(e.target.value)}
                        placeholder="Descrição..."
                      />
                      <div className="agent-label-selector" style={{ marginTop: '8px' }}>
                        <span style={{fontSize:'0.75rem', color:'var(--text-dim)', marginBottom:'4px', display:'block'}}>🤖 Executado por:</span>
                        <div style={{display:'flex', gap:'4px', flexWrap:'wrap'}}>
                          {AGENTS.map(a => {
                            const acfg = AGENT_CONFIG[a];
                            const isSelected = tempAgentLabel === a;
                            return (
                              <button 
                                type="button" 
                                key={a} 
                                onClick={() => setTempAgentLabel(isSelected ? undefined : a)} 
                                className={`agent-label-btn ${isSelected ? 'selected' : ''}`} 
                                style={{
                                  padding:'4px 8px', 
                                  background: isSelected ? acfg.bg : 'rgba(255,255,255,0.04)', 
                                  color: isSelected ? acfg.color : 'var(--text-dim)', 
                                  border: `1px solid ${isSelected ? acfg.color : 'rgba(255,255,255,0.08)'}`, 
                                  borderRadius:'12px', 
                                  cursor:'pointer', 
                                  fontSize:'0.7rem', 
                                  fontWeight: isSelected ? 600 : 400, 
                                  transition:'all 0.2s'
                                }}
                              >
                                {acfg.emoji} {a}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="quick-edit-actions" style={{ marginTop: '12px' }}>
                        <button onClick={() => handleSave(quest.id)} className="save-desc-btn">Salvar</button>
                        <button onClick={handleCancelEdit} className="cancel-desc-btn">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="day-panel-quest-status">{quest.completed ? '✅' : '📋'}</span>
                      <span className="day-panel-quest-title">{quest.title}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="day-panel-quest-difficulty">{cfg.emoji} {cfg.label}</span>
                        {quest.agentLabel && (() => { const acfg = AGENT_CONFIG[quest.agentLabel]; return <span className="agent-badge" style={{background: acfg.bg, color: acfg.color, border: `1px solid ${acfg.color}`, padding:'2px 6px', borderRadius:'10px', fontSize:'0.65rem', fontWeight:600}}>{acfg.emoji} {quest.agentLabel}</span>; })()}
                      </div>
                      <span className="day-panel-quest-reward">+{cfg.xp}XP +{cfg.gold}⚡</span>
                      
                      <div className="day-panel-actions">
                        {!quest.completed && (
                          <button
                            className="edit-icon-btn"
                            onClick={(e) => { e.stopPropagation(); handleStartEdit(quest); }}
                            title="Editar Missão"
                          >
                            ✏️
                          </button>
                        )}
                        {!quest.completed && (
                          <button
                            className="complete-btn"
                            onClick={(e) => { e.stopPropagation(); onComplete(quest.id); }}
                            title="Completar Missão"
                          >
                            ✅
                          </button>
                        )}
                        <button
                          className="delete-icon-btn"
                          onClick={(e) => { e.stopPropagation(); if(confirm('Excluir esta missão?')) onDelete(quest.id); }}
                          title="Excluir Missão"
                        >
                          🗑️
                        </button>
                        {quest.recurrenceType && quest.recurrenceType !== 'single' && (
                          <button
                            className="delete-series-btn"
                            onClick={(e) => { e.stopPropagation(); if(confirm('Destruir toda a CADEIA TEMPORAL desta série?')) onDeleteSeries(quest.id); }}
                            title="Aniquilar Série"
                          >
                            🔄🗑️
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
