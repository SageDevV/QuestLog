import { describe, it, expect } from 'vitest';
import { getDaysInMonth, getFirstDayOfWeek, formatMonthYear, groupQuestsByDay } from '../calendarUtils';
import type { Quest } from '../types';

// ============================================================
// 5.1 Unit tests for calendar utility functions
// ============================================================

describe('getDaysInMonth', () => {
  it('returns 31 for January', () => {
    expect(getDaysInMonth(2025, 0)).toBe(31);
  });

  it('returns 28 for February in a non-leap year', () => {
    expect(getDaysInMonth(2023, 1)).toBe(28);
  });

  it('returns 29 for February in a leap year (2024)', () => {
    expect(getDaysInMonth(2024, 1)).toBe(29);
  });

  it('returns 29 for February 2000 (divisible by 400)', () => {
    expect(getDaysInMonth(2000, 1)).toBe(29);
  });

  it('returns 28 for February 1900 (divisible by 100 but not 400)', () => {
    expect(getDaysInMonth(1900, 1)).toBe(28);
  });

  it('returns 30 for April', () => {
    expect(getDaysInMonth(2025, 3)).toBe(30);
  });

  it('returns 31 for December', () => {
    expect(getDaysInMonth(2025, 11)).toBe(31);
  });
});

describe('getFirstDayOfWeek', () => {
  it('returns correct day for January 2025 (Wednesday = 3)', () => {
    expect(getFirstDayOfWeek(2025, 0)).toBe(3);
  });

  it('returns correct day for February 2024 (Thursday = 4)', () => {
    expect(getFirstDayOfWeek(2024, 1)).toBe(4);
  });

  it('returns a value between 0 and 6', () => {
    const result = getFirstDayOfWeek(2025, 5);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(6);
  });
});

describe('formatMonthYear', () => {
  it('formats January 2025 correctly', () => {
    expect(formatMonthYear(2025, 0)).toBe('Janeiro 2025');
  });

  it('formats December 2024 correctly', () => {
    expect(formatMonthYear(2024, 11)).toBe('Dezembro 2024');
  });

  it('formats February correctly', () => {
    expect(formatMonthYear(2023, 1)).toBe('Fevereiro 2023');
  });

  it('formats all months in Portuguese', () => {
    const expected = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];
    for (let m = 0; m < 12; m++) {
      expect(formatMonthYear(2025, m)).toBe(`${expected[m]} 2025`);
    }
  });
});


describe('groupQuestsByDay', () => {
  function makeQuest(overrides: Partial<Quest> & { scheduledDate: number }): Quest {
    return {
      id: '1',
      title: 'Test Quest',
      description: '',
      difficulty: 'easy',
      completed: false,
      createdAt: Date.now(),
      ...overrides,
    } as Quest;
  }

  it('groups quests by day using scheduledDate within the specified month', () => {
    const jan15 = new Date(2025, 0, 15, 12, 0, 0).getTime();
    const jan20 = new Date(2025, 0, 20, 14, 0, 0).getTime();

    const quests = [
      makeQuest({ id: '1', scheduledDate: jan15 }),
      makeQuest({ id: '2', scheduledDate: jan20 }),
      makeQuest({ id: '3', scheduledDate: jan15 }),
    ];

    const result = groupQuestsByDay(quests, 2025, 0);
    expect(result.get(15)?.length).toBe(2);
    expect(result.get(20)?.length).toBe(1);
    expect(result.size).toBe(2);
  });

  it('includes both active and completed quests', () => {
    const jan10 = new Date(2025, 0, 10).getTime();
    const quests = [
      makeQuest({ id: '1', scheduledDate: jan10, completed: false }),
      makeQuest({ id: '2', scheduledDate: jan10, completed: true, completedAt: Date.now() }),
    ];

    const result = groupQuestsByDay(quests, 2025, 0);
    expect(result.get(10)?.length).toBe(2);
  });

  it('ignores quests from a different month', () => {
    const feb5 = new Date(2025, 1, 5).getTime();
    const quests = [makeQuest({ id: '1', scheduledDate: feb5 })];

    const result = groupQuestsByDay(quests, 2025, 0); // asking for January
    expect(result.size).toBe(0);
  });

  it('ignores quests from a different year', () => {
    const jan5_2024 = new Date(2024, 0, 5).getTime();
    const quests = [makeQuest({ id: '1', scheduledDate: jan5_2024 })];

    const result = groupQuestsByDay(quests, 2025, 0);
    expect(result.size).toBe(0);
  });

  it('returns empty map for empty quest array', () => {
    const result = groupQuestsByDay([], 2025, 0);
    expect(result.size).toBe(0);
  });

  it('handles year rollover — quests in December vs January', () => {
    const dec31 = new Date(2024, 11, 31, 23, 59).getTime();
    const jan1 = new Date(2025, 0, 1, 0, 1).getTime();

    const quests = [
      makeQuest({ id: '1', scheduledDate: dec31 }),
      makeQuest({ id: '2', scheduledDate: jan1 }),
    ];

    const decResult = groupQuestsByDay(quests, 2024, 11);
    expect(decResult.size).toBe(1);
    expect(decResult.get(31)?.length).toBe(1);

    const janResult = groupQuestsByDay(quests, 2025, 0);
    expect(janResult.size).toBe(1);
    expect(janResult.get(1)?.length).toBe(1);
  });
});


