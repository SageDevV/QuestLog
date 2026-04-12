import { Quest, DIFFICULTY_CONFIG } from '../types';

interface Props {
  quest: Quest;
  siblingCount: number;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onDeleteAll: (id: string) => void;
}

export default function QuestCard({ quest, siblingCount, onComplete, onDelete, onDeleteAll }: Props) {
  const cfg = DIFFICULTY_CONFIG[quest.difficulty];
  const hasMultiple = siblingCount > 1;

  const handleDeleteAll = () => {
    if (window.confirm(`Excluir todas as ${siblingCount} ocorrências de "${quest.title}"?`)) {
      onDeleteAll(quest.id);
    }
  };

  return (
    <div className={`quest-card ${quest.completed ? 'completed' : ''}`} style={{ borderLeftColor: cfg.color }}>
      <div className="quest-card-header">
        <span className="quest-difficulty" style={{ color: cfg.color }}>
          {cfg.emoji} {cfg.label}
        </span>
        <span className="quest-reward">+{cfg.xp}XP +{cfg.gold}⚡</span>
      </div>
      <h3>{quest.title}</h3>
      {quest.description && <p className="quest-desc">{quest.description}</p>}
      <div className="quest-actions">
        {!quest.completed && (
          <button className="complete-btn" onClick={() => onComplete(quest.id)}>
            ✅ Completar
          </button>
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
