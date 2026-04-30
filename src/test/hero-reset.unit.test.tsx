import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { resetHeroProgress, defaultHero } from '../store';
import type { Hero } from '../types';
import HeroPanel from '../components/HeroPanel';

// ============================================================
// 5.1 Unit tests for resetHeroProgress
// ============================================================

describe('resetHeroProgress', () => {
  it('resets all numeric fields and title to initial values', () => {
    const hero: Hero = {
      name: 'Gandalf',
      level: 15,
      xp: 80,
      xpToNext: 500,
      gold: 9999,
      questsCompleted: 42,
      title: '👑 Grão-Mestre',
    };

    const result = resetHeroProgress(hero);
    const base = defaultHero();

    expect(result.level).toBe(base.level);
    expect(result.xp).toBe(base.xp);
    expect(result.xpToNext).toBe(base.xpToNext);
    expect(result.gold).toBe(base.gold);
    expect(result.questsCompleted).toBe(base.questsCompleted);
    expect(result.title).toBe(base.title);
  });

  it('preserves the hero name', () => {
    const hero: Hero = {
      name: 'Aragorn',
      level: 10,
      xp: 50,
      xpToNext: 300,
      gold: 500,
      questsCompleted: 20,
      title: '⚔️ Cavaleiro',
    };

    const result = resetHeroProgress(hero);
    expect(result.name).toBe('Aragorn');
  });

  it('resetting a default hero returns an equivalent default hero', () => {
    const hero = defaultHero();
    const result = resetHeroProgress(hero);
    expect(result).toEqual(hero);
  });
});

// ============================================================
// 5.2 HeroPanel button rendering tests
// ============================================================

describe('HeroPanel reset button rendering', () => {
  const baseHero: Hero = defaultHero();
  const noop = () => {};

  it('renders the reset button', () => {
    render(<HeroPanel hero={baseHero} onRename={noop} onReset={noop} />);
    const btn = screen.getByRole('button', { name: /resetar progresso do herói/i });
    expect(btn).toBeInTheDocument();
  });

  it('reset button has correct aria-label', () => {
    render(<HeroPanel hero={baseHero} onRename={noop} onReset={noop} />);
    const btn = screen.getByLabelText('Resetar progresso do herói');
    expect(btn).toBeInTheDocument();
  });

  it('reset button displays the correct text', () => {
    render(<HeroPanel hero={baseHero} onRename={noop} onReset={noop} />);
    const btn = screen.getByRole('button', { name: /resetar progresso do herói/i });
    expect(btn.textContent).toContain('Resetar Progresso');
  });
});

// ============================================================
// 5.3 Confirmation flow tests
// ============================================================

describe('HeroPanel reset confirmation flow', () => {
  const baseHero: Hero = defaultHero();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls onReset when confirm returns true', () => {
    const onReset = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<HeroPanel hero={baseHero} onRename={() => {}} onReset={onReset} />);
    const btn = screen.getByRole('button', { name: /resetar progresso do herói/i });
    fireEvent.click(btn);

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('does not call onReset when confirm returns false', () => {
    const onReset = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<HeroPanel hero={baseHero} onRename={() => {}} onReset={onReset} />);
    const btn = screen.getByRole('button', { name: /resetar progresso do herói/i });
    fireEvent.click(btn);

    expect(onReset).not.toHaveBeenCalled();
  });

  it('confirm dialog receives the correct warning message', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<HeroPanel hero={baseHero} onRename={() => {}} onReset={() => {}} />);
    const btn = screen.getByRole('button', { name: /resetar progresso do herói/i });
    fireEvent.click(btn);

    expect(confirmSpy).toHaveBeenCalledWith(
      'Tem certeza que deseja resetar o progresso? Todo o progresso do herói será perdido.'
    );
  });
});
