import { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from './store';
import { useAuth } from './AuthContext';
import { loadUserData, saveUserData } from './firestoreSync';
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
import LoginScreen from './components/LoginScreen';
import missionClearSrc from './music_mission_clear.mp3';
import { bgSuspend, bgResume } from './bgAudio';

export default function App() {
  const { user, loading } = useAuth();
  const quests = useStore(s => s.quests);
  const hero = useStore(s => s.hero);
  const levelUpMsg = useStore(s => s.levelUpMsg);
  const clearLevelUpMsg = useStore(s => s.clearLevelUpMsg);
  const dayClearMsg = useStore(s => s.dayClearMsg);
  const clearDayClearMsg = useStore(s => s.clearDayClearMsg);
  
  const [filter, setFilter] = useState<'active' | 'completed' | 'calendar' | 'dashboard' | 'shop'>('active');
  const [recurrenceFilter, setRecurrenceFilter] = useState<'all' | 'single' | 'daily' | 'weekly'>('all');
  const [dataLoaded, setDataLoaded] = useState(false);

  // Auto-save debounce ref
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref to track if cleanup has run
  const cleanupDoneRef = useRef(false);

  // Load data from Firestore on login
  useEffect(() => {
    if (user && !dataLoaded) {
      loadUserData(user.uid).then(() => setDataLoaded(true));
    }
    if (!user) {
      setDataLoaded(false);
      cleanupDoneRef.current = false;
    }
  }, [user, dataLoaded]);

  // One-time cleanup: delete quests with scheduledDate before 2026-04-24
  useEffect(() => {
    if (!user || !dataLoaded || cleanupDoneRef.current) return;
    cleanupDoneRef.current = true;
    const cutoff = new Date('2026-04-24T00:00:00').getTime();
    const currentQuests = useStore.getState().quests;
    const cleaned = currentQuests.filter(q => q.scheduledDate >= cutoff);
    if (cleaned.length < currentQuests.length) {
      console.log(`[Cleanup] Removed ${currentQuests.length - cleaned.length} old quests (before 2026-04-24)`);
      useStore.setState({ quests: cleaned });
      // Force save after cleanup
      setTimeout(() => saveUserData(user.uid), 500);
    }
  }, [user, dataLoaded]);

  // Auto-save to Firestore on data changes (debounced)
  useEffect(() => {
    if (!user || !dataLoaded) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveUserData(user.uid);
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [quests, hero, user, dataLoaded]);

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

      // Optimize confetti: fire 4 bursts instead of a heavy CPU loop
      let burstCount = 0;
      const interval = setInterval(() => {
        confetti({ particleCount: 50, angle: 60, spread: 80, origin: { x: 0, y: 0.7 }, colors: ['#e94560', '#facc15'], zIndex: 10000 });
        confetti({ particleCount: 50, angle: 120, spread: 80, origin: { x: 1, y: 0.7 }, colors: ['#00e5ff', '#ffffff'], zIndex: 10000 });
        burstCount++;
        if (burstCount >= 4) clearInterval(interval);
      }, 500);

      setTimeout(clearLevelUpMsg, 3500);
      
      return () => clearInterval(interval);
    }
  }, [levelUpMsg, clearLevelUpMsg]);

  // Trigger Victory Fanfare for Day Clear
  useEffect(() => {
    if (dayClearMsg && !levelUpMsg) { // Avoid double trigger if both happen
      bgSuspend();
      const audio = new Audio(missionClearSrc);
      audio.volume = 0.5;
      audio.play().catch(() => {});
      audio.onended = () => { bgResume(); }

      let burstCount = 0;
      const interval = setInterval(() => {
        confetti({ particleCount: 40, angle: 90, spread: 70, origin: { x: 0.5, y: 0.7 }, colors: ['#4ade80', '#facc15'], zIndex: 10000 });
        burstCount++;
        if (burstCount >= 3) clearInterval(interval);
      }, 600);

      setTimeout(clearDayClearMsg, 4000);
      return () => clearInterval(interval);
    } else if (dayClearMsg && levelUpMsg) {
      // If both happen, clear level up will handle the music, just clear day message after some time
      setTimeout(clearDayClearMsg, 4000);
    }
  }, [dayClearMsg, levelUpMsg, clearDayClearMsg]);

  // Filter derivations - Optimized with useMemo
  const filtered = useMemo(() => {
    return quests.filter(q => filter === 'active' ? !q.completed : q.completed)
      .filter(q => {
        if (filter !== 'active' || recurrenceFilter === 'all') return true;
        return (q.recurrenceType || 'single') === recurrenceFilter;
      });
  }, [quests, filter, recurrenceFilter]);

  const { todayQuests, tomorrowQuests } = useMemo(() => {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayTs = todayStart.getTime();
    const tomorrowTs = todayTs + 86400000;
    const dayAfterTs = tomorrowTs + 86400000;

    return {
      todayQuests: quests.filter(q => !q.completed && q.scheduledDate >= todayTs && q.scheduledDate < tomorrowTs),
      tomorrowQuests: quests.filter(q => !q.completed && q.scheduledDate >= tomorrowTs && q.scheduledDate < dayAfterTs)
    };
  }, [quests]);

  // Loading state
  if (loading) {
    return (
      <div className="login-screen">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <div className="login-logo">
            <span className="login-logo-icon">⚔️</span>
            <h1 className="login-title">MissionLog</h1>
            <p className="login-subtitle">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <LoginScreen />;
  }

  return (
    <>
      <HeroScene />
      <BgMusic />
      <ButtonClickSound />
      
      {/* Background unlock logic check */}
      {(hero.bgUnlocked.includes('Estilo: Crimson Ninja (Vermelho)')) && <div style={{position:'fixed', inset:0, background:'rgba(200, 0, 0, 0.15)', pointerEvents:'none', zIndex:1}} />}
      {(hero.bgUnlocked.includes('Estilo: Matrix Hacker (Verde)')) && <div style={{position:'fixed', inset:0, background:'rgba(0, 200, 50, 0.15)', pointerEvents:'none', zIndex:1}} />}

      <div className="app" style={{ zIndex:10 }}>
        <h1 className="app-title">MissionLog</h1>

        {levelUpMsg && <div className="level-up-toast">{levelUpMsg}</div>}
        {dayClearMsg && <div className="level-up-toast day-clear">{dayClearMsg}</div>}

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
