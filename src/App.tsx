import HudIcon from './components/HudIcon';
import { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { useStore } from './store';
import { useAuth } from './AuthContext';
import { loadUserData, saveUserData } from './firestoreSync';
import HeroPanel from './components/HeroPanel';
import QuestForm from './components/QuestForm';
import QuestList from './components/QuestList';
import HeroScene from './components/HeroScene';
import BgMusic from './components/BgMusic';
import ButtonClickSound from './components/ButtonClickSound';
const QuestCalendar = lazy(() => import('./components/QuestCalendar'));
const FastingTimer = lazy(() => import('./components/FastingTimer'));
const NoFapCounter = lazy(() => import('./components/NoFapCounter'));
const DashboardStats = lazy(() => import('./components/DashboardStats'));
const DailyLog = lazy(() => import('./components/DailyLog'));
const SprintImpediments = lazy(() => import('./components/SprintImpediments'));
const TimeClock = lazy(() => import('./components/TimeClock'));
const ClockTools = lazy(() => import('./components/ClockTools'));
import LoginScreen from './components/LoginScreen';
import StartJourneyScreen from './components/StartJourneyScreen';
import WarningScreen from './components/WarningScreen';
import missionClearSrc from './music_mission_clear.mp3';
import { bgSuspend, bgResume } from './bgAudio';

export default function App() {
  const { user, loading } = useAuth();
  const quests = useStore(s => s.quests);
  const hero = useStore(s => s.hero);
  const activeFast = useStore(s => s.activeFast);
  const fastHistory = useStore(s => s.fastHistory);
  const noFap = useStore(s => s.noFap);
  const dailyLogs = useStore(s => s.dailyLogs);
  const sprintImpediments = useStore(s => s.sprintImpediments);
  const timeClockPortalAccesses = useStore(s => s.timeClockPortalAccesses);
  const countdownTimers = useStore(s => s.countdownTimers);
  const sprintAlarms = useStore(s => s.sprintAlarms);
  const levelUpMsg = useStore(s => s.levelUpMsg);
  const clearLevelUpMsg = useStore(s => s.clearLevelUpMsg);
  const dayClearMsg = useStore(s => s.dayClearMsg);
  const clearDayClearMsg = useStore(s => s.clearDayClearMsg);
  const undoTodayQuestActions = useStore(s => s.undoTodayQuestActions);
  
  const [filter, setFilter] = useState<'active' | 'completed' | 'calendar' | 'dashboard' | 'fasting' | 'nofap' | 'dailylog' | 'impediments' | 'timeclock' | 'clocks'>('active');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [storeHydrated, setStoreHydrated] = useState(false);
  const [hasStartedJourney, setHasStartedJourney] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [highlightHardQuests, setHighlightHardQuests] = useState(false);
  const hasSeenWarningRef = useRef(false);

  // Auto-save debounce ref
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef(false);

  // Wait for Zustand persist hydration
  useEffect(() => {
    if (useStore.persist.hasHydrated()) {
      setStoreHydrated(true);
      return;
    }
    const unsub = useStore.persist.onFinishHydration(() => {
      setStoreHydrated(true);
    });
    return () => unsub();
  }, []);

  // Load data from Firestore on login once store is hydrated
  useEffect(() => {
    if (user && storeHydrated && !dataLoaded) {
      loadUserData(user.uid, user.email).then(() => setDataLoaded(true));
    }
    if (!user) {
      setDataLoaded(false);
      hasSeenWarningRef.current = false;
    }
  }, [user, storeHydrated, dataLoaded]);

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

    pendingSaveRef.current = true;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      pendingSaveRef.current = false;
      saveUserData(user.uid, user.email);
    }, 200);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [quests, hero, activeFast, fastHistory, noFap, dailyLogs, sprintImpediments, timeClockPortalAccesses, countdownTimers, sprintAlarms, user, dataLoaded]);

  // Flush pending saves immediately when page becomes hidden or unloads
  useEffect(() => {
    const flushSave = () => {
      if (pendingSaveRef.current && user) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        pendingSaveRef.current = false;
        saveUserData(user.uid, user.email);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushSave();
      }
    };

    window.addEventListener('beforeunload', flushSave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', flushSave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Trigger mega Level Up Fanfare
  useEffect(() => {
    if (levelUpMsg) {
      bgSuspend();
      const audio = new Audio(missionClearSrc);
      audio.volume = 0.5;
      audio.play().catch(() => {});
      audio.onended = () => { bgResume(); }

      const timer = setTimeout(clearLevelUpMsg, 3500);
      return () => clearTimeout(timer);
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

      const timer = setTimeout(clearDayClearMsg, 4300);
      return () => clearTimeout(timer);
    } else if (dayClearMsg && levelUpMsg) {
      // If both happen, clear level up will handle the music, just clear day message after some time
      const timer = setTimeout(clearDayClearMsg, 4300);
      return () => clearTimeout(timer);
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

  const completedTodayCount = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTs = todayStart.getTime();
    const todayEnd = todayTs + 86400000;
    return quests.filter(q => q.completed && q.scheduledDate >= todayTs && q.scheduledDate < todayEnd).length;
  }, [quests]);

  // Loading state
  if (loading) {
    return (
      <div className="login-screen">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <div className="login-logo">
            <span className="login-logo-icon"><HudIcon name="crest" /></span>
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
      {dayClearMsg && (
        <div className="stage-clear-overlay" role="status" aria-live="assertive">
          <div className="stage-clear-beam stage-clear-beam-left" />
          <div className="stage-clear-beam stage-clear-beam-right" />
          <div className="stage-clear-panel">
            <div className="stage-clear-corners" aria-hidden="true" />
            <p className="stage-clear-kicker">MAVERICK HUNTER SYSTEM // DAILY OPERATION</p>
            <div className="stage-clear-title"><span>STAGE</span><strong>CLEAR</strong></div>
            <div className="stage-clear-energy" aria-hidden="true"><i /><i /><i /><i /><i /></div>
            <p className="stage-clear-message">SETOR DO DIA NEUTRALIZADO</p>
            <div className="stage-clear-readout"><span>RANK <b>S</b></span><span>ALL OBJECTIVES COMPLETE</span></div>
            <button type="button" className="stage-clear-undo" onClick={undoTodayQuestActions}>↶ DESFAZER CONCLUSÕES DE HOJE</button>
          </div>
        </div>
      )}
      


      <div className="app" style={{ zIndex:10 }}>
        <header className="app-header">
          <div className="app-brand">
            <span className="app-brand-icon" aria-hidden="true"><HudIcon name="crest" /></span>
            <div>
              <p className="app-eyebrow">Seu centro de comando</p>
              <h1 className="app-title">MissionLog</h1>
            </div>
          </div>
          <span className="app-status"><span aria-hidden="true" /> Jornada em andamento</span>
        </header>

        {levelUpMsg && <div className="level-up-toast"><HudIcon name="bolt" /> {levelUpMsg.replace(/^⚡\s*/, '')}</div>}

        <HeroPanel />
        {filter !== 'dashboard' && filter !== 'fasting' && filter !== 'nofap' && filter !== 'dailylog' && filter !== 'impediments' && filter !== 'timeclock' && filter !== 'clocks' && <QuestForm />}

        <nav className="filter-bar" aria-label="Seções da jornada">
          <button className={filter === 'active' ? 'active' : ''} aria-pressed={filter === 'active'} onClick={() => setFilter('active')}>
            <HudIcon name="missions" /> Ativas ({quests.filter(q => !q.completed).length})
          </button>
          <button className={filter === 'completed' ? 'active' : ''} aria-pressed={filter === 'completed'} onClick={() => setFilter('completed')}>
            <HudIcon name="check" /> Completas
          </button>
          <button className={filter === 'calendar' ? 'active' : ''} aria-pressed={filter === 'calendar'} onClick={() => setFilter('calendar')}>
            <HudIcon name="calendar" /> Calendário
          </button>
          <button className={`dashboard-tab${filter === 'dashboard' ? ' active' : ''}`} aria-pressed={filter === 'dashboard'} onClick={() => setFilter('dashboard')}>
            <HudIcon name="chart" /> Dashboard
          </button>
          <button className={filter === 'fasting' ? 'active' : ''} aria-pressed={filter === 'fasting'} onClick={() => setFilter('fasting')}>
            <HudIcon name="timer" /> Jejum{activeFast ? ' •' : ''}
          </button>
          <button className={filter === 'nofap' ? 'active' : ''} aria-pressed={filter === 'nofap'} onClick={() => setFilter('nofap')}>
            <HudIcon name="shield" /> No fap{noFap ? ' •' : ''}
          </button>
          <button className={filter === 'dailylog' ? 'active' : ''} aria-pressed={filter === 'dailylog'} onClick={() => setFilter('dailylog')}>
            <HudIcon name="book" /> Daily Log
          </button>
          <button className={filter === 'impediments' ? 'active' : ''} aria-pressed={filter === 'impediments'} onClick={() => setFilter('impediments')}>
            <HudIcon name="alert" /> Impedimentos{sprintImpediments.some(item => !item.resolved) ? ' •' : ''}
          </button>
          <button className={filter === 'timeclock' ? 'active' : ''} aria-pressed={filter === 'timeclock'} onClick={() => setFilter('timeclock')}>
            <HudIcon name="clock" /> Controle de Ponto
          </button>
          <button className={filter === 'clocks' ? 'active' : ''} aria-pressed={filter === 'clocks'} onClick={() => setFilter('clocks')}>
            <HudIcon name="timer" /> Relógios
          </button>
        </nav>

        <Suspense fallback={<div className="empty-msg">Carregando...</div>}>
        {filter === 'dashboard' && <DashboardStats />}
        {filter === 'fasting' && <FastingTimer />}
        {filter === 'nofap' && <NoFapCounter />}
        {filter === 'dailylog' && <DailyLog />}
        {filter === 'impediments' && <SprintImpediments />}
        {filter === 'timeclock' && <TimeClock />}
        {filter === 'clocks' && <ClockTools />}
        {filter === 'calendar' && (
          <QuestCalendar 
            quests={quests} 
            onComplete={useStore.getState().completeQuestAction} 
            onDelete={useStore.getState().deleteQuest}
            onDeleteSeries={useStore.getState().deleteAllMatching}
            onUpdate={useStore.getState().updateQuest}
          />
        )}
        </Suspense>

        {filter === 'active' && (
          <>
            {todayQuests.length > 0 && (
              <div className="day-section">
                <h2 className="day-section-title"><HudIcon name="pin" /> Hoje</h2>
                <QuestList quests={todayQuests} highlightHard={highlightHardQuests} />
              </div>
            )}
            {tomorrowQuests.length > 0 && (
              <div className="day-section">
                <h2 className="day-section-title"><HudIcon name="calendar" /> Amanhã</h2>
                <QuestList quests={tomorrowQuests} />
              </div>
            )}
            {todayQuests.length === 0 && tomorrowQuests.length === 0 && filtered.length > 0 && <QuestList quests={filtered} />}
          </>
        )}
        
        {filter === 'completed' && (
          <>
            {completedTodayCount > 0 && <button type="button" className="day-undo-btn" onClick={undoTodayQuestActions}>↶ Reabrir {completedTodayCount} {completedTodayCount > 1 ? 'missões' : 'missão'} de hoje</button>}
            <QuestList quests={filtered} />
          </>
        )}
        
        {undoToastQuestId && (
          <div className="undo-toast">
            <div className="undo-toast-content">
              <span className="undo-toast-msg"><HudIcon name="crest" /> Missão cumprida!</span>
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
