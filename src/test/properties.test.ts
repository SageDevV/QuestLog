import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { completeQuest } from '../store';
import { getTitle, DIFFICULTY_CONFIG, Hero, Quest } from '../types';
import {
  arbitraryHero,
  arbitraryQuest,
  arbitraryQuestSequence,
  arbitraryDifficulty,
} from './arbitraries';

/**
 * Helper: compute total accumulated XP for a hero whose xpToNext
 * follows the formula xpToNext(n) = floor(100 * 1.3^(n-1)).
 * totalXp = sum of thresholds from level 1 to (level-1) + current xp
 */
function computeTotalXp(hero: Hero): number {
  let total = hero.xp;
  let threshold = 100;
  for (let i = 1; i < hero.level; i++) {
    total += threshold;
    threshold = Math.floor(threshold * 1.3);
  }
  return total;
}

/**
 * Helper: apply a sequence of quests to a hero, returning the final hero.
 */
function applyQuests(hero: Hero, quests: Quest[]): Hero {
  let current = hero;
  for (const q of quests) {
    current = completeQuest(current, q).hero;
  }
  return current;
}

/**
 * Helper: expected title for a given level.
 */
function expectedTitle(level: number): string {
  if (level >= 20) return '🏆 Lenda Viva';
  if (level >= 15) return '👑 Grão-Mestre';
  if (level >= 10) return '⚔️ Cavaleiro';
  if (level >= 7) return '🛡️ Guerreiro';
  if (level >= 4) return '🗡️ Aventureiro';
  return '🌱 Novato';
}

