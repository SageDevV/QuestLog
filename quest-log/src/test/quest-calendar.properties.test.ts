import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { getDaysInMonth, getFirstDayOfWeek, formatMonthYear, groupQuestsByDay } from '../calendarUtils';
import { DIFFICULTY_CONFIG } from '../types';
import type { Quest } from '../types';
import { arbitraryQuest } from './arbitraries';

const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// Smart generators
const arbitraryYear = fc.integer({ min: 1970, max: 2100 });
const arbitraryMonth = fc.integer({ min: 0, max: 11 });

// ============================================================
// Feature: quest-calendar, Property 1: Corretude da grade do calendário
// **Validates: Requirements 2.1, 2.3**
// ============================================================

describe('Property 1: Corretude da grade do calendário', () => {
  it('getDaysInMonth matches Date oracle for any valid year/month', () => {
    fc.assert(
      fc.property(arbitraryYear, arbitraryMonth, (year, month) => {
        const result = getDaysInMonth(year, month);
        const expected = new Date(year, month + 1, 0).getDate();
        expect(result).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });

  it('getFirstDayOfWeek matches Date oracle for any valid year/month', () => {
    fc.assert(
      fc.property(arbitraryYear, arbitraryMonth, (year, month) => {
        const result = getFirstDayOfWeek(year, month);
        const expected = new Date(year, month, 1).getDay();
        expect(result).toBe(expected);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(6);
      }),
      { numRuns: 100 },
    );
  });
});


// ============================================================
// Feature: quest-calendar, Property 2: Formatação do mês e ano
// **Validates: Requirements 3.2**
// ============================================================

describe('Property 2: Formatação do mês e ano', () => {
  it('formatMonthYear contains the correct Portuguese month name and numeric year', () => {
    fc.assert(
      fc.property(arbitraryYear, arbitraryMonth, (year, month) => {
        const result = formatMonthYear(year, month);
        expect(result).toContain(MONTH_NAMES_PT[month]);
        expect(result).toContain(String(year));
        expect(result).toBe(`${MONTH_NAMES_PT[month]} ${year}`);
      }),
      { numRuns: 100 },
    );
  });
});

// ============================================================
// Feature: quest-calendar, Property 3: Round-trip de navegação entre meses
// **Validates: Requirements 3.3, 3.4**
// ============================================================

describe('Property 3: Round-trip de navegação entre meses', () => {
  function advanceMonth(year: number, month: number): [number, number] {
    if (month === 11) return [year + 1, 0];
    return [year, month + 1];
  }

  function retreatMonth(year: number, month: number): [number, number] {
    if (month === 0) return [year - 1, 11];
    return [year, month - 1];
  }

  it('advance then retreat returns to original month/year', () => {
    fc.assert(
      fc.property(arbitraryYear, arbitraryMonth, (year, month) => {
        const [advYear, advMonth] = advanceMonth(year, month);
        const [finalYear, finalMonth] = retreatMonth(advYear, advMonth);
        expect(finalYear).toBe(year);
        expect(finalMonth).toBe(month);
      }),
      { numRuns: 100 },
    );
  });

  it('retreat then advance returns to original month/year', () => {
    fc.assert(
      fc.property(arbitraryYear, arbitraryMonth, (year, month) => {
        const [retYear, retMonth] = retreatMonth(year, month);
        const [finalYear, finalMonth] = advanceMonth(retYear, retMonth);
        expect(finalYear).toBe(year);
        expect(finalMonth).toBe(month);
      }),
      { numRuns: 100 },
    );
  });

  it('handles year rollover correctly (Dec→Jan and Jan→Dec)', () => {
    const [advYear, advMonth] = advanceMonth(2024, 11);
    expect(advYear).toBe(2025);
    expect(advMonth).toBe(0);

    const [retYear, retMonth] = retreatMonth(2025, 0);
    expect(retYear).toBe(2024);
    expect(retMonth).toBe(11);
  });
});


// ============================================================
// Feature: quest-calendar, Property 4: Agrupamento de quests por scheduledDate
// **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
// ============================================================

describe('Property 4: Agrupamento de quests por scheduledDate', () => {
  const arbitraryScheduledQuest = (year: number, month: number) =>
    arbitraryQuest.chain((quest) => {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      return fc.record({
        day: fc.integer({ min: 1, max: daysInMonth }),
        hour: fc.integer({ min: 0, max: 23 }),
        minute: fc.integer({ min: 0, max: 59 }),
        completed: fc.boolean(),
      }).map(({ day, hour, minute, completed }) => ({
        ...quest,
        completed,
        completedAt: completed ? Date.now() : undefined,
        scheduledDate: new Date(year, month, day, hour, minute).getTime(),
      }));
    });

  it('groups each quest into the correct day based on scheduledDate', () => {
    fc.assert(
      fc.property(
        arbitraryYear,
        arbitraryMonth,
        fc.integer({ min: 1, max: 15 }),
        (year, month, questCount) => {
          const quests: Quest[] = [];
          const arb = arbitraryScheduledQuest(year, month);
          const samples = fc.sample(arb, questCount);
          quests.push(...samples);

          const result = groupQuestsByDay(quests, year, month);

          // Verify each quest appears in the correct day bucket
          for (const quest of quests) {
            const expectedDay = new Date(quest.scheduledDate).getDate();
            const bucket = result.get(expectedDay);
            expect(bucket).toBeDefined();
            expect(bucket!.some(q => q.id === quest.id)).toBe(true);
          }

          // Verify total count matches
          let totalInMap = 0;
          for (const [, arr] of result) {
            totalInMap += arr.length;
          }
          expect(totalInMap).toBe(quests.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('includes both active and completed quests', () => {
    fc.assert(
      fc.property(
        arbitraryYear,
        arbitraryMonth,
        (year, month) => {
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const day = Math.min(15, daysInMonth);
          const scheduledDate = new Date(year, month, day, 12, 0).getTime();

          const activeQuest: Quest = {
            id: 'active-1',
            title: 'Active Quest',
            description: '',
            difficulty: 'easy',
            completed: false,
            createdAt: Date.now(),
            scheduledDate,
          };
          const completedQuest: Quest = {
            id: 'completed-1',
            title: 'Completed Quest',
            description: '',
            difficulty: 'hard',
            completed: true,
            createdAt: Date.now(),
            completedAt: Date.now(),
            scheduledDate,
          };

          const result = groupQuestsByDay([activeQuest, completedQuest], year, month);
          const bucket = result.get(day);
          expect(bucket).toBeDefined();
          expect(bucket!.length).toBe(2);
          expect(bucket!.some(q => q.completed === false)).toBe(true);
          expect(bucket!.some(q => q.completed === true)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('excludes quests from other months', () => {
    fc.assert(
      fc.property(
        arbitraryYear,
        arbitraryMonth,
        arbitraryQuest,
        (year, month, quest) => {
          const otherMonth = (month + 6) % 12;
          const daysInOther = new Date(year, otherMonth + 1, 0).getDate();
          const day = Math.min(15, daysInOther);
          const modifiedQuest: Quest = {
            ...quest,
            scheduledDate: new Date(year, otherMonth, day, 12, 0).getTime(),
          };

          const result = groupQuestsByDay([modifiedQuest], year, month);
          expect(result.size).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});


// ============================================================
// Feature: quest-calendar, Property 5: Painel de dia exibe informações completas da quest
// **Validates: Requirements 5.2**
// ============================================================

describe('Property 5: Painel de dia exibe informações completas da quest', () => {
  it('for any scheduled quest, groupQuestsByDay preserves title, difficulty, completed status and reward info', () => {
    fc.assert(
      fc.property(
        arbitraryYear,
        arbitraryMonth,
        arbitraryQuest,
        fc.boolean(),
        (year, month, quest, isCompleted) => {
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const day = (Math.abs(quest.createdAt) % daysInMonth) + 1;
          const scheduledQuest: Quest = {
            ...quest,
            completed: isCompleted,
            completedAt: isCompleted ? Date.now() : undefined,
            scheduledDate: new Date(year, month, day, 12, 0).getTime(),
          };

          const result = groupQuestsByDay([scheduledQuest], year, month);
          const bucket = result.get(day);

          expect(bucket).toBeDefined();
          expect(bucket!.length).toBe(1);

          const found = bucket![0];
          // Verify quest data needed for the day panel is preserved
          expect(found.title).toBe(scheduledQuest.title);
          expect(found.difficulty).toBe(scheduledQuest.difficulty);
          expect(found.completed).toBe(isCompleted);

          // Verify DIFFICULTY_CONFIG has the expected reward info
          const cfg = DIFFICULTY_CONFIG[found.difficulty];
          expect(cfg).toBeDefined();
          expect(typeof cfg.xp).toBe('number');
          expect(typeof cfg.gold).toBe('number');
          expect(typeof cfg.emoji).toBe('string');
          expect(typeof cfg.label).toBe('string');
        },
      ),
      { numRuns: 100 },
    );
  });
});
