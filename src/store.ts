import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Quest, Hero, ActiveFast, FastRecord, NoFapState, DailyLogEntry, SprintImpediment, TimeClockPortalAccess, DIFFICULTY_CONFIG, getTitle } from './types';
import { MAX_HISTORY } from './fastingUtils';
import { getNoFapDays } from './noFapUtils';

// Default initial state
const defaultHero = (): Hero => ({
  name: 'X', level: 1, xp: 0, xpToNext: 100, gold: 0, 
  questsCompleted: 0, title: '🔋 Rookie'
});

interface AppState {
  hero: Hero;
  quests: Quest[];
  levelUpMsg: string;
  activeFast: ActiveFast | null;
  fastHistory: FastRecord[];
  noFap: NoFapState | null;
  dailyLogs: DailyLogEntry[];
  sprintImpediments: SprintImpediment[];
  timeClockPortalAccesses: TimeClockPortalAccess[];

  // Actions
  startNoFap: () => void;
  restartNoFap: () => void;
  setNoFapStart: (startedAt: number) => void;
  startFast: (protocolId: string, targetHours: number) => void;
  updateFast: (updates: Partial<ActiveFast>) => void;
  endFast: () => void;
  saveDailyLog: (date: string, content: string) => void;
  addSprintImpediment: (title: string, details: string) => void;
  toggleSprintImpediment: (id: string) => void;
  deleteSprintImpediment: (id: string) => void;
  recordTimeClockPortalAccess: () => void;
  setHeroName: (name: string) => void;
  resetHero: () => void;
  addQuest: (q: Quest | Quest[]) => void;
  deleteQuest: (id: string) => void;
  deleteAllMatching: (id: string) => void;
  updateQuest: (id: string, updates: Partial<Quest>) => void;
  updateAllMatching: (id: string, updates: Partial<Quest>) => void;
  completeQuestAction: (id: string) => { leveledUp: boolean, isAllDayDone: boolean };
  undoCompleteQuestAction: (id: string) => void;
  undoTodayQuestActions: () => void;
  clearLevelUpMsg: () => void;
  dayClearMsg: string;
  clearDayClearMsg: () => void;
  undoToastQuestId: string | null;
  setUndoToastQuestId: (id: string | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      hero: defaultHero(),
      quests: [],
      levelUpMsg: '',
      activeFast: null,
      fastHistory: [],
      noFap: null,
      dailyLogs: [],
      sprintImpediments: [],
      timeClockPortalAccesses: [],
      dayClearMsg: '',
      undoToastQuestId: null,

      startFast: (protocolId, targetHours) => set((s) =>
        s.activeFast ? s : { activeFast: { startedAt: Date.now(), targetHours, protocolId } }
      ),

      updateFast: (updates) => set((s) =>
        s.activeFast ? { activeFast: { ...s.activeFast, ...updates } } : s
      ),

      endFast: () => set((s) => {
        if (!s.activeFast) return s;
        const record: FastRecord = { id: `fast-${Date.now()}`, ...s.activeFast, endedAt: Date.now() };
        return { activeFast: null, fastHistory: [record, ...s.fastHistory].slice(0, MAX_HISTORY) };
      }),

      startNoFap: () => set((s) =>
        s.noFap ? s : { noFap: { startedAt: Date.now(), bestDays: 0 } }
      ),

      restartNoFap: () => set((s) => {
        if (!s.noFap) return s;
        const bestDays = Math.max(s.noFap.bestDays, getNoFapDays(s.noFap.startedAt, Date.now()));
        return { noFap: { startedAt: Date.now(), bestDays } };
      }),

      setNoFapStart: (startedAt) => set((s) =>
        s.noFap ? { noFap: { ...s.noFap, startedAt } } : s
      ),

      setUndoToastQuestId: (id) => set({ undoToastQuestId: id }),

      saveDailyLog: (date, content) => set((s) => {
        const normalizedContent = content.trim();
        const existing = s.dailyLogs.find(entry => entry.date === date);
        if (!normalizedContent) {
          return existing ? { dailyLogs: s.dailyLogs.filter(entry => entry.date !== date) } : s;
        }
        const entry: DailyLogEntry = {
          id: existing?.id ?? `daily-log-${date}`,
          date,
          content: normalizedContent,
          updatedAt: Date.now(),
        };
        return {
          dailyLogs: existing
            ? s.dailyLogs.map(current => current.date === date ? entry : current)
            : [entry, ...s.dailyLogs],
        };
      }),

      addSprintImpediment: (title, details) => set((s) => {
        const normalizedTitle = title.trim();
        if (!normalizedTitle) return s;
        const impediment: SprintImpediment = {
          id: crypto.randomUUID(),
          title: normalizedTitle,
          details: details.trim(),
          resolved: false,
          createdAt: Date.now(),
        };
        return { sprintImpediments: [impediment, ...s.sprintImpediments] };
      }),

      toggleSprintImpediment: (id) => set((s) => ({
        sprintImpediments: s.sprintImpediments.map(item => item.id === id
          ? { ...item, resolved: !item.resolved, resolvedAt: item.resolved ? undefined : Date.now() }
          : item),
      })),

      deleteSprintImpediment: (id) => set((s) => ({
        sprintImpediments: s.sprintImpediments.filter(item => item.id !== id),
      })),

      recordTimeClockPortalAccess: () => set((s) => ({
        timeClockPortalAccesses: [{ id: crypto.randomUUID(), accessedAt: Date.now() }, ...s.timeClockPortalAccesses].slice(0, 60),
      })),

      setHeroName: (name) => set((s) => ({ hero: { ...s.hero, name } })),
      resetHero: () => set((s) => ({ 
        hero: { ...defaultHero(), name: s.hero.name },
        quests: s.quests.filter(q => !q.completed)
      })),
      
      addQuest: (questOrQuests) => {
        const arr = Array.isArray(questOrQuests) ? questOrQuests : [questOrQuests];
        set((s) => ({ quests: [...arr, ...s.quests] }));
      },
      
      deleteQuest: (id) => set((s) => ({ quests: s.quests.filter(q => q.id !== id) })),
      
      deleteAllMatching: (id) => {
        set((s) => {
          const target = s.quests.find(q => q.id === id);
          if (!target) return s;
          return {
            quests: s.quests.filter(q =>
              !(q.title === target.title &&
                q.difficulty === target.difficulty &&
                (q.recurrenceType || 'single') === (target.recurrenceType || 'single') &&
                (q.recurrenceType || 'single') !== 'single')
            )
          };
        });
      },

      updateQuest: (id, updates) => {
        set((s) => ({
          quests: s.quests.map(q => q.id === id ? { ...q, ...updates } : q)
        }));
      },

      updateAllMatching: (id, updates) => {
        set((s) => {
          const target = s.quests.find(q => q.id === id);
          if (!target) return s;
          return {
            quests: s.quests.map(q => {
              const isMatch = q.title === target.title &&
                q.difficulty === target.difficulty &&
                (q.recurrenceType || 'single') === (target.recurrenceType || 'single') &&
                (q.recurrenceType || 'single') !== 'single' &&
                !q.completed; 
              return isMatch ? { ...q, ...updates } : q;
            })
          };
        });
      },



      completeQuestAction: (id) => {
        const state = get();
        const quest = state.quests.find(q => q.id === id);
        if (!quest) return { leveledUp: false, isAllDayDone: false };

        const config = DIFFICULTY_CONFIG[quest.difficulty];
        let newHero = { ...state.hero };
        newHero.xp += config.xp;
        let leveledUp = false;

        while (newHero.xp >= newHero.xpToNext) {
          newHero.xp -= newHero.xpToNext;
          newHero.level++;
          newHero.xpToNext = Math.floor(newHero.xpToNext * 1.3);
          leveledUp = true;
        }

        newHero.gold += config.gold;
        newHero.questsCompleted++;
        newHero.title = getTitle(newHero.level);

        const streakDay = new Date();
        streakDay.setHours(0, 0, 0, 0);
        const streakToday = streakDay.getTime();
        if (newHero.streakLastDate !== streakToday) {
          const yesterday = new Date(streakToday);
          yesterday.setDate(yesterday.getDate() - 1);
          const continues = newHero.streakLastDate === yesterday.getTime();
          newHero.streak = continues ? (newHero.streak ?? 0) + 1 : 1;
          newHero.streakLastDate = streakToday;
        }

        const newQuests = state.quests.map(q => q.id === id ? { ...q, completed: true, completedAt: Date.now() } : q);
        
        let localMessage = leveledUp ? `⚡ Level Up! Você alcançou o nível ${newHero.level}! Novo título: ${newHero.title}` : '';

        // Check if ALL quests for TODAY (current date) are done
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayTs = todayStart.getTime();
        const todayEnd = todayTs + 86400000;
        
        const isQuestForToday = quest.scheduledDate >= todayTs && quest.scheduledDate < todayEnd;
        
        let isAllDayDone = false;
        if (isQuestForToday) {
          const todayQuests = newQuests.filter(q => q.scheduledDate >= todayTs && q.scheduledDate < todayEnd);
          isAllDayDone = todayQuests.length > 0 && todayQuests.every(q => q.completed);
        }
        
        let dayClearMsg = '';
        if (isAllDayDone) {
          dayClearMsg = '🏆 Todas as missões do dia foram concluídas! Vitória!';
        }

        set({ hero: newHero, quests: newQuests, levelUpMsg: localMessage, dayClearMsg, undoToastQuestId: id });
        return { leveledUp, isAllDayDone };
      },

      undoCompleteQuestAction: (id) => {
        const state = get();
        const quest = state.quests.find(q => q.id === id);
        if (!quest || !quest.completed) return;

        const config = DIFFICULTY_CONFIG[quest.difficulty];
        let newHero = { ...state.hero };
        
        // Revert rewards
        newHero.xp -= config.xp;
        newHero.gold -= config.gold;
        newHero.questsCompleted--;

        // Revert level up if necessary
        while (newHero.xp < 0 && newHero.level > 1) {
          newHero.level--;
          newHero.xpToNext = Math.ceil(newHero.xpToNext / 1.3);
          newHero.xp += newHero.xpToNext;
        }
        if (newHero.xp < 0) newHero.xp = 0;

        newHero.title = getTitle(newHero.level);

        const newQuests = state.quests.map(q => q.id === id ? { ...q, completed: false, completedAt: undefined } : q);
        
        set({ hero: newHero, quests: newQuests, dayClearMsg: '', undoToastQuestId: null });
      },

      undoTodayQuestActions: () => {
        const state = get();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = today.getTime();
        const todayEnd = todayStart + 86400000;
        const completedToday = state.quests
          .filter(q => q.completed && q.scheduledDate >= todayStart && q.scheduledDate < todayEnd)
          .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));

