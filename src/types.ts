export type RecurrenceType = 'single' | 'daily' | 'weekly';

// Dias da semana: 0=Domingo, 1=Segunda, ..., 6=Sábado
export type WeekdaySelection = number[];

export type QuestDifficulty = 'easy' | 'medium' | 'hard' | 'legendary';

export type QuestTag = '💪 Saúde' | '📚 Estudo' | '💼 Trabalho' | '🎮 Lazer' | '🧙 Magia' | '🗡️ Combate' | '🌎 Explorar';

export type QuestAgent = 'Claude' | 'Codex' | 'Gemini' | 'Kiro' | 'Manual';

// Maverick Hunter — Autonomous execution status tracking
export type MaverickStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed';

export const AGENT_CONFIG: Record<QuestAgent, { emoji: string; color: string; bg: string }> = {
  Claude: { emoji: '🟠', color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
  Codex:  { emoji: '🟢', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  Gemini: { emoji: '🔵', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  Kiro:   { emoji: '🟣', color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
  Manual: { emoji: '🔧', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
};

export interface Quest {
  id: string;
  title: string;
  description: string;
  difficulty: QuestDifficulty;
  tag?: QuestTag;
  agentLabel?: QuestAgent;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  scheduledDate: number;
  recurrenceType?: RecurrenceType;
  progress?: number;
  // Maverick Hunter — Autonomous execution metadata
  maverickStatus?: MaverickStatus;
  maverickStartedAt?: number;
  maverickCompletedAt?: number;
  maverickBranch?: string;
  maverickProject?: string;
  maverickLog?: string;
  maverickError?: string;
}

export interface Hero {
  name: string;
  level: number;
  xp: number;
  xpToNext: number;
  gold: number;
  questsCompleted: number;
  title: string;
  inventory: string[];
  bgUnlocked: string[];
}

export const DIFFICULTY_CONFIG: Record<QuestDifficulty, { label: string; xp: number; gold: number; emoji: string; color: string }> = {
  easy: { label: 'Fácil', xp: 25, gold: 10, emoji: '🟢', color: '#4ade80' },
  medium: { label: 'Médio', xp: 50, gold: 25, emoji: '🟡', color: '#facc15' },
  hard: { label: 'Difícil', xp: 100, gold: 50, emoji: '🔴', color: '#f87171' },
  legendary: { label: 'Lendário', xp: 200, gold: 100, emoji: '🟣', color: '#c084fc' },
};

export function getTitle(level: number): string {
  if (level >= 20) return '⚡ Maverick Hunter S';
  if (level >= 15) return '🔷 Maverick Hunter A';
  if (level >= 10) return '💎 Maverick Hunter B';
  if (level >= 7) return '🔵 Reploid Elite';
  if (level >= 4) return '🤖 Reploid';
  return '🔋 Rookie';
}