// ============================================================
// 5.2 Component rendering tests for QuestCalendar
// ============================================================

import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import QuestCalendar from '../components/QuestCalendar';
import { DIFFICULTY_CONFIG } from '../types';

describe('QuestCalendar — tab presence', () => {
  it('renders the "📅 Calendário" tab in the filter bar', () => {
    render(<App />);
    const tab = screen.getByRole('button', { name: /calendário/i });
    expect(tab).toBeInTheDocument();
  });
});

describe('QuestCalendar — view switching', () => {
  it('shows QuestCalendar when the calendar tab is selected', () => {
    render(<App />);
    const tab = screen.getByRole('button', { name: /calendário/i });
    fireEvent.click(tab);
    const now = new Date();
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];
    const expectedHeader = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    expect(screen.getByText(expectedHeader)).toBeInTheDocument();
  });

  it('hides the calendar when switching back to active tab', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /calendário/i }));
    fireEvent.click(screen.getByRole('button', { name: /ativas/i }));
    expect(screen.queryByLabelText('Mês anterior')).not.toBeInTheDocument();
  });
});

describe('QuestCalendar — initializes on current month', () => {
  it('displays the current month and year on initial render', () => {
    render(<QuestCalendar quests={[]} />);
    const now = new Date();
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];
    const expectedHeader = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    expect(screen.getByText(expectedHeader)).toBeInTheDocument();
  });

  it('renders day-of-week labels', () => {
    render(<QuestCalendar quests={[]} />);
    for (const label of ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});

describe('QuestCalendar — clicking a day with quests', () => {
  it('shows the day panel with quest details and status when a day with quests is clicked', () => {
    const now = new Date();
    const scheduledDate = new Date(now.getFullYear(), now.getMonth(), 10, 0, 0).getTime();
    const activeQuest: Quest = {
      id: 'q1',
      title: 'Slay the Dragon',
      description: 'A mighty quest',
      difficulty: 'hard',
      completed: false,
      createdAt: Date.now(),
      scheduledDate,
    };
    const completedQuest: Quest = {
      id: 'q2',
      title: 'Gather Herbs',
      description: 'A simple quest',
      difficulty: 'easy',
      completed: true,
      createdAt: Date.now(),
      completedAt: Date.now(),
      scheduledDate,
    };

    render(<QuestCalendar quests={[activeQuest, completedQuest]} />);

    const dayCell = screen.getByText('10').closest('.calendar-day');
    expect(dayCell).not.toBeNull();
    fireEvent.click(dayCell!);

    expect(screen.getByText('Dia 10')).toBeInTheDocument();
    expect(screen.getByText('Slay the Dragon')).toBeInTheDocument();
    expect(screen.getByText('Gather Herbs')).toBeInTheDocument();

    // Check status indicators
    const statusIcons = screen.getAllByText(/📋|✅/);
    expect(statusIcons.length).toBe(2);

    const cfg = DIFFICULTY_CONFIG['hard'];
    expect(screen.getByText(`${cfg.emoji} ${cfg.label}`)).toBeInTheDocument();
    expect(screen.getByText(`+${cfg.xp}XP +${cfg.gold}💰`)).toBeInTheDocument();
  });
});

describe('QuestCalendar — clicking an empty day', () => {
  it('shows empty message when clicking a day without quests', () => {
    render(<QuestCalendar quests={[]} />);

    const dayCell = screen.getByText('1').closest('.calendar-day');
    expect(dayCell).not.toBeNull();
    fireEvent.click(dayCell!);

    expect(screen.getByText('Nenhuma quest neste dia')).toBeInTheDocument();
  });

  it('toggles day panel off when clicking the same day again', () => {
    render(<QuestCalendar quests={[]} />);

    const dayCell = screen.getByText('1').closest('.calendar-day');
    fireEvent.click(dayCell!);
    expect(screen.getByText('Dia 1')).toBeInTheDocument();

    fireEvent.click(dayCell!);
    expect(screen.queryByText('Dia 1')).not.toBeInTheDocument();
  });
});
