import HudIcon from './HudIcon';
import { useState } from 'react';
import { Quest, DIFFICULTY_CONFIG, QuestAgent, AGENT_CONFIG, ChecklistItem } from '../types';
import { useStore } from '../store';

interface Props { quests: Quest[]; highlightHard?: boolean; }

export default function QuestList({ quests, highlightHard }: Props) {
  const completeQuestAction = useStore(s => s.completeQuestAction);
  const deleteQuest = useStore(s => s.deleteQuest);
  const deleteAllMatching = useStore(s => s.deleteAllMatching);
  const updateQuest = useStore(s => s.updateQuest);
  const rescheduleQuest = useStore(s => s.rescheduleQuest);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [tempDesc, setTempDesc] = useState('');
  const [tempProgress, setTempProgress] = useState(0);
  const [tempAgent, setTempAgent] = useState<QuestAgent | undefined>(undefined);
  const [tempChecklist, setTempChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [tempScheduledDate, setTempScheduledDate] = useState('');
  const [applyDateToSeries, setApplyDateToSeries] = useState(false);

  if (quests.length === 0) return <div className="empty-msg">Nenhum rastro encontrado... O horizonte está limpo e sereno! <HudIcon name="pin" /></div>;

  const handleStartEdit = (quest: Quest) => {
    setEditingId(quest.id);
    setTempTitle(quest.title);
    setTempDesc(quest.description || '');
    setTempProgress(quest.progress || 0);
    setTempAgent(quest.agentLabel);
    setTempChecklist(quest.checklist || []);
    setNewChecklistItem('');
    const date = new Date(quest.scheduledDate);
    setTempScheduledDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
    setApplyDateToSeries(false);
  };

  const handleSave = (id: string) => {
    updateQuest(id, { title: tempTitle, description: tempDesc, progress: tempProgress, agentLabel: tempAgent, checklist: tempChecklist });
    if (tempScheduledDate) rescheduleQuest(id, new Date(`${tempScheduledDate}T12:00:00`).getTime(), applyDateToSeries);
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTempTitle('');
    setTempDesc('');
    setTempProgress(0);
    setTempAgent(undefined);
    setTempChecklist([]);
    setNewChecklistItem('');
    setTempScheduledDate('');
    setApplyDateToSeries(false);
  };

  const addTemporaryChecklistItem = () => {
    const title = newChecklistItem.trim();
    if (!title) return;
    setTempChecklist(current => [...current, { id: crypto.randomUUID(), title, completed: false }]);
    setNewChecklistItem('');
  };

  return (
    <div className="quest-list">
      {quests.map(quest => {
        const cfg = DIFFICULTY_CONFIG[quest.difficulty];
        const isRecurrent = quest.recurrenceType && quest.recurrenceType !== 'single';
        const isEditing = editingId === quest.id;
        const shouldHighlight = highlightHard && !quest.completed && (quest.difficulty === 'hard' || quest.difficulty === 'legendary');
        const checklist = quest.checklist || [];
        const completedChecklistItems = checklist.filter(item => item.completed).length;

        return (
          <div 
            key={quest.id} 
            className={`quest-card ${quest.completed ? 'completed' : ''} ${shouldHighlight ? 'highlight-danger' : ''}`} 
            style={{ 
              borderLeftColor: cfg.color,
              background: quest.completed ? undefined : `linear-gradient(90deg, rgba(34, 228, 255, 0.13) ${quest.progress || 0}%, rgba(10, 17, 35, 0.94) ${quest.progress || 0}%)`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {quest.progress !== undefined && quest.progress > 0 && !quest.completed && (
              <div 
                className="quest-card-top-bar" 
                style={{ width: `${quest.progress}%` }}
              />
            )}
            <div className="quest-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span className="quest-difficulty" style={{ color: cfg.color }}>
                  <HudIcon name="rank" /> {cfg.label}
                </span>
                {quest.tag && <span style={{background:'rgba(255,255,255,0.1)', padding:'2px 8px', borderRadius:'10px', fontSize:'0.75rem', color:'#fff'}}>{quest.tag.split(' ').slice(1).join(' ')}</span>}
                {quest.agentLabel && (() => { const acfg = AGENT_CONFIG[quest.agentLabel]; return <span className="agent-badge" style={{background: acfg.bg, color: acfg.color, border: `1px solid ${acfg.color}`, padding:'2px 8px', borderRadius:'12px', fontSize:'0.7rem', fontWeight:600, whiteSpace:'nowrap'}}><HudIcon name="chip" /> {quest.agentLabel}</span>; })()}
              </div>
              <span className="quest-reward">+{cfg.xp} XP | +{cfg.gold} <HudIcon name="bolt" /></span>
            </div>
            
            <h3 style={{display:'flex', alignItems:'center', gap:'8px'}}>
              {quest.title} {isRecurrent && <span title="Missão Recorrente" style={{fontSize:'0.9rem', opacity:0.5}}><HudIcon name="repeat" /></span>}
              {!quest.completed && !isEditing && (
                <button className="edit-icon-btn" onClick={() => handleStartEdit(quest)} title={quest.description ? 'Editar Descrição' : 'Adicionar Descrição'}>
                  <HudIcon name="edit" />
                </button>
              )}
              {quest.progress !== undefined && quest.progress > 0 && !quest.completed && !isEditing && (
                <span className="quest-progress-badge">{quest.progress}%</span>
              )}
            </h3>
            
            <div className="quest-description-area">
              {isEditing ? (
                <div className="quick-edit-desc">
                  <input 
                    type="text"
                    value={tempTitle}
                    onChange={e => setTempTitle(e.target.value)}
                    placeholder="Título da missão..."
                    className="quick-edit-title-input"
                    autoFocus
                  />
                  <div className="schedule-edit-area">
                    <label>Data da missão <input type="date" value={tempScheduledDate} onChange={e => setTempScheduledDate(e.target.value)} /></label>
                    {isRecurrent && <label className="schedule-series-toggle"><input type="checkbox" checked={applyDateToSeries} onChange={e => setApplyDateToSeries(e.target.checked)} /> Reagendar todas as ocorrências pendentes</label>}
                  </div>
                  
                  <div className="progress-edit-area">
                    <label>Progresso: {tempProgress}%</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={tempProgress} 
                      onChange={e => setTempProgress(parseInt(e.target.value))}
                      className="progress-slider"
                    />
                  </div>

                  <textarea 
                    value={tempDesc} 
                    onChange={e => setTempDesc(e.target.value)}
                    placeholder="Descreva os detalhes da missão..."
                  />
                  <div className="checklist-editor quick-checklist-editor">
                    <div className="checklist-editor-heading"><label><HudIcon name="check" /> Checklist</label><span>Itens da missão</span></div>
                    <div className="checklist-add-row">
                      <input value={newChecklistItem} onChange={e => setNewChecklistItem(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTemporaryChecklistItem(); } }} placeholder="Novo item..." />
                      <button type="button" className="checklist-add-button" onClick={addTemporaryChecklistItem}>+ Adicionar</button>
                    </div>
                    {tempChecklist.map(item => <div className="checklist-edit-item" key={item.id}><span>{item.title}</span><button className="checklist-remove-button" type="button" aria-label={`Remover ${item.title}`} onClick={() => setTempChecklist(current => current.filter(entry => entry.id !== item.id))}>×</button></div>)}
                  </div>
                  <div className="quick-edit-actions">
                    <button onClick={() => handleSave(quest.id)} className="save-desc-btn">Salvar</button>
                    <button onClick={handleCancelEdit} className="cancel-desc-btn">Cancelar</button>
                  </div>

                  <div style={{marginTop:'10px'}}>
                    <span style={{fontSize:'0.8rem', color:'var(--text-dim)', display:'block', marginBottom:'6px'}}><HudIcon name="chip" /> Executado por:</span>
                    <div style={{display:'flex', gap:'5px', flexWrap:'wrap'}}>
                      {(['Claude','Codex','Gemini','Kiro','Gamma','Manual'] as QuestAgent[]).map(a => {
                        const acfg = AGENT_CONFIG[a];
                        const isSel = tempAgent === a;
                        return <button key={a} type="button" onClick={() => setTempAgent(isSel ? undefined : a)} style={{padding:'4px 10px', background: isSel ? acfg.bg : 'rgba(255,255,255,0.04)', color: isSel ? acfg.color : 'var(--text-dim)', border: `1px solid ${isSel ? acfg.color : 'rgba(255,255,255,0.08)'}`, borderRadius:'16px', cursor:'pointer', fontSize:'0.75rem', fontWeight: isSel ? 600 : 400, transition:'all 0.2s'}}><HudIcon name="chip" /> {a}</button>;
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {quest.description && <p className="quest-desc">{quest.description}</p>}
                  {checklist.length > 0 && <div className="quest-checklist">
                    <div className="quest-checklist-title"><HudIcon name="check" /> Checklist <span>{completedChecklistItems}/{checklist.length}</span></div>
                    {checklist.map(item => <label key={item.id} className={`quest-checklist-item ${item.completed ? 'done' : ''}`}>
                      <input type="checkbox" checked={item.completed} disabled={quest.completed} onChange={() => updateQuest(quest.id, { checklist: checklist.map(entry => entry.id === item.id ? { ...entry, completed: !entry.completed } : entry) })} />
                      <span>{item.title}</span>
                    </label>)}
                  </div>}
                </>
              )}
            </div>

            <div className="quest-actions" style={{marginTop:'12px'}}>
              {!quest.completed && <button className="complete-btn" onClick={() => completeQuestAction(quest.id)}><HudIcon name="check" /> Finalizar</button>}
              <button className="delete-btn" onClick={() => deleteQuest(quest.id)}><HudIcon name="trash" /> Lixo</button>
              {isRecurrent && <button className="delete-btn" onClick={() => { if(confirm('Destruir toda a CADEIA TEMPORAL DE REPETIÇÕES dessa missão?')) deleteAllMatching(quest.id); }}>Aniquilar Série</button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
