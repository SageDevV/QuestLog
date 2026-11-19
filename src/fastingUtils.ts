import type { FastRecord } from './types';

export const HOUR_MS = 3600000;
export const MIN_TARGET_HOURS = 1;
export const MAX_TARGET_HOURS = 72;
export const CUSTOM_PROTOCOL_ID = 'custom';
export const MAX_HISTORY = 90;

export interface FastProtocol {
  id: string;
  label: string;
  fastHours: number;
}

export const FAST_PROTOCOLS: FastProtocol[] = [
  { id: '12-12', label: '12:12', fastHours: 12 },
  { id: '14-10', label: '14:10', fastHours: 14 },
  { id: '16-8', label: '16:8', fastHours: 16 },
  { id: '18-6', label: '18:6', fastHours: 18 },
  { id: '20-4', label: '20:4', fastHours: 20 },
  { id: 'omad', label: 'OMAD 23:1', fastHours: 23 },
];

export const DEFAULT_PROTOCOL_ID = '16-8';

export function getProtocolHours(protocolId: string): number | undefined {
  return FAST_PROTOCOLS.find(p => p.id === protocolId)?.fastHours;
}

/** Returns the preset id matching the target, or `custom` when none matches. */
export function matchProtocolId(targetHours: number): string {
  const match = FAST_PROTOCOLS.find(p => Math.abs(p.fastHours - targetHours) < 1 / 120);
  return match ? match.id : CUSTOM_PROTOCOL_ID;
}

export function protocolLabel(protocolId: string, targetHours: number): string {
  const preset = FAST_PROTOCOLS.find(p => p.id === protocolId);
  return preset ? preset.label : `${formatHours(targetHours)} h`;
}

export function formatHours(hours: number): string {
  return String(Math.round(hours * 100) / 100);
}

export interface FastProgress {
  elapsedMs: number;
  remainingMs: number;
  overtimeMs: number;
  /** Whole percentage of the goal; keeps growing past 100 during bonus time. */
  percent: number;
  /** Ring fill, clamped to [0, 1]. */
  ratio: number;
  reached: boolean;
}

export function getFastProgress(startedAt: number, targetHours: number, now: number): FastProgress {
  const targetMs = targetHours * HOUR_MS;
  const elapsedMs = Math.max(0, now - startedAt);
  const reached = elapsedMs >= targetMs;
  return {
    elapsedMs,
    remainingMs: Math.max(0, targetMs - elapsedMs),
    overtimeMs: Math.max(0, elapsedMs - targetMs),
    percent: Math.floor((elapsedMs / targetMs) * 100),
    ratio: Math.min(1, elapsedMs / targetMs),
    reached,
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** HH:MM:SS */
export function formatClock(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000);
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

/** e.g. 16h12 */
export function formatDurationShort(ms: number): string {
  const totalMin = Math.floor(Math.max(0, ms) / 60000);
  return `${Math.floor(totalMin / 60)}h${pad(totalMin % 60)}`;
}

export interface FastPhase {
  fromHours: number;
  icon: string;
  title: string;
  description: string;
}

export const FAST_PHASES: FastPhase[] = [
  { fromHours: 0, icon: '🍽️', title: 'Digestão', description: 'O corpo ainda processa a última refeição e usa a glicose como principal energia.' },
  { fromHours: 4, icon: '📉', title: 'Estabilização', description: 'Glicose e insulina caem e o corpo passa a recorrer ao glicogênio armazenado.' },
  { fromHours: 12, icon: '🔥', title: 'Queima de gordura', description: 'Com o glicogênio em baixa, a gordura ganha mais espaço como fonte de energia.' },
  { fromHours: 16, icon: '♻️', title: 'Autofagia inicial', description: 'Células intensificam a reciclagem de componentes. O momento varia de pessoa para pessoa.' },
  { fromHours: 24, icon: '🧬', title: 'Jejum prolongado', description: 'Hidrate-se, ouça seu corpo e busque orientação profissional para jejuns longos.' },
];

export function getFastPhase(elapsedMs: number): FastPhase {
  const hours = elapsedMs / HOUR_MS;
  let current = FAST_PHASES[0];
  for (const phase of FAST_PHASES) {
    if (hours >= phase.fromHours) current = phase;
  }
  return current;
}

export function isFastCompleted(record: Pick<FastRecord, 'startedAt' | 'endedAt' | 'targetHours'>): boolean {
  return record.endedAt - record.startedAt >= record.targetHours * HOUR_MS;
}

/** Local calendar day key (YYYY-MM-DD). */
export function dayKey(ts: number | Date): string {
  const d = typeof ts === 'number' ? new Date(ts) : ts;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Consecutive days with at least one completed fast (counted by the day it ended).
 * The streak stays alive until the end of today, so a missing fast today
 * does not break it yet.
 */
export function getFastStreak(history: FastRecord[], now: number): number {
  const doneDays = new Set(history.filter(isFastCompleted).map(r => dayKey(r.endedAt)));
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  if (!doneDays.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (doneDays.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface WeekDay {
  key: string;
  date: Date;
  status: 'completed' | 'partial' | 'none';
  isToday: boolean;
}

/** The last 7 days ending today (oldest first). */
export function getWeekSummary(history: FastRecord[], now: number): WeekDay[] {
  const byDay = new Map<string, FastRecord[]>();
  for (const r of history) {
    const key = dayKey(r.endedAt);
    byDay.set(key, [...(byDay.get(key) ?? []), r]);
  }

  const todayKey = dayKey(now);
  const days: WeekDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    const key = dayKey(date);
    const records = byDay.get(key) ?? [];
    const status = records.some(isFastCompleted) ? 'completed' : records.length > 0 ? 'partial' : 'none';
    days.push({ key, date, status, isToday: key === todayKey });
  }
  return days;
}

/** Returns an error message, or null when the start/end pair is valid. */
export function validateFastTimes(startedAt: number, endsAt: number, now: number): string | null {
  if (!Number.isFinite(startedAt) || !Number.isFinite(endsAt)) return 'Informe um início e um fim válidos.';
  if (startedAt > now) return 'O início não pode estar no futuro.';
  if (endsAt <= startedAt) return 'O fim precisa ser depois do início.';
  const hours = (endsAt - startedAt) / HOUR_MS;
  if (hours < MIN_TARGET_HOURS) return `A meta mínima é de ${MIN_TARGET_HOURS}h.`;
  if (hours > MAX_TARGET_HOURS) return `A meta máxima é de ${MAX_TARGET_HOURS}h.`;
  return null;
}

/** Formats a timestamp for <input type="datetime-local">. */
export function toDateTimeLocal(ts: number): string {
  const d = new Date(ts);
  return `${dayKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Parses a datetime-local value; returns NaN when empty or invalid. */
export function fromDateTimeLocal(value: string): number {
  return value ? new Date(value).getTime() : NaN;
}
