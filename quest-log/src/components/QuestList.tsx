import { Quest, DIFFICULTY_CONFIG } from '../types';
import { useStore } from '../store';

interface Props { quests: Quest[]; }

export default function QuestList({ quests }: Props) {
  const completeQuestAction = useStore(s => s.completeQuestAction);
  const deleteQuest = useStore(s => s.deleteQuest);
  const deleteAllMatching = useStore(s => s.deleteAllMatching);

  if (quests.length === 0) return <div className="empty-msg">Nenhum rastro encontrado... O horizonte está limpo e sereno! 🗺️</div>;

  return (
    <div className="quest-list">
      {quests.map(quest => {
        const cfg = DIFFICULTY_CONFIG[quest.difficulty];
        const isRecurrent = quest.recurrenceType && quest.recurrenceType !== 'single';
        return (
          <div key={quest.id} className={`quest-card ${quest.completed ? 'completed' : ''}`} style={{ borderLeftColor: cfg.color }}>
            <div className="quest-card-header">
              <span className="quest-difficulty" style={{ color: cfg.color }}>
                {cfg.emoji} {cfg.label} {quest.tag && <span style={{marginLeft:'6px', background:'rgba(255,255,255,0.1)', padding:'2px 8px', borderRadius:'10px', fontSize:'0.75rem', color:'#fff'}}>{quest.tag}</span>}
              </span>
              <span className="quest-reward">+{cfg.xp} XP | +{cfg.gold} ⚡</span>
            </div>
            
            <h3 style={{display:'flex', alignItems:'center', gap:'8px'}}>
              {quest.title} {isRecurrent && <span title="Missão Recorrente" style={{fontSize:'0.9rem', opacity:0.5}}>🔄</span>}
            </h3>
            
            {quest.description && <p className="quest-desc">{quest.description}</p>}
            
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
