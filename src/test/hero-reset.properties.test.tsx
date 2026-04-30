import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { render, screen, fireEvent } from '@testing-library/react';
import { resetHeroProgress, defaultHero } from '../store';
import { arbitraryHero } from './arbitraries';
import HeroPanel from '../components/HeroPanel';

describe('Property-based tests: hero-progress-reset', () => {
  // Feature: hero-progress-reset, Property 1: Reset produz valores iniciais
  // **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 5.2**
  it('Property 1: Reset produces initial values for all numeric fields and title', () => {
    fc.assert(
      fc.property(arbitraryHero, (hero) => {
        const result = resetHeroProgress(hero);
        const base = defaultHero();

        expect(result.level).toBe(base.level);
        expect(result.xp).toBe(base.xp);
        expect(result.xpToNext).toBe(base.xpToNext);
        expect(result.gold).toBe(base.gold);
        expect(result.questsCompleted).toBe(base.questsCompleted);
        expect(result.title).toBe(base.title);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: hero-progress-reset, Property 2: Reset preserva o nome
  // **Validates: Requirements 3.7**
  it('Property 2: Reset preserves the hero name', () => {
    fc.assert(
      fc.property(arbitraryHero, (hero) => {
        const result = resetHeroProgress(hero);
        expect(result.name).toBe(hero.name);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: hero-progress-reset, Property 3: Round-trip de persistência do reset
  // **Validates: Requirements 4.1, 4.2, 5.1**
  it('Property 3: Reset round-trips through JSON serialization', () => {
    fc.assert(
      fc.property(arbitraryHero, (hero) => {
        const resetted = resetHeroProgress(hero);
        const roundTripped = JSON.parse(JSON.stringify(resetted));
        expect(roundTripped).toEqual(resetted);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: hero-progress-reset, Property 4: Idempotência do reset
  // **Validates: Requirements 6.1**
  it('Property 4: Reset is idempotent', () => {
    fc.assert(
      fc.property(arbitraryHero, (hero) => {
        const once = resetHeroProgress(hero);
        const twice = resetHeroProgress(resetHeroProgress(hero));
        expect(once).toEqual(twice);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: hero-progress-reset, Property 5: Cancelamento preserva estado
  // **Validates: Requirements 2.4**
  it('Property 5: Cancellation preserves hero state', () => {
    fc.assert(
      fc.property(arbitraryHero, (hero) => {
        const onReset = vi.fn();
        vi.spyOn(window, 'confirm').mockReturnValue(false);

        render(<HeroPanel hero={hero} onRename={() => {}} onReset={onReset} />);
        const btn = screen.getByRole('button', { name: /resetar progresso do herói/i });
        fireEvent.click(btn);

        expect(onReset).not.toHaveBeenCalled();

        vi.restoreAllMocks();
        // Cleanup rendered component
        document.body.innerHTML = '';
      }),
      { numRuns: 100 },
    );
  });
});
