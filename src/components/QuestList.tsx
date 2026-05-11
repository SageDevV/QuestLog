import { useState } from 'react';
import { Quest, DIFFICULTY_CONFIG, QuestAgent, AGENT_CONFIG } from '../types';
import { useStore } from '../store';

interface Props { quests: Quest[]; highlightHard?: boolean; }

export default function QuestList({ quests, highlightHard }: Props) {
  const completeQuestAction = useStore(s => s.completeQuestAction);
  const deleteQuest = useStore(s => s.deleteQuest);
  const deleteAllMatching = useStore(s => s.deleteAllMatching);
  const updateQuest = useStore(s => s.updateQuest);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [tempDesc, setTempDesc] = useState('');
  const [tempProgress, setTempProgress] = useState(0);
  const [tempAgent, setTempAgent] = useState<QuestAgent | undefined>(undefined);

  if (quests.length === 0) return <div className="empty-msg">Nenhum rastro encontrado... O horizonte está limpo e sereno! 🗺️</div>;

  const handleStartEdit = (quest: Quest) => {
    setEditingId(quest.id);
    setTempTitle(quest.title);
    setTempDesc(quest.description || '');
    setTempProgress(quest.progress || 0);
    setTempAgent(quest.agentLabel);
  };

  const handleSave = (id: string) => {
    updateQuest(id, { title: tempTitle, description: tempDesc, progress: tempProgress, agentLabel: tempAgent });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTempTitle('');
    setTempDesc('');
    setTempProgress(0);
    setTempAgent(undefined);
  };

  return (
    <div className="quest-list">
      {quests.map(quest => {
        const cfg = DIFFICULTY_CONFIG[quest.difficulty];
        const isRecurrent = quest.recurrenceType && quest.recurrenceType !== 'single';
        const isEditing = editingId === quest.id;
        const shouldHighlight = highlightHard && !quest.completed && (quest.difficulty === 'hard' || quest.difficulty === 'legendary');

        return (
          <div 
            key={quest.id} 
            className={`quest-card ${quest.completed ? 'completed' : ''} ${shouldHighlight ? 'highlight-danger' : ''}`} 
            style={{ 
              borderLeftColor: cfg.color,
              background: quest.completed ? undefined : `linear-gradient(90deg, rgba(74, 222, 128, 0.3) ${quest.progress || 0}%, rgba(15, 20, 40, 0.9) ${quest.progress || 0}%)`,
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
              <span className="quest-difficulty" style={{ color: cfg.color }}>
                {cfg.emoji} {cfg.label} {quest.tag && <span style={{marginLeft:'6px', background:'rgba(255,255,255,0.1)', padding:'2px 8px', borderRadius:'10px', fontSize:'0.75rem', color:'#fff'}}>{quest.tag}</span>}
              </span>
              {quest.agentLabel && (() => { const acfg = AGENT_CONFIG[quest.agentLabel]; return <span className="agent-badge" style={{background: acfg.bg, color: acfg.color, border: `1px solid ${acfg.color}`, padding:'2px 8px', borderRadius:'12px', fontSize:'0.7rem', fontWeight:600, marginLeft:'4px', whiteSpace:'nowrap'}}>{acfg.emoji} {quest.agentLabel}</span>; })()}
              <span className="quest-reward">+{cfg.xp} XP | +{cfg.gold} ⚡</span>
            </div>
            
            <h3 style={{display:'flex', alignItems:'center', gap:'8px'}}>
              {quest.title} {isRecurrent && <span title="Missão Recorrente" style={{fontSize:'0.9rem', opacity:0.5}}>🔄</span>}
              {!quest.completed && !isEditing && (
                <button className="edit-icon-btn" onClick={() => handleStartEdit(quest)} title={quest.description ? 'Editar Descrição' : 'Adicionar Descrição'}>
                  ✏️
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
                  <div className="quick-edit-actions">
                    <button onClick={() => handleSave(quest.id)} className="save-desc-btn">Salvar</button>
                    <button onClick={handleCancelEdit} className="cancel-desc-btn">Cancelar</button>
                  </div>

                  <div style={{marginTop:'10px'}}>
                    <span style={{fontSize:'0.8rem', color:'var(--text-dim)', display:'block', marginBottom:'6px'}}>🤖 Executado por:</span>
                    <div style={{display:'flex', gap:'5px', flexWrap:'wrap'}}>
                      {(['Claude','Codex','Gemini','Kiro','Manual'] as QuestAgent[]).map(a => {
                        const acfg = AGENT_CONFIG[a];
                        const isSel = tempAgent === a;
                        return <button key={a} type="button" onClick={() => setTempAgent(isSel ? undefined : a)} style={{padding:'4px 10px', background: isSel ? acfg.bg : 'rgba(255,255,255,0.04)', color: isSel ? acfg.color : 'var(--text-dim)', border: `1px solid ${isSel ? acfg.color : 'rgba(255,255,255,0.08)'}`, borderRadius:'16px', cursor:'pointer', fontSize:'0.75rem', fontWeight: isSel ? 600 : 400, transition:'all 0.2s'}}>{acfg.emoji} {a}</button>;
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {quest.description && <p className="quest-desc">{quest.description}</p>}
                </>
              )}
            </div>

            <div className="quest-actions" style={{marginTop:'12px'}}>
              {!quest.completed && <button className="complete-btn" onClick={() => completeQuestAction(quest.id)}>✔ Finalizar</button>}
              <button className="delete-btn" onClick={() => deleteQuest(quest.id)}>🗑️ Lixo</button>
              {isRecurrent && <button className="delete-btn" onClick={() => { if(confirm('Destruir toda a CADEIA TEMPORAL DE REPETIÇÕES dessa missão?')) deleteAllMatching(quest.id); }}>Aniquilar Série</button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
