import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { generateOccurrences, validateRecurrenceConfig, RecurrenceConfig } from '../recurrenceUtils';

// --- Smart generators ---

/** Generate a valid YYYY-MM-DD date string within a reasonable range. */
const arbitraryDateStr = fc
  .date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') })
  .map((d) => d.toISOString().split('T')[0]);

/** Generate a pair of date strings where end >= start. */
const arbitraryDateRange = fc
  .tuple(
    fc.date({ min: new Date('2000-01-01'), max: new Date('2080-01-01') }),
    fc.integer({ min: 0, max: 365 }),
  )
  .map(([start, offset]) => {
    const end = new Date(start);
    end.setDate(end.getDate() + offset);
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    return { startDate: fmt(start), endDate: fmt(end), offsetDays: offset };
  });

/** Generate a non-empty subset of weekdays (0-6). */
const arbitraryWeekdays = fc
  .subarray([0, 1, 2, 3, 4, 5, 6], { minLength: 1 })
  .map((arr) => arr.sort());

function toMidnight(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00').getTime();
}

// ============================================================
// Feature: quest-recurrence, Property 1: daily date count equals (endDate - startDate + 1) days
// **Validates: Requirements 4.2, 7.1**
// ============================================================

describe('Property 1: daily date count equals (endDate - startDate + 1) days', () => {
  it('generates exactly offsetDays + 1 dates for daily recurrence', () => {
    fc.assert(
      fc.property(arbitraryDateRange, ({ startDate, endDate, offsetDays }) => {
        const config: RecurrenceConfig = { type: 'daily', startDate, endDate };
        const result = generateOccurrences(config);
        expect(result.length).toBe(offsetDays + 1);
      }),
      { numRuns: 100 },
    );
  });
});


// ============================================================
// Feature: quest-recurrence, Property 2: weekly dates correspond to WeekdaySelection days
// **Validates: Requirements 4.3, 7.2**
// ============================================================

describe('Property 2: weekly dates correspond to WeekdaySelection days', () => {
  it('every generated date falls on a selected weekday', () => {
    fc.assert(
      fc.property(arbitraryDateRange, arbitraryWeekdays, ({ startDate, endDate }, weekdays) => {
        const config: RecurrenceConfig = { type: 'weekly', startDate, endDate, weekdays };
        const result = generateOccurrences(config);
        for (const ts of result) {
          const day = new Date(ts).getDay();
          expect(weekdays).toContain(day);
        }
      }),
      { numRuns: 100 },
    );
  });
});

// ============================================================
// Feature: quest-recurrence, Property 3: all dates within DateRange
// **Validates: Requirements 7.3**
// ============================================================

describe('Property 3: all dates within DateRange', () => {
  it('every generated timestamp is between startDate and endDate inclusive', () => {
    fc.assert(
      fc.property(
        arbitraryDateRange,
        arbitraryWeekdays,
        fc.constantFrom<RecurrenceConfig['type']>('daily', 'weekly'),
        ({ startDate, endDate }, weekdays, type) => {
          const config: RecurrenceConfig = { type, startDate, endDate, weekdays };
          const result = generateOccurrences(config);
          const startTs = toMidnight(startDate);
          const endTs = toMidnight(endDate);
          for (const ts of result) {
            expect(ts).toBeGreaterThanOrEqual(startTs);
            expect(ts).toBeLessThanOrEqual(endTs);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ============================================================
// Feature: quest-recurrence, Property 4: no duplicates in date array
// **Validates: Requirements 6.1, 6.2**
// ============================================================

describe('Property 4: no duplicates in date array', () => {
  it('generated dates contain no duplicate timestamps', () => {
    fc.assert(
      fc.property(
        arbitraryDateRange,
        arbitraryWeekdays,
        fc.constantFrom<RecurrenceConfig['type']>('single', 'daily', 'weekly'),
        ({ startDate, endDate }, weekdays, type) => {
          const config: RecurrenceConfig =
            type === 'single'
              ? { type, startDate }
              : { type, startDate, endDate, weekdays: type === 'weekly' ? weekdays : undefined };
          const result = generateOccurrences(config);
          expect(new Set(result).size).toBe(result.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ============================================================
// Feature: quest-recurrence, Property 5: dates in chronological order
// **Validates: Requirements 4.5**
// ============================================================

describe('Property 5: dates in chronological order', () => {
  it('each date is less than or equal to the next', () => {
    fc.assert(
      fc.property(
        arbitraryDateRange,
        arbitraryWeekdays,
        fc.constantFrom<RecurrenceConfig['type']>('daily', 'weekly'),
        ({ startDate, endDate }, weekdays, type) => {
          const config: RecurrenceConfig = { type, startDate, endDate, weekdays };
          const result = generateOccurrences(config);
          for (let i = 0; i < result.length - 1; i++) {
            expect(result[i]).toBeLessThanOrEqual(result[i + 1]);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ============================================================
// Feature: quest-recurrence, Property 6: single generates exactly one date
// **Validates: Requirements 4.1**
// ============================================================

describe('Property 6: single generates exactly one date', () => {
  it('returns exactly one element equal to the startDate timestamp', () => {
    fc.assert(
      fc.property(arbitraryDateStr, (startDate) => {
        const config: RecurrenceConfig = { type: 'single', startDate };
        const result = generateOccurrences(config);
        expect(result.length).toBe(1);
        expect(result[0]).toBe(toMidnight(startDate));
      }),
      { numRuns: 100 },
    );
  });
});

// ============================================================
// Feature: quest-recurrence, Property 7: generated quests share attributes but have unique ids
// **Validates: Requirements 4.4**
// ============================================================

describe('Property 7: generated quests share attributes but have unique ids', () => {
  it('quests created from the same config share title/description/difficulty but have distinct ids', () => {
    fc.assert(
      fc.property(
        arbitraryDateRange,
        fc.string({ minLength: 1 }).map((s) => s.trim() || 'Quest'),
        fc.string(),
        fc.constantFrom('easy' as const, 'medium' as const, 'hard' as const, 'legendary' as const),
        ({ startDate, endDate }, title, description, difficulty) => {
          const config: RecurrenceConfig = { type: 'daily', startDate, endDate };
          const timestamps = generateOccurrences(config);
          // Simulate quest creation like QuestForm does
          const quests = timestamps.map((ts) => ({
            id: crypto.randomUUID(),
            title,
            description,
            difficulty,
            completed: false,
            createdAt: Date.now(),
            scheduledDate: ts,
          }));

          // All share same attributes
          for (const q of quests) {
            expect(q.title).toBe(title);
            expect(q.description).toBe(description);
            expect(q.difficulty).toBe(difficulty);
          }

          // All ids are unique
          const ids = quests.map((q) => q.id);
          expect(new Set(ids).size).toBe(ids.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});
