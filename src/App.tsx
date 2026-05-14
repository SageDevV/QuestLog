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
import LoginScreen from './components/LoginScreen';
import StartJourneyScreen from './components/StartJourneyScreen';
import WarningScreen from './components/WarningScreen';
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
  
  const [filter, setFilter] = useState<'active' | 'completed' | 'calendar' | 'dashboard'>('active');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [hasStartedJourney, setHasStartedJourney] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [highlightHardQuests, setHighlightHardQuests] = useState(false);
  const hasSeenWarningRef = useRef(false);

  // Auto-save debounce ref
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load data from Firestore on login
  useEffect(() => {
    if (user && !dataLoaded) {
      loadUserData(user.uid, user.email).then(() => setDataLoaded(true));
    }
    if (!user) {
      setDataLoaded(false);
      hasSeenWarningRef.current = false;
    }
  }, [user, dataLoaded]);

  // Mega Man X Warning Screen Logic
  useEffect(() => {
    if (user && dataLoaded && hasStartedJourney && !hasSeenWarningRef.current) {
      hasSeenWarningRef.current = true;
      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const tomorrowTs = todayStart.getTime() + 86400000;
      
      const currentQuests = useStore.getState().quests;
      const hasHardQuestsToday = currentQuests.some(q => 
        !q.completed && 
        q.scheduledDate >= todayStart.getTime() && 
        q.scheduledDate < tomorrowTs && 
        (q.difficulty === 'hard' || q.difficulty === 'legendary')
      );

      if (hasHardQuestsToday) {
        setShowWarning(true);
      }
    }
  }, [user, dataLoaded, hasStartedJourney]);

  // Auto-save to Firestore on data changes (debounced)
  useEffect(() => {
    if (!user || !dataLoaded) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveUserData(user.uid, user.email);
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [quests, hero, user, dataLoaded]);

  const prevQuestsCompleted = useRef(hero.questsCompleted);
  const isInitialMount = useRef(true);

  // Trigger confetti per quest automatically
  useEffect(() => {
    if (!dataLoaded) return;

    if (!isInitialMount.current && hero.questsCompleted > prevQuestsCompleted.current) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 }, zIndex: 10000 });
    }
    
    if (isInitialMount.current && dataLoaded) {
      isInitialMount.current = false;
    }
    
    prevQuestsCompleted.current = hero.questsCompleted;
  }, [hero.questsCompleted, dataLoaded]);

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

  // Undo Toast timer
  const undoToastQuestId = useStore(s => s.undoToastQuestId);
  const setUndoToastQuestId = useStore(s => s.setUndoToastQuestId);
  const undoCompleteQuestAction = useStore(s => s.undoCompleteQuestAction);

  useEffect(() => {
    if (undoToastQuestId) {
      const timer = setTimeout(() => {
        setUndoToastQuestId(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [undoToastQuestId, setUndoToastQuestId]);

  // Filter derivations - Optimized with useMemo
  const filtered = useMemo(() => {
    return quests.filter(q => filter === 'active' ? !q.completed : q.completed);
  }, [quests, filter]);

  const { pendingQuests, todayQuests, tomorrowQuests } = useMemo(() => {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayTs = todayStart.getTime();
    const tomorrowTs = todayTs + 86400000;
    const dayAfterTs = tomorrowTs + 86400000;

    return {
      pendingQuests: quests.filter(q => !q.completed && q.scheduledDate < todayTs),
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

  // Authenticated, but journey hasn't started (fixes autoplay audio blocking)
  if (!hasStartedJourney) {
    return <StartJourneyScreen onStart={() => setHasStartedJourney(true)} />;
  }

  return (
    <>
      <HeroScene />
      <BgMusic />
      <ButtonClickSound />
      
      {showWarning && <WarningScreen onClose={() => {
        setShowWarning(false);
        setHighlightHardQuests(true);
        setTimeout(() => setHighlightHardQuests(false), 3000);
      }} />}
      


      <div className="app" style={{ zIndex:10 }}>
        <h1 className="app-title">MissionLog</h1>

        {levelUpMsg && <div className="level-up-toast">{levelUpMsg}</div>}
        {dayClearMsg && <div className="level-up-toast day-clear">{dayClearMsg}</div>}

        <HeroPanel />
        {filter !== 'dashboard' && <QuestForm />}

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
        </div>

        {filter === 'dashboard' && <DashboardStats />}
        {filter === 'calendar' && (
          <QuestCalendar 
            quests={quests} 
            onComplete={useStore.getState().completeQuestAction} 
            onDelete={useStore.getState().deleteQuest}
            onDeleteSeries={useStore.getState().deleteAllMatching}
            onUpdate={useStore.getState().updateQuest}
          />
        )}

        {filter === 'active' && (
          <>
            {todayQuests.length > 0 && (
              <div className="day-section">
                <h2 className="day-section-title">📌 Hoje</h2>
                <QuestList quests={todayQuests} highlightHard={highlightHardQuests} />
              </div>
            )}
            {tomorrowQuests.length > 0 && (
              <div className="day-section">
                <h2 className="day-section-title">📅 Amanhã</h2>
                <QuestList quests={tomorrowQuests} />
              </div>
            )}
            {todayQuests.length === 0 && tomorrowQuests.length === 0 && filtered.length > 0 && <QuestList quests={filtered} />}
          </>
        )}
        
        {filter === 'completed' && <QuestList quests={filtered} />}
        
        {undoToastQuestId && (
          <div className="undo-toast">
            <div className="undo-toast-content">
              <span className="undo-toast-msg">⚔️ Missão cumprida!</span>
              <button 
                className="undo-btn" 
                onClick={() => undoCompleteQuestAction(undoToastQuestId)}
              >
                Desfazer
              </button>
            </div>
            <div className="undo-toast-progress" />
          </div>
        )}
      </div>
    </>
  );
}
