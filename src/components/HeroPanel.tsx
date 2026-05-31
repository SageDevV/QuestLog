import { useState } from 'react';
import { useStore } from '../store';
import { useAuth } from '../AuthContext';

export default function HeroPanel() {
  const { hero, quests, setHeroName, resetHero } = useStore();
  const { user, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState(hero.name);

  const handleSave = () => { if (tempName.trim()) setHeroName(tempName.trim()); setEditing(false); };

  const barWidth = Math.min(100, Math.max(0, (hero.xp / hero.xpToNext) * 100));


  return (
    <div className="hero-panel">
      {/* User info bar */}
      {user && (
        <div className="user-bar">
          <div className="user-info">
            {user.photoURL && <img src={user.photoURL} alt="" className="user-avatar" referrerPolicy="no-referrer" />}
            <span className="user-email">{user.displayName || user.email}</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="logout-btn" onClick={signOut} title="Sair da conta">
              🚪 Sair
            </button>
          </div>
        </div>
      )}

      <div className="hero-header">
        {editing ? (
          <div className="hero-edit">
            <input value={tempName} onChange={e => setTempName(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && handleSave()} />
            <button onClick={handleSave}>Salvar</button>
          </div>
        ) : (
          <h2 onClick={() => { setTempName(hero.name); setEditing(true); }} title="Clique para renomear">
            {hero.name} <span className="hero-title">{hero.title}</span>
          </h2>
        )}
        <span className="hero-level">Nível {hero.level}</span>
      </div>

      <div className="xp-bar-container">
        <div className="xp-bar" style={{ width: `${barWidth}%` }} />
        <span className="xp-label">{hero.xp} / {hero.xpToNext} XP</span>
      </div>

      <div className="hero-stats">
        <span>⚡ {hero.gold} Gold</span>
        <span>✅ {hero.questsCompleted} Missões</span>
        <button className="reset-btn" onClick={() => { if (confirm('Zerar seu progresso e golds? (Missões concluídas serão apagadas, pendentes serão mantidas)')) resetHero(); }}>Resetar Vida</button>
        <button onClick={() => { if(confirm('Deseja realmente definir a tag "Manual" para todas as quests concluídas?')) useStore.getState().setManualTagOnCompletedQuests(); }}>Set Manual Tag</button>
      </div>
    </div>
  );
}
