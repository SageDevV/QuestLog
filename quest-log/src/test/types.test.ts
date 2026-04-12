import { describe, it, expect } from 'vitest';
import { DIFFICULTY_CONFIG, getTitle } from '../types';

describe('DIFFICULTY_CONFIG', () => {
  // Req 3.1: Fácil — 25 XP, 10 gold
  it('easy: 25 XP and 10 gold', () => {
    expect(DIFFICULTY_CONFIG.easy.xp).toBe(25);
    expect(DIFFICULTY_CONFIG.easy.gold).toBe(10);
  });

  // Req 3.2: Médio — 50 XP, 25 gold
  it('medium: 50 XP and 25 gold', () => {
    expect(DIFFICULTY_CONFIG.medium.xp).toBe(50);
    expect(DIFFICULTY_CONFIG.medium.gold).toBe(25);
  });

  // Req 3.3: Difícil — 100 XP, 50 gold
  it('hard: 100 XP and 50 gold', () => {
    expect(DIFFICULTY_CONFIG.hard.xp).toBe(100);
    expect(DIFFICULTY_CONFIG.hard.gold).toBe(50);
  });

  // Req 3.4: Lendário — 200 XP, 100 gold
  it('legendary: 200 XP and 100 gold', () => {
    expect(DIFFICULTY_CONFIG.legendary.xp).toBe(200);
    expect(DIFFICULTY_CONFIG.legendary.gold).toBe(100);
  });

  // Req 3.5: distinct emojis and colors
  it('easy: emoji 🟢 and color #4ade80', () => {
    expect(DIFFICULTY_CONFIG.easy.emoji).toBe('🟢');
    expect(DIFFICULTY_CONFIG.easy.color).toBe('#4ade80');
  });

  it('medium: emoji 🟡 and color #facc15', () => {
    expect(DIFFICULTY_CONFIG.medium.emoji).toBe('🟡');
    expect(DIFFICULTY_CONFIG.medium.color).toBe('#facc15');
  });

  it('hard: emoji 🔴 and color #f87171', () => {
    expect(DIFFICULTY_CONFIG.hard.emoji).toBe('🔴');
    expect(DIFFICULTY_CONFIG.hard.color).toBe('#f87171');
  });

  it('legendary: emoji 🟣 and color #c084fc', () => {
    expect(DIFFICULTY_CONFIG.legendary.emoji).toBe('🟣');
    expect(DIFFICULTY_CONFIG.legendary.color).toBe('#c084fc');
  });
});

describe('getTitle', () => {
  // Req 5.1: levels 1–3 → "🌱 Novato"
  it.each([1, 2, 3])('level %i → "🌱 Novato"', (level) => {
    expect(getTitle(level)).toBe('🌱 Novato');
  });

  // Req 5.2: levels 4–6 → "🗡️ Aventureiro"
  it.each([4, 5, 6])('level %i → "🗡️ Aventureiro"', (level) => {
    expect(getTitle(level)).toBe('🗡️ Aventureiro');
  });

  // Req 5.3: levels 7–9 → "🛡️ Guerreiro"
  it.each([7, 8, 9])('level %i → "🛡️ Guerreiro"', (level) => {
    expect(getTitle(level)).toBe('🛡️ Guerreiro');
  });

  // Req 5.4: levels 10–14 → "⚔️ Cavaleiro"
  it.each([10, 11, 12, 13, 14])('level %i → "⚔️ Cavaleiro"', (level) => {
    expect(getTitle(level)).toBe('⚔️ Cavaleiro');
  });

  // Req 5.5: levels 15–19 → "👑 Grão-Mestre"
  it.each([15, 16, 17, 18, 19])('level %i → "👑 Grão-Mestre"', (level) => {
    expect(getTitle(level)).toBe('👑 Grão-Mestre');
  });

  // Req 5.6: levels 20+ → "🏆 Lenda Viva"
  it.each([20, 25, 50, 100])('level %i → "🏆 Lenda Viva"', (level) => {
    expect(getTitle(level)).toBe('🏆 Lenda Viva');
  });
});
