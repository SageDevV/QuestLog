import { useState, useRef, useEffect } from 'react';
import { Quest, DIFFICULTY_CONFIG } from '../types';
import { useStore } from '../store';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const updateQuest = useStore(s => s.updateQuest);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [isExpanded, isEditingDesc, quest.description]);

  const toggleExpand = (e: React.MouseEvent) => {
    // Don't toggle if clicking a button or interactive element
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('textarea') || target.closest('input')) return;
    setIsExpanded(prev => !prev);
  };

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
    <div
      className={`quest-card ${quest.completed ? 'completed' : ''} ${isExpanded ? 'expanded' : 'collapsed'}`}
      style={{ borderLeftColor: cfg.color }}
      onClick={toggleExpand}
    >
      <div className="quest-card-header">
        <span className="quest-difficulty" style={{ color: cfg.color }}>
          {cfg.emoji} {cfg.label}
        </span>
        <span className="quest-reward">+{cfg.xp}XP +{cfg.gold}⚡</span>
      </div>

      <div className="quest-card-title-row">
        <h3>{quest.title}</h3>
        <span className={`expand-chevron ${isExpanded ? 'open' : ''}`}>▾</span>
      </div>

      {/* Collapsed preview: show truncated description */}
      {!isExpanded && quest.description && (
        <p className="quest-desc quest-desc-truncated">
          {quest.description}
        </p>
      )}

      {/* Expanded content */}
      <div
        ref={contentRef}
        className="quest-card-expandable"
        style={{ maxHeight: isExpanded ? (contentHeight ?? 'none') : 0 }}
      >
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
    </div>
  );
}
