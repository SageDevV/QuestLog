import fc from 'fast-check';
import type { Quest, Hero, QuestDifficulty } from '../types';
import { getTitle } from '../types';

/**
 * Generates one of the 4 quest difficulties.
 */
export const arbitraryDifficulty: fc.Arbitrary<QuestDifficulty> = fc.constantFrom(
  'easy' as const,
  'medium' as const,
  'hard' as const,
  'legendary' as const,
);

/**
 * Generates a valid Quest with non-empty trimmed title,
 * random difficulty, completed=false, and a createdAt timestamp.
 */
export const arbitraryQuest: fc.Arbitrary<Quest> = fc
  .record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1 }).map((s) => {
      const trimmed = s.trim();
      return trimmed.length > 0 ? trimmed : 'Default Quest';
    }),
    description: fc.string(),
    difficulty: arbitraryDifficulty,
    completed: fc.constant(false),
    createdAt: fc.integer({ min: 0, max: 2_000_000_000_000 }),
    scheduledDate: fc.integer({ min: 0, max: 2_000_000_000_000 }),
  })
  .map((q) => q as Quest);

/**
 * Generates a valid Hero respecting invariants:
 * - level >= 1
 * - xpToNext >= 100
 * - 0 <= xp < xpToNext
 * - title matches level via getTitle()
 */
export const arbitraryHero: fc.Arbitrary<Hero> = fc
  .record({
    name: fc.string({ minLength: 1 }).map((s) => {
      const trimmed = s.trim();
      return trimmed.length > 0 ? trimmed : 'Hero';
    }),
    level: fc.integer({ min: 1, max: 100 }),
    xpToNext: fc.integer({ min: 100, max: 100_000 }),
    gold: fc.integer({ min: 0, max: 1_000_000 }),
    questsCompleted: fc.integer({ min: 0, max: 10_000 }),
  })
  .chain((partial) =>
    fc.integer({ min: 0, max: partial.xpToNext - 1 }).map((xp) => ({
      ...partial,
      xp,
      title: getTitle(partial.level),
    })),
  );


/**
 * Generates an array of quests for testing completion sequences.
 */
export const arbitraryQuestSequence: fc.Arbitrary<Quest[]> = fc.array(arbitraryQuest, {
  minLength: 1,
  maxLength: 20,
});

/**
 * Generates strings composed only of whitespace characters (including empty string).
 */
export const arbitraryWhitespace: fc.Arbitrary<string> = fc.stringOf(
  fc.constantFrom(' ', '\t', '\n', '\r', '\u00A0'),
);
