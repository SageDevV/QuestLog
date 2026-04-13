import { useState } from 'react';
import { Quest, DIFFICULTY_CONFIG } from '../types';
import QuestForm from './QuestForm';

interface Props {
  quest: Quest;
  siblingCount: number;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onDeleteAll: (id: string) => void;
}

export default function QuestCard({ quest, siblingCount, onComplete, onDelete, onDeleteAll }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [tempDesc, setTempDesc] = useState(quest.description || '');
  const updateQuest = useStore(s => s.updateQuest);

  const cfg = DIFFICULTY_CONFIG[quest.difficulty];
  const hasMultiple = siblingCount > 1;

  const handleDeleteAll = () => {
    if (window.confirm(`Excluir todas as ${siblingCount} ocorrências de "${quest.title}"?`)) {
      onDeleteAll(quest.id);
    }
  };

  const handleSaveDesc = () => {
    updateQuest(quest.id, { description: tempDesc });
    setIsEditingDesc(false);
  };

  if (isEditing) {
    return (
      <div className="quest-card editing" style={{ borderLeftColor: cfg.color }}>
        <QuestForm initialQuest={quest} onCancel={() => setIsEditing(false)} />
      </div>
    );
  }

  return (
    <div className={`quest-card ${quest.completed ? 'completed' : ''}`} style={{ borderLeftColor: cfg.color }}>
      <div className="quest-card-header">
        <span className="quest-difficulty" style={{ color: cfg.color }}>
          {cfg.emoji} {cfg.label}
        </span>
        <span className="quest-reward">+{cfg.xp}XP +{cfg.gold}⚡</span>
      </div>
      <h3>{quest.title}</h3>
      
      <div className="quest-description-area">
        {isEditingDesc ? (
          <div className="quick-edit-desc">
            <textarea 
              value={tempDesc} 
              onChange={e => setTempDesc(e.target.value)}
              placeholder="Descreva os detalhes da missão..."
              autoFocus
            />
            <div className="quick-edit-actions">
              <button onClick={handleSaveDesc} className="save-desc-btn">Salvar</button>
              <button onClick={() => setIsEditingDesc(false)} className="cancel-desc-btn">Cancelar</button>
            </div>
          </div>
        ) : (
          <>
            <p className="quest-desc">
              {quest.description || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Sem descrição...</span>}
            </p>
            {!quest.completed && (
              <button className="edit-desc-link" onClick={() => { setTempDesc(quest.description || ''); setIsEditingDesc(true); }}>
                📝 {quest.description ? 'Alterar Descrição' : 'Adicionar Descrição'}
              </button>
            )}
          </>
        )}
      </div>

      <div className="quest-actions">
        {!quest.completed && (
          <>
            <button className="complete-btn" onClick={() => onComplete(quest.id)}>
              ✅ Completar
            </button>
            <button className="edit-btn" onClick={() => setIsEditing(true)} title="Editar Missão">
              ✏️
            </button>
          </>
        )}
        <button className="delete-btn" onClick={() => onDelete(quest.id)}>
          🗑️
        </button>
        {hasMultiple && (
          <button className="delete-all-btn" onClick={handleDeleteAll}>
            🗑️ Excluir todas ({siblingCount})
          </button>
        )}
      </div>
    </div>
  );
}
