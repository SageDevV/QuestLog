import { describe, it, expect, beforeEach } from 'vitest';
import { loadHero, loadQuests, saveHero, saveQuests, completeQuest, defaultHero } from '../store';
import type { Quest, Hero } from '../types';

beforeEach(() => {
  localStorage.clear();
});

describe('loadHero', () => {
  it('returns default hero when localStorage is empty (Req 9.4)', () => {
    const hero = loadHero();
    expect(hero).toEqual(defaultHero());
  });

  it('returns default hero when localStorage has invalid JSON', () => {
    localStorage.setItem('questlog_hero', '{not valid json!!!');
    const hero = loadHero();
    expect(hero).toEqual(defaultHero());
  });
});

describe('loadQuests', () => {
  it('returns empty array when localStorage is empty (Req 9.5)', () => {
    const quests = loadQuests();
    expect(quests).toEqual([]);
  });

  it('returns empty array when localStorage has invalid JSON', () => {
    localStorage.setItem('questlog_quests', 'broken json [[[');
    const quests = loadQuests();
    expect(quests).toEqual([]);
  });
});

describe('saveHero / loadHero round-trip', () => {
  it('round-trips correctly', () => {
    const hero: Hero = {
      name: 'TestHero',
      level: 5,
      xp: 42,
      xpToNext: 185,
      gold: 300,
      questsCompleted: 12,
      title: '🗡️ Aventureiro',
    };
    saveHero(hero);
    expect(loadHero()).toEqual(hero);
  });
});

describe('saveQuests / loadQuests round-trip', () => {
  it('round-trips correctly', () => {
    const quests: Quest[] = [
      {
        id: 'q1',
        title: 'Slay the dragon',
        description: 'A fierce beast',
        difficulty: 'legendary',
        completed: false,
        createdAt: 1000,
        scheduledDate: 1000,
      },
      {
        id: 'q2',
        title: 'Gather herbs',
        description: '',
        difficulty: 'easy',
        completed: true,
        createdAt: 2000,
        completedAt: 3000,
        scheduledDate: 2000,
      },
    ];
    saveQuests(quests);
    expect(loadQuests()).toEqual(quests);
  });
});

describe('completeQuest', () => {
  it('legendary quest on level 1 hero causes level up (edge case Req 4.3)', () => {
    const hero = defaultHero(); // level 1, xp 0, xpToNext 100
    const quest: Quest = {
      id: 'leg1',
      title: 'Legendary quest',
      description: '',
      difficulty: 'legendary',
      completed: false,
      createdAt: Date.now(),
      scheduledDate: Date.now(),
    };
    // Legendary gives 200 XP. Hero needs 100 to level up.
    // After first level up: xp = 200 - 100 = 100, xpToNext = floor(100*1.3) = 130, level 2
    // 100 < 130, so stops. Level 2, xp 100.
    const result = completeQuest(hero, quest);
    expect(result.leveledUp).toBe(true);
    expect(result.hero.level).toBe(2);
    expect(result.hero.xp).toBe(100);
    expect(result.hero.xpToNext).toBe(130);
  });

  it('preserves hero name', () => {
    const hero: Hero = { ...defaultHero(), name: 'CustomName' };
    const quest: Quest = {
      id: 'q1',
      title: 'Simple task',
      description: '',
      difficulty: 'easy',
      completed: false,
      createdAt: Date.now(),
      scheduledDate: Date.now(),
    };
    const result = completeQuest(hero, quest);
    expect(result.hero.name).toBe('CustomName');
  });
});

describe('defaultHero', () => {
  it('has correct initial values (Req 4.1)', () => {
    const hero = defaultHero();
    expect(hero.name).toBe('Herói');
    expect(hero.level).toBe(1);
    expect(hero.xp).toBe(0);
    expect(hero.xpToNext).toBe(100);
    expect(hero.gold).toBe(0);
    expect(hero.questsCompleted).toBe(0);
    expect(hero.title).toBe('🌱 Novato');
  });
});