        if (completedToday.length === 0) return;

        const newHero = { ...state.hero };
        for (const quest of completedToday) {
          const config = DIFFICULTY_CONFIG[quest.difficulty];
          newHero.xp -= config.xp;
          newHero.gold -= config.gold;
          newHero.questsCompleted--;

          while (newHero.xp < 0 && newHero.level > 1) {
            newHero.level--;
            newHero.xpToNext = Math.ceil(newHero.xpToNext / 1.3);
            newHero.xp += newHero.xpToNext;
          }
        }

        newHero.xp = Math.max(0, newHero.xp);
        newHero.gold = Math.max(0, newHero.gold);
        newHero.questsCompleted = Math.max(0, newHero.questsCompleted);
        newHero.title = getTitle(newHero.level);

        const newQuests = state.quests.map(q =>
          completedToday.some(completedQuest => completedQuest.id === q.id)
            ? { ...q, completed: false, completedAt: undefined }
            : q
        );
        const hasOtherCompletionToday = newQuests.some(q => q.completedAt && q.completedAt >= todayStart && q.completedAt < todayEnd);
        if (!hasOtherCompletionToday && newHero.streakLastDate === todayStart) {
          const yesterday = new Date(todayStart);
          yesterday.setDate(yesterday.getDate() - 1);
          newHero.streak = Math.max(0, (newHero.streak ?? 1) - 1);
          newHero.streakLastDate = newHero.streak > 0 ? yesterday.getTime() : undefined;
        }

        set({ hero: newHero, quests: newQuests, levelUpMsg: '', dayClearMsg: '', undoToastQuestId: null });
      },

      clearLevelUpMsg: () => set({ levelUpMsg: '' }),
      clearDayClearMsg: () => set({ dayClearMsg: '' })
    }),
    {
      name: 'questlog-global-storage',
    }
  )
);
