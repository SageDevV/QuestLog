import { useState, useEffect } from 'react';
import { useStore } from './store';
import confetti from 'canvas-confetti';
import HeroPanel from './components/HeroPanel';
import QuestForm from './components/QuestForm';
import QuestList from './components/QuestList';
import HeroScene from './components/HeroScene';
import BgMusic from './components/BgMusic';
import ButtonClickSound from './components/ButtonClickSound';
import QuestCalendar from './components/QuestCalendar';
import DashboardStats from './components/DashboardStats';
import ShopTavern from './components/ShopTavern';
import missionClearSrc from './music_mission_clear.mp3';
import { bgSuspend, bgResume } from './bgAudio';

export default function App() {
  const quests = useStore(s => s.quests);
  const hero = useStore(s => s.hero);
  const levelUpMsg = useStore(s => s.levelUpMsg);
  const clearLevelUpMsg = useStore(s => s.clearLevelUpMsg);
  
  const [filter, setFilter] = useState<'active' | 'completed' | 'calendar' | 'dashboard' | 'shop'>('active');
  const [recurrenceFilter, setRecurrenceFilter] = useState<'all' | 'single' | 'daily' | 'weekly'>('all');

  // Trigger confetti per quest automatically
  useEffect(() => {
    if (hero.questsCompleted > 0) confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 }, zIndex: 10000 });
  }, [hero.questsCompleted]);

  // Trigger mega Level Up Fanfare
  useEffect(() => {
    if (levelUpMsg) {
      bgSuspend();
      const audio = new Audio(missionClearSrc);
      audio.volume = 0.5;
      audio.play().catch(() => {});
      audio.onended = () => { bgResume(); }

      const duration = 2500;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({ particleCount: 15, angle: 60, spread: 80, origin: { x: 0 }, colors: ['#e94560', '#facc15'], zIndex: 10000 });
        confetti({ particleCount: 15, angle: 120, spread: 80, origin: { x: 1 }, colors: ['#00e5ff', '#ffffff'], zIndex: 10000 });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
      setTimeout(clearLevelUpMsg, 3500);
    }
  }, [levelUpMsg, clearLevelUpMsg]);

  // Filter derivations
  const filtered = quests.filter(q => filter === 'active' ? !q.completed : q.completed)
    .filter(q => {
      if (filter !== 'active' || recurrenceFilter === 'all') return true;
      return (q.recurrenceType || 'single') === recurrenceFilter;
    });

  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayTs = todayStart.getTime();
  const tomorrowTs = todayTs + 86400000;
  const dayAfterTs = tomorrowTs + 86400000;

  const todayQuests = quests.filter(q => !q.completed && q.scheduledDate >= todayTs && q.scheduledDate < tomorrowTs);
  const tomorrowQuests = quests.filter(q => !q.completed && q.scheduledDate >= tomorrowTs && q.scheduledDate < dayAfterTs);

  return (
    <>
      <HeroScene />
      <BgMusic />
      <ButtonClickSound />
      
      {/* Background unlock logic check */}
      {(hero.bgUnlocked.includes('Estilo: Crimson Ninja (Vermelho)')) && <div style={{position:'fixed', inset:0, background:'rgba(200, 0, 0, 0.2)', pointerEvents:'none', zIndex:1, mixBlendMode:'overlay'}} />}
      {(hero.bgUnlocked.includes('Estilo: Matrix Hacker (Verde)')) && <div style={{position:'fixed', inset:0, background:'rgba(0, 200, 50, 0.2)', pointerEvents:'none', zIndex:1, mixBlendMode:'overlay'}} />}

      <div className="app" style={{ zIndex:10 }}>
        <h1 className="app-title">QuestLog 2.0</h1>

        {levelUpMsg && <div className="level-up-toast">{levelUpMsg}</div>}

        <HeroPanel />
        {filter !== 'shop' && filter !== 'dashboard' && <QuestForm />}

        <div className="filter-bar" style={{ flexWrap: 'wrap', marginBottom:'25px' }}>
          <button className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>
            📋 Ativas ({quests.filter(q => !q.completed).length})
          </button>
          <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>
            ✅ Completas
          </button>
          <button className={filter === 'calendar' ? 'active' : ''} onClick={() => setFilter('calendar')}>
            📅 Calendário
          </button>
          <button className={filter === 'dashboard' ? 'active' : ''} onClick={() => setFilter('dashboard')} style={{ background: filter === 'dashboard' ? '#00e5ff' : 'rgba(0,229,255,0.1)', color: filter === 'dashboard' ? '#000': '#00e5ff', borderColor:'#00e5ff'}}>
            📊 Dashboard
          </button>
          <button className={filter === 'shop' ? 'active' : ''} onClick={() => setFilter('shop')} style={{ background: filter === 'shop' ? '#facc15' : 'rgba(250, 204, 21, 0.1)', color: filter === 'shop' ? '#000': '#facc15', borderColor:'#facc15'}}>
            🍻 Taverna
          </button>
        </div>

        {filter === 'dashboard' && <DashboardStats />}
        {filter === 'shop' && <ShopTavern />}
        {filter === 'calendar' && <QuestCalendar quests={quests} onComplete={() => {}} />}

        {filter === 'active' && (
          <>
            {todayQuests.length > 0 && (
              <div className="day-section">
                <h2 className="day-section-title">📌 Hoje</h2>
                <QuestList quests={todayQuests} />
              </div>
            )}
            {tomorrowQuests.length > 0 && (
              <div className="day-section">
                <h2 className="day-section-title">📅 Amanhã</h2>
                <QuestList quests={tomorrowQuests} />
              </div>
            )}
            <div className="recurrence-filter-bar">
              {(['all', 'single', 'daily', 'weekly'] as const).map(rt => (
                <button
                  key={rt}
                  className={recurrenceFilter === rt ? 'active' : ''}
                  onClick={() => setRecurrenceFilter(rt)}
                >
                  {rt === 'all' ? 'Todas' : rt === 'single' ? 'Únicas' : rt === 'daily' ? 'Diárias' : 'Semanais'}
                </button>
              ))}
            </div>
            {todayQuests.length === 0 && tomorrowQuests.length === 0 && filtered.length > 0 && <QuestList quests={filtered} />}
          </>
        )}
        
        {filter === 'completed' && <QuestList quests={filtered} />}
      </div>
    </>
  );
}
