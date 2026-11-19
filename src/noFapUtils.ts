export const DAY_MS = 86400000;

export function getNoFapDays(startedAt: number, now: number): number {
  return Math.max(0, Math.floor((now - startedAt) / DAY_MS));
}

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Parses a `YYYY-MM-DD` input value as local midnight; returns NaN when invalid. */
export function fromDateInput(value: string): number {
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return NaN;
  return new Date(y, m - 1, d).getTime();
}

export function toDateInput(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function validateNoFapStart(start: number, now: number): string | null {
  if (Number.isNaN(start)) return 'Informe uma data válida.';
  if (start > now) return 'A data de início não pode estar no futuro.';
  return null;
}