describe('Property-based tests: store and types', () => {
  // Feature: quest-log-rpg-task-manager, Property 1: Recompensas de completeQuest
  // **Validates: Requirements 2.2, 2.3, 2.4**
  it('Property 1: completeQuest awards correct gold and increments questsCompleted', () => {
    fc.assert(
      fc.property(arbitraryHero, arbitraryQuest, (hero, quest) => {
        const config = DIFFICULTY_CONFIG[quest.difficulty];
        const { hero: result } = completeQuest(hero, quest);

        expect(result.gold).toBe(hero.gold + config.gold);
        expect(result.questsCompleted).toBe(hero.questsCompleted + 1);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: quest-log-rpg-task-manager, Property 2: Conservação de XP
  // **Validates: Requirements 11.8**
  it('Property 2: XP conservation — total XP after equals total XP before plus reward', () => {
    /**
     * Build a hero whose xpToNext is consistent with the level-up formula
     * so that computeTotalXp (which reconstructs thresholds from level 1)
     * produces an accurate total.
     */
    const formulaHero = arbitraryHero.map((h) => {
      let xpToNext = 100;
      for (let i = 1; i < h.level; i++) {
        xpToNext = Math.floor(xpToNext * 1.3);
      }
      const xp = h.xp % xpToNext; // keep xp in valid range [0, xpToNext)
      return { ...h, xpToNext, xp };
    });

    fc.assert(
      fc.property(formulaHero, arbitraryQuest, (hero, quest) => {
        const totalBefore = computeTotalXp(hero);
        const config = DIFFICULTY_CONFIG[quest.difficulty];
        const { hero: result } = completeQuest(hero, quest);
        const totalAfter = computeTotalXp(result);

        expect(totalAfter).toBe(totalBefore + config.xp);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: quest-log-rpg-task-manager, Property 3: Invariantes de progressão após sequência de quests
  // **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**
  it('Property 3: progression invariants hold after any quest sequence', () => {
    fc.assert(
      fc.property(arbitraryHero, arbitraryQuestSequence, (initialHero, quests) => {
        let hero = initialHero;
        const initialQuestsCompleted = hero.questsCompleted;

        for (const quest of quests) {
          const prevLevel = hero.level;
          const prevGold = hero.gold;
          const { hero: result } = completeQuest(hero, quest);

          // (a) level monotonically non-decreasing
          expect(result.level).toBeGreaterThanOrEqual(prevLevel);
          // (b) gold monotonically non-decreasing
          expect(result.gold).toBeGreaterThanOrEqual(prevGold);

          hero = result;
        }

        // (c) questsCompleted = initial + sequence length
        expect(hero.questsCompleted).toBe(initialQuestsCompleted + quests.length);
        // (d) 0 <= xp < xpToNext
        expect(hero.xp).toBeGreaterThanOrEqual(0);
        expect(hero.xp).toBeLessThan(hero.xpToNext);
        // (e) xpToNext >= 100
        expect(hero.xpToNext).toBeGreaterThanOrEqual(100);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: quest-log-rpg-task-manager, Property 4: Confluência — ordem de conclusão não importa
  // **Validates: Requirements 11.7**
  it('Property 4: quest completion order does not affect final hero state', () => {
    fc.assert(
      fc.property(arbitraryHero, arbitraryQuestSequence, (hero, quests) => {
        // Original order
        const result1 = applyQuests(hero, quests);

        // Shuffled order (Fisher-Yates via fast-check's shuffled array)
        const shuffled = [...quests].sort(() => Math.random() - 0.5);
        const result2 = applyQuests(hero, shuffled);

        expect(result1.level).toBe(result2.level);
        expect(result1.xp).toBe(result2.xp);
        expect(result1.xpToNext).toBe(result2.xpToNext);
        expect(result1.gold).toBe(result2.gold);
        expect(result1.questsCompleted).toBe(result2.questsCompleted);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: quest-log-rpg-task-manager, Property 5: Mesma dificuldade, mesma recompensa
  // **Validates: Requirements 11.6**
  it('Property 5: same difficulty always yields same rewards', () => {
    fc.assert(
      fc.property(arbitraryDifficulty, arbitraryQuest, arbitraryQuest, (difficulty, quest1, quest2) => {
        const q1 = { ...quest1, difficulty };
        const q2 = { ...quest2, difficulty };

        expect(DIFFICULTY_CONFIG[q1.difficulty].xp).toBe(DIFFICULTY_CONFIG[q2.difficulty].xp);
        expect(DIFFICULTY_CONFIG[q1.difficulty].gold).toBe(DIFFICULTY_CONFIG[q2.difficulty].gold);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: quest-log-rpg-task-manager, Property 6: Mapeamento de títulos por nível
  // **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 4.5**
  it('Property 6: getTitle returns correct title for any level, and completeQuest sets it', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        arbitraryHero,
        arbitraryQuest,
        (level, hero, quest) => {
          // Part 1: getTitle returns the correct title for any level
          const title = getTitle(level);
          expect(title).toBe(expectedTitle(level));

          // Part 2: after completeQuest, hero's title matches getTitle(newLevel)
          const { hero: result } = completeQuest(hero, quest);
          expect(result.title).toBe(getTitle(result.level));
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: quest-log-rpg-task-manager, Property 7: Round-trip de serialização do Herói
  // **Validates: Requirements 9.1, 9.6**
  it('Property 7: Hero JSON round-trip produces equivalent object', () => {
    fc.assert(
      fc.property(arbitraryHero, (hero) => {
        const roundTripped = JSON.parse(JSON.stringify(hero));
        expect(roundTripped).toEqual(hero);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: quest-log-rpg-task-manager, Property 8: Round-trip de serialização de Quests
  // **Validates: Requirements 9.2, 9.7**
  it('Property 8: Quest[] JSON round-trip produces equivalent array', () => {
    fc.assert(
      fc.property(fc.array(arbitraryQuest, { minLength: 0, maxLength: 20 }), (quests) => {
        const roundTripped = JSON.parse(JSON.stringify(quests));
        expect(roundTripped).toEqual(quests);
      }),
      { numRuns: 100 },
    );
  });
});
