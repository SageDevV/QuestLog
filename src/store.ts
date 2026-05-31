import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Quest, Hero, DIFFICULTY_CONFIG, getTitle } from './types';

// Default initial state
const defaultHero = (): Hero => ({
  name: 'X', level: 1, xp: 0, xpToNext: 100, gold: 0, 
  questsCompleted: 0, title: '🔋 Rookie'
});

interface AppState {
  hero: Hero;
  quests: Quest[];
  levelUpMsg: string;
  
  // Actions
  setHeroName: (name: string) => void;
  resetHero: () => void;
  addQuest: (q: Quest | Quest[]) => void;
  deleteQuest: (id: string) => void;
  deleteAllMatching: (id: string) => void;
  updateQuest: (id: string, updates: Partial<Quest>) => void;
  updateAllMatching: (id: string, updates: Partial<Quest>) => void;
  setManualTagOnAllQuests: () => void;
  completeQuestAction: (id: string) => { leveledUp: boolean, isAllDayDone: boolean };
  undoCompleteQuestAction: (id: string) => void;
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
      dayClearMsg: '',
      undoToastQuestId: null,

      setUndoToastQuestId: (id) => set({ undoToastQuestId: id }),

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

      setManualTagOnAllQuests: () => {
        set((s) => ({
          quests: s.quests.map(q => ({ ...q, agentLabel: 'Manual' }))
        }));
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

      clearLevelUpMsg: () => set({ levelUpMsg: '' }),
      clearDayClearMsg: () => set({ dayClearMsg: '' })
    }),
    {
      name: 'questlog-global-storage',
    }
  )
);
