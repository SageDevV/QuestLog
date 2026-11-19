import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { DAY_MS, getNoFapDays, fromDateInput, toDateInput, validateNoFapStart } from '../noFapUtils';
import { useStore } from '../store';
import NoFapCounter from '../components/NoFapCounter';

describe('noFap utils', () => {
  it('counts only fully elapsed days and never goes negative', () => {
    expect(getNoFapDays(0, 3 * DAY_MS - 1)).toBe(2);
    expect(getNoFapDays(0, 3 * DAY_MS)).toBe(3);
    expect(getNoFapDays(5 * DAY_MS, 0)).toBe(0);
  });

  it('round-trips date input values and rejects invalid or future starts', () => {
    expect(toDateInput(fromDateInput('2026-03-09'))).toBe('2026-03-09');
    expect(validateNoFapStart(NaN, 0)).not.toBeNull();
    expect(validateNoFapStart(10, 5)).not.toBeNull();
    expect(validateNoFapStart(5, 10)).toBeNull();
  });
});

describe('noFap store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useStore.setState({ noFap: null });
  });
  afterEach(() => vi.useRealTimers());

  it('starts once and keeps the best record when restarting', () => {
    vi.setSystemTime(0);
    useStore.getState().startNoFap();
    vi.setSystemTime(10 * DAY_MS);
    useStore.getState().startNoFap();
    expect(useStore.getState().noFap).toEqual({ startedAt: 0, bestDays: 0 });

    useStore.getState().restartNoFap();
    expect(useStore.getState().noFap).toEqual({ startedAt: 10 * DAY_MS, bestDays: 10 });

    vi.setSystemTime(13 * DAY_MS);
    useStore.getState().restartNoFap();
    expect(useStore.getState().noFap).toEqual({ startedAt: 13 * DAY_MS, bestDays: 10 });
  });
});

describe('NoFapCounter', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    useStore.setState({ noFap: null });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('shows the start button, then the day count after starting', () => {
    act(() => { root.render(createElement(NoFapCounter)); });
    expect(container.querySelector('.nofap-days')?.textContent).toBe('0');

    const start = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('Iniciar'));
    act(() => { start!.click(); });
    expect(useStore.getState().noFap).not.toBeNull();
    expect(container.textContent).toContain('Reiniciar contagem');
  });
});
