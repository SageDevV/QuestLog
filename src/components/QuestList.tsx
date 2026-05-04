import { useState } from 'react';
import { Quest, DIFFICULTY_CONFIG } from '../types';
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

  if (quests.length === 0) return <div className="empty-msg">Nenhum rastro encontrado... O horizonte está limpo e sereno! 🗺️</div>;

  const handleStartEdit = (quest: Quest) => {
    setEditingId(quest.id);
    setTempTitle(quest.title);
    setTempDesc(quest.description || '');
    setTempProgress(quest.progress || 0);
  };

  const handleSave = (id: string) => {
    updateQuest(id, { title: tempTitle, description: tempDesc, progress: tempProgress });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTempTitle('');
    setTempDesc('');
    setTempProgress(0);
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
              background: quest.completed ? undefined : `linear-gradient(90deg, rgba(74, 222, 128, 0.15) ${quest.progress || 0}%, rgba(22, 33, 62, 0.85) ${quest.progress || 0}%)`
            }}
          >
            <div className="quest-card-header">
              <span className="quest-difficulty" style={{ color: cfg.color }}>
                {cfg.emoji} {cfg.label} {quest.tag && <span style={{marginLeft:'6px', background:'rgba(255,255,255,0.1)', padding:'2px 8px', borderRadius:'10px', fontSize:'0.75rem', color:'#fff'}}>{quest.tag}</span>}
              </span>
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
