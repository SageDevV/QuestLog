import { Quest } from './types';

const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/**
 * Retorna o número de dias em um mês (month é 0-indexed).
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Retorna o dia da semana (0=Dom, 6=Sáb) do primeiro dia do mês.
 */
export function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/**
 * Formata o nome do mês em português e o ano.
 * Ex: "Janeiro 2025"
 */
export function formatMonthYear(year: number, month: number): string {
  return `${MONTH_NAMES_PT[month]} ${year}`;
}

/**
 * Agrupa quests por dia do mês usando o campo scheduledDate.
 * Inclui tanto quests ativas quanto completadas.
 * Retorna um Map<number, Quest[]> onde a chave é o dia (1-31).
 * Filtra apenas quests com scheduledDate dentro do mês/ano especificado.
 */
export function groupQuestsByDay(
  quests: Quest[],
  year: number,
  month: number,
): Map<number, Quest[]> {
  const map = new Map<number, Quest[]>();

  for (const quest of quests) {
    if (quest.scheduledDate == null) continue;

    const date = new Date(quest.scheduledDate);
    if (isNaN(date.getTime())) continue;

    if (date.getFullYear() === year && date.getMonth() === month) {
      const day = date.getDate();
      const existing = map.get(day);
      if (existing) {
        existing.push(quest);
      } else {
        map.set(day, [quest]);
      }
    }
  }

  return map;
}
