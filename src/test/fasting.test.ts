import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { FastRecord } from '../types';
import {
  HOUR_MS,
  getFastProgress,
  getFastPhase,
  getFastStreak,
  getWeekSummary,
  validateFastTimes,
  matchProtocolId,
} from '../fastingUtils';
import { useStore } from '../store';
import FastingTimer from '../components/FastingTimer';

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();

const record = (endedAt: number, hours: number, targetHours = 16): FastRecord => ({
  id: String(endedAt),
  startedAt: endedAt - hours * HOUR_MS,
  endedAt,
  targetHours,
  protocolId: '16-8',
});

describe('fasting utils', () => {
  it('caps the ring at 100% but keeps counting bonus time', () => {
    const start = 0;
    const p = getFastProgress(start, 16, 18 * HOUR_MS);
    expect(p.reached).toBe(true);
    expect(p.ratio).toBe(1);
    expect(p.percent).toBe(112);
    expect(p.overtimeMs).toBe(2 * HOUR_MS);
    expect(p.remainingMs).toBe(0);
  });

  it('picks the metabolic phase from elapsed hours', () => {
    expect(getFastPhase(2 * HOUR_MS).title).toBe('Digestão');
    expect(getFastPhase(12 * HOUR_MS).title).toBe('Queima de gordura');
    expect(getFastPhase(17 * HOUR_MS).title).toBe('Autofagia inicial');
  });

  it('counts the streak by consecutive days with a completed fast', () => {
    const now = at(2026, 11, 19);
    const history = [
      record(at(2026, 11, 19, 8), 16),
      record(at(2026, 11, 18, 8), 16),
      record(at(2026, 11, 17, 8), 10), // partial: breaks the chain
      record(at(2026, 11, 16, 8), 16),
    ];
    expect(getFastStreak(history, now)).toBe(2);
  });

  it('keeps the streak alive until the end of today, then breaks it', () => {
    const history = [record(at(2026, 11, 18, 8), 16), record(at(2026, 11, 17, 8), 16)];
    expect(getFastStreak(history, at(2026, 11, 19))).toBe(2);
    expect(getFastStreak(history, at(2026, 11, 20))).toBe(0);
  });

  it('summarises the last 7 days', () => {
    const now = at(2026, 11, 19);
    const week = getWeekSummary([record(at(2026, 11, 19, 8), 16), record(at(2026, 11, 17, 8), 5)], now);
    expect(week).toHaveLength(7);
    expect(week[6]).toMatchObject({ status: 'completed', isToday: true });
    expect(week[4].status).toBe('partial');
    expect(week[5].status).toBe('none');
  });

  it('validates manual start/end times', () => {
    const now = at(2026, 11, 19);
    expect(validateFastTimes(now - 2 * HOUR_MS, now + 14 * HOUR_MS, now)).toBeNull();
    expect(validateFastTimes(now + HOUR_MS, now + 20 * HOUR_MS, now)).toMatch(/futuro/);
    expect(validateFastTimes(now - HOUR_MS, now - 2 * HOUR_MS, now)).toMatch(/depois/);
    expect(validateFastTimes(now - HOUR_MS, now + 100 * HOUR_MS, now)).toMatch(/máxima/);
    expect(validateFastTimes(NaN, now, now)).toMatch(/válidos/);
  });

  it('falls back to custom when the target matches no preset', () => {
    expect(matchProtocolId(16)).toBe('16-8');
    expect(matchProtocolId(23)).toBe('omad');
    expect(matchProtocolId(15.5)).toBe('custom');
  });
});

describe('fasting store', () => {
  beforeEach(() => useStore.setState({ activeFast: null, fastHistory: [] }));

  it('ignores a second start and moves the fast to history on end', () => {
    useStore.getState().startFast('16-8', 16);
    const first = useStore.getState().activeFast;
    useStore.getState().startFast('omad', 23);
    expect(useStore.getState().activeFast).toBe(first);

    useStore.getState().endFast();
    expect(useStore.getState().activeFast).toBeNull();
    expect(useStore.getState().fastHistory).toHaveLength(1);
  });
});

describe('FastingTimer', () => {
  let container: HTMLDivElement;
  let root: Root;

  const mount = () => act(() => { root.render(createElement(FastingTimer)); });
  const byText = (selector: string, text: RegExp | string) =>
    Array.from(container.querySelectorAll(selector)).find(el =>
      typeof text === 'string' ? el.textContent === text : text.test(el.textContent ?? '')
    ) as HTMLElement;
  const click = (el: HTMLElement) => act(() => { el.click(); });

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    useStore.setState({ activeFast: null, fastHistory: [] });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  it('starts a fast and requires confirmation to end it', () => {
    mount();

    click(byText('[role="radio"]', '18:6'));
    click(byText('button', /Iniciar jejum/));
    expect(useStore.getState().activeFast).toMatchObject({ protocolId: '18-6', targetHours: 18 });

    click(byText('button', /Encerrar jejum/));
    expect(useStore.getState().activeFast).not.toBeNull();
    click(byText('button', 'Confirmar'));
    expect(useStore.getState().activeFast).toBeNull();
    expect(useStore.getState().fastHistory).toHaveLength(1);
  });

  it('shows the achievement and bonus time once the goal is exceeded', () => {
    useStore.setState({ activeFast: { startedAt: Date.now() - 17 * HOUR_MS, targetHours: 16, protocolId: '16-8' } });
    mount();

    expect(container.querySelector('[role="status"]')?.textContent).toMatch(/Meta atingida/);
    expect(container.textContent).toMatch(/de bônus/);
  });

  it('rejects an invalid manual adjustment', () => {
    useStore.setState({ activeFast: { startedAt: Date.now() - HOUR_MS, targetHours: 16, protocolId: '16-8' } });
    mount();

    click(byText('button', /Ajustar horários/));
    const [start, end] = Array.from(container.querySelectorAll('input[type="datetime-local"]')) as HTMLInputElement[];
    // React tracks the value setter, so go through the native one to trigger onChange
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    act(() => {
      setValue.call(end, start.value);
      end.dispatchEvent(new Event('input', { bubbles: true }));
    });
    click(byText('button', 'Salvar'));

    expect(container.querySelector('[role="alert"]')?.textContent).toMatch(/depois/);
  });
});
