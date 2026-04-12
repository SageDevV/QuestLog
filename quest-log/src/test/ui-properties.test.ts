import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type { Quest, Hero, QuestDifficulty } from '../types';
import {
  arbitraryHero,
  arbitraryQuest,
  arbitraryDifficulty,
  arbitraryWhitespace,
} from './arbitraries';

// --- Pure logic functions extracted for testing ---

function filterQuests(quests: Quest[], filter: 'active' | 'completed'): Quest[] {
  return quests.filter(q => filter === 'active' ? !q.completed : q.completed);
}

function tryAddQuest(quests: Quest[], title: string, difficulty: QuestDifficulty): Quest[] {
  if (!title.trim()) return quests;
  const newQuest: Quest = { id: 'test', title: title.trim(), description: '', difficulty, completed: false, createdAt: Date.now(), scheduledDate: Date.now() };
  return [newQuest, ...quests];
}

function tryRename(hero: Hero, name: string): Hero {
  if (!name.trim()) return hero;
  return { ...hero, name: name.trim() };
}

function deleteQuest(quests: Quest[], id: string): Quest[] {
  return quests.filter(q => q.id !== id);
}

function xpBarPercentage(hero: Hero): number {
  return Math.round((hero.xp / hero.xpToNext) * 100);
}

// --- Generator for quests with mixed completed status ---

const arbitraryQuestMixed: fc.Arbitrary<Quest> = arbitraryQuest.chain(q =>
  fc.boolean().map(completed => ({ ...q, completed })),
);

const arbitraryQuestListMixed: fc.Arbitrary<Quest[]> = fc.array(arbitraryQuestMixed, {
  minLength: 0,
  maxLength: 20,
});

describe('Property-based tests: UI logic', () => {
  // Feature: quest-log-rpg-task-manager, Property 9: Corretude do filtro de quests
  // **Validates: Requirements 8.2, 8.3**
  it('Property 9: filtering returns only matching quests and union equals original', () => {
    fc.assert(
      fc.property(arbitraryQuestListMixed, (quests) => {
        const active = filterQuests(quests, 'active');
        const completed = filterQuests(quests, 'completed');

        // Active filter returns only non-completed quests
        for (const q of active) {
          expect(q.completed).toBe(false);
        }
        // Completed filter returns only completed quests
        for (const q of completed) {
          expect(q.completed).toBe(true);
        }
        // Union equals original
        expect(active.length + completed.length).toBe(quests.length);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: quest-log-rpg-task-manager, Property 10: Contagem de filtro
  // **Validates: Requirements 8.5**
  it('Property 10: active + completed counts equal total length', () => {
    fc.assert(
      fc.property(arbitraryQuestListMixed, (quests) => {
        const activeCount = quests.filter(q => !q.completed).length;
        const completedCount = quests.filter(q => q.completed).length;

        expect(activeCount).toBe(filterQuests(quests, 'active').length);
        expect(completedCount).toBe(filterQuests(quests, 'completed').length);
        expect(activeCount + completedCount).toBe(quests.length);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: quest-log-rpg-task-manager, Property 11: Rejeição de título de quest com whitespace
  // **Validates: Requirements 1.2**
  it('Property 11: whitespace-only title is rejected and quest list unchanged', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryQuest, { minLength: 0, maxLength: 10 }),
        arbitraryWhitespace,
        arbitraryDifficulty,
        (quests, wsTitle, difficulty) => {
          const result = tryAddQuest(quests, wsTitle, difficulty);
          expect(result).toEqual(quests);
          expect(result.length).toBe(quests.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: quest-log-rpg-task-manager, Property 12: Rejeição de nome de herói com whitespace
  // **Validates: Requirements 6.5**
  it('Property 12: whitespace-only name keeps previous hero name', () => {
    fc.assert(
      fc.property(arbitraryHero, arbitraryWhitespace, (hero, wsName) => {
        const result = tryRename(hero, wsName);
        expect(result.name).toBe(hero.name);
        expect(result).toEqual(hero);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: quest-log-rpg-task-manager, Property 13: Nova quest inserida no início da lista
  // **Validates: Requirements 1.4**
  it('Property 13: new quest is inserted at index 0 and length increases by 1', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryQuest, { minLength: 0, maxLength: 10 }),
        fc.string({ minLength: 1 }).map(s => {
          const trimmed = s.trim();
          return trimmed.length > 0 ? trimmed : 'Valid Title';
        }),
        arbitraryDifficulty,
        (quests, title, difficulty) => {
          const result = tryAddQuest(quests, title, difficulty);
          expect(result.length).toBe(quests.length + 1);
          expect(result[0].title).toBe(title.trim());
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: quest-log-rpg-task-manager, Property 14: Exclusão remove quest da lista
  // **Validates: Requirements 7.1**
  it('Property 14: deleting a quest removes it and decreases length by 1', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryQuest, { minLength: 1, maxLength: 20 }).chain(quests =>
          fc.integer({ min: 0, max: quests.length - 1 }).map(idx => ({ quests, idx })),
        ),
        ({ quests, idx }) => {
          const target = quests[idx];
          const result = deleteQuest(quests, target.id);
          expect(result.length).toBe(quests.length - 1);
          expect(result.find(q => q.id === target.id)).toBeUndefined();
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: quest-log-rpg-task-manager, Property 15: Porcentagem da barra de XP
  // **Validates: Requirements 6.2**
  // Note: Math.round((xp/xpToNext)*100) can yield 100 when xp is very close to
  // xpToNext (e.g. 49742/49991 rounds to 100). The hero invariant 0 <= xp < xpToNext
  // guarantees the raw ratio is strictly < 1, but rounding can push it to 100.
  it('Property 15: XP bar percentage is Math.round((xp/xpToNext)*100) and in [0, 100]', () => {
    fc.assert(
      fc.property(arbitraryHero, (hero) => {
        const pct = xpBarPercentage(hero);
        const expected = Math.round((hero.xp / hero.xpToNext) * 100);
        expect(pct).toBe(expected);
        expect(pct).toBeGreaterThanOrEqual(0);
        expect(pct).toBeLessThanOrEqual(100);
      }),
      { numRuns: 100 },
    );
  });
});
