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

  const sendWhatsAppTest = async () => {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const tomorrowTs = todayStart.getTime() + 86400000;
    
    const todayQuests = quests.filter(q => 
      q.scheduledDate >= todayStart.getTime() && 
      q.scheduledDate < tomorrowTs
    );

    if (todayQuests.length === 0) {
      alert("Nenhuma missão agendada para hoje!");
      return;
    }

    const dateStr = todayStart.toLocaleDateString('pt-BR');
    let message = `🧪 *Teste WhatsApp: Missões de Hoje* (${dateStr})\n\n`;
    message += `Olá, ${hero.name}! Este é um teste de conectividade:\n\n`;
    
    todayQuests.forEach((q, index) => {
      const status = q.completed ? '✅' : (q.difficulty === 'legendary' ? '🟣' : q.difficulty === 'hard' ? '🔴' : q.difficulty === 'medium' ? '🟡' : '🟢');
      message += `${index + 1}. ${status} *${q.title}*\n`;
    });
    
    message += `\n👉 https://questlog-app-a5e29.web.app/`;

    const apiKey = import.meta.env.VITE_CALLMEBOT_API_KEY;
    const phone = import.meta.env.VITE_RECIPIENT_PHONE_NUMBER;

    if (!apiKey || !phone) {
      alert("Configuração do WhatsApp não encontrada (VITE_CALLMEBOT_API_KEY)");
      return;
    }

    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apiKey}&source=php`;
    
    // Abrir em nova aba para contornar restrições de CORS e permitir que o usuário veja a resposta da API
    window.open(url, '_blank');
    alert("🚀 Uma nova aba foi aberta com o comando de envio. Se a página exibir 'Message queued', sua configuração está correta!");
  };

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
            <button 
              className="whatsapp-test-btn" 
              onClick={sendWhatsAppTest} 
              title="Testar conexão WhatsApp"
              style={{ background: 'rgba(37, 211, 102, 0.1)', color: '#25D366', border: '1px solid #25D366', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              🟢 Testar WhatsApp
            </button>
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
      </div>
    </div>
  );
}
