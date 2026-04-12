import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuestForm from '../components/QuestForm';
import { validateRecurrenceConfig } from '../recurrenceUtils';

// ============================================================
// 7.1 Test recurrence selector rendering in QuestForm
// ============================================================

describe('7.1 Recurrence selector rendering', () => {
  it('renders the three recurrence type buttons when form is open', async () => {
    const onAdd = vi.fn();
    render(<QuestForm onAdd={onAdd} />);

    // Open the form
    await userEvent.click(screen.getByText('➕ Nova Quest'));

    const group = screen.getByRole('group', { name: /tipo de recorrência/i });
    expect(group).toBeInTheDocument();

    expect(screen.getByText('Única')).toBeInTheDocument();
    expect(screen.getByText('Diária')).toBeInTheDocument();
    expect(screen.getByText('Semanal')).toBeInTheDocument();
  });

  it('defaults to "Única" selected', async () => {
    const onAdd = vi.fn();
    render(<QuestForm onAdd={onAdd} />);
    await userEvent.click(screen.getByText('➕ Nova Quest'));

    const unicaBtn = screen.getByText('Única');
    expect(unicaBtn).toHaveClass('selected');
  });
});


// ============================================================
// 7.2 Test conditional field display by recurrence type
// ============================================================

describe('7.2 Conditional field display by recurrence type', () => {
  it('shows single date field when "Única" is selected', async () => {
    const onAdd = vi.fn();
    render(<QuestForm onAdd={onAdd} />);
    await userEvent.click(screen.getByText('➕ Nova Quest'));

    expect(screen.getByLabelText('Data agendada')).toBeInTheDocument();
    expect(screen.queryByLabelText('Data de início')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Data de fim')).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /dias da semana/i })).not.toBeInTheDocument();
  });

  it('shows start/end date fields when "Diária" is selected', async () => {
    const onAdd = vi.fn();
    render(<QuestForm onAdd={onAdd} />);
    await userEvent.click(screen.getByText('➕ Nova Quest'));
    await userEvent.click(screen.getByText('Diária'));

    expect(screen.getByLabelText('Data de início')).toBeInTheDocument();
    expect(screen.getByLabelText('Data de fim')).toBeInTheDocument();
    expect(screen.queryByLabelText('Data agendada')).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /dias da semana/i })).not.toBeInTheDocument();
  });

  it('shows start/end date fields and weekday selector when "Semanal" is selected', async () => {
    const onAdd = vi.fn();
    render(<QuestForm onAdd={onAdd} />);
    await userEvent.click(screen.getByText('➕ Nova Quest'));
    await userEvent.click(screen.getByText('Semanal'));

    expect(screen.getByLabelText('Data de início')).toBeInTheDocument();
    expect(screen.getByLabelText('Data de fim')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /dias da semana/i })).toBeInTheDocument();
    expect(screen.getByText('Dom')).toBeInTheDocument();
    expect(screen.getByText('Sáb')).toBeInTheDocument();
  });
});

// ============================================================
// 7.3 Test validation: end date before start date
// ============================================================

describe('7.3 Validation: end date before start date', () => {
  it('validateRecurrenceConfig returns error when endDate < startDate', () => {
    const error = validateRecurrenceConfig({
      type: 'daily',
      startDate: '2025-06-15',
      endDate: '2025-06-10',
    });
    expect(error).toBeTruthy();
    expect(error).toContain('anterior');
  });

  it('shows error message in the form when end date is before start date', async () => {
    const onAdd = vi.fn();
    render(<QuestForm onAdd={onAdd} />);
    await userEvent.click(screen.getByText('➕ Nova Quest'));

    // Fill title
    const titleInput = screen.getByLabelText('Título da quest');
    await userEvent.type(titleInput, 'Test Quest');

    // Select daily
    await userEvent.click(screen.getByText('Diária'));

    // Set start date after end date
    const startInput = screen.getByLabelText('Data de início');
    const endInput = screen.getByLabelText('Data de fim');
    fireEvent.change(startInput, { target: { value: '2025-06-15' } });
    fireEvent.change(endInput, { target: { value: '2025-06-10' } });

    // Submit
    const submitBtn = screen.getByText('⚔️ Criar Quest');
    await userEvent.click(submitBtn);

    expect(screen.getByText(/anterior/i)).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });
});

// ============================================================
// 7.4 Test validation: no weekday selected
// ============================================================

describe('7.4 Validation: no weekday selected', () => {
  it('validateRecurrenceConfig returns error when weekly has no weekdays', () => {
    const error = validateRecurrenceConfig({
      type: 'weekly',
      startDate: '2025-06-01',
      endDate: '2025-06-30',
      weekdays: [],
    });
    expect(error).toBeTruthy();
    expect(error).toContain('dia da semana');
  });

  it('shows error in form when submitting weekly with no weekdays', async () => {
    const onAdd = vi.fn();
    render(<QuestForm onAdd={onAdd} />);
    await userEvent.click(screen.getByText('➕ Nova Quest'));

    const titleInput = screen.getByLabelText('Título da quest');
    await userEvent.type(titleInput, 'Weekly Quest');

    await userEvent.click(screen.getByText('Semanal'));

    const startInput = screen.getByLabelText('Data de início');
    const endInput = screen.getByLabelText('Data de fim');
    fireEvent.change(startInput, { target: { value: '2025-06-01' } });
    fireEvent.change(endInput, { target: { value: '2025-06-30' } });

    // Don't select any weekday
    const submitBtn = screen.getByText('⚔️ Criar Quest');
    await userEvent.click(submitBtn);

    expect(screen.getByText(/dia da semana/i)).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });
});

// ============================================================
// 7.5 Test submission with daily recurrence generates multiple quests
// ============================================================

describe('7.5 Submission with daily recurrence generates multiple quests', () => {
  it('calls onAdd with an array of quests for a 3-day daily range', async () => {
    const onAdd = vi.fn();
    render(<QuestForm onAdd={onAdd} />);
    await userEvent.click(screen.getByText('➕ Nova Quest'));

    const titleInput = screen.getByLabelText('Título da quest');
    await userEvent.type(titleInput, 'Daily Quest');

    await userEvent.click(screen.getByText('Diária'));

    const startInput = screen.getByLabelText('Data de início');
    const endInput = screen.getByLabelText('Data de fim');
    fireEvent.change(startInput, { target: { value: '2025-07-01' } });
    fireEvent.change(endInput, { target: { value: '2025-07-03' } });

    const submitBtn = screen.getByText('⚔️ Criar Quest');
    await userEvent.click(submitBtn);

    expect(onAdd).toHaveBeenCalledTimes(1);
    const arg = onAdd.mock.calls[0][0];
    expect(Array.isArray(arg)).toBe(true);
    expect(arg.length).toBe(3);

    // All share same title
    for (const q of arg) {
      expect(q.title).toBe('Daily Quest');
    }

    // All have unique ids
    const ids = arg.map((q: any) => q.id);
    expect(new Set(ids).size).toBe(3);
  });
});
