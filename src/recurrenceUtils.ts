import { RecurrenceType } from './types';

export interface RecurrenceConfig {
  type: RecurrenceType;
  startDate: string; // formato 'YYYY-MM-DD'
  endDate?: string;  // formato 'YYYY-MM-DD', obrigatório para daily/weekly
  weekdays?: number[]; // obrigatório para weekly
}

/**
 * Converte string 'YYYY-MM-DD' em timestamp de meia-noite local.
 */
function toMidnightTimestamp(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00').getTime();
}

/**
 * Gera array de timestamps (meia-noite local) para cada ocorrência.
 * Retorna datas em ordem cronológica, sem duplicatas.
 */
export function generateOccurrences(config: RecurrenceConfig): number[] {
  const { type, startDate, endDate, weekdays } = config;

  if (type === 'single') {
    return [toMidnightTimestamp(startDate)];
  }

  if (!endDate) return [];

  const start = toMidnightTimestamp(startDate);
  const end = toMidnightTimestamp(endDate);
  const results: number[] = [];
  const current = new Date(startDate + 'T00:00:00');
  const endTime = end;

  while (current.getTime() <= endTime) {
    const ts = current.getTime();
    if (type === 'daily') {
      results.push(ts);
    } else if (type === 'weekly' && weekdays && weekdays.includes(current.getDay())) {
      results.push(ts);
    }
    current.setDate(current.getDate() + 1);
  }

  return results;
}

/**
 * Valida a configuração de recorrência.
 * Retorna null se válida, ou string com mensagem de erro.
 */
export function validateRecurrenceConfig(config: RecurrenceConfig): string | null {
  if (config.type === 'single') return null;

  if (!config.endDate) {
    return 'Data de fim é obrigatória para recorrência diária ou semanal.';
  }

  const start = toMidnightTimestamp(config.startDate);
  const end = toMidnightTimestamp(config.endDate);

  if (end < start) {
    return 'Data de fim não pode ser anterior à data de início.';
  }

  if (config.type === 'weekly') {
    if (!config.weekdays || config.weekdays.length === 0) {
      return 'Selecione pelo menos um dia da semana.';
    }
  }

  return null;
}
