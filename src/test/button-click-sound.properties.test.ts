import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import {
  playClickSound,
  handleGlobalClick,
  initButtonClickSound,
  cleanupButtonClickSound,
} from '../buttonClickSound';

// ============================================================
// Sub-task 3.1: Web Audio API mock that tracks calls & params
// ============================================================

interface MockOscillator {
  type: OscillatorType;
  frequency: {
    setValueAtTime: ReturnType<typeof vi.fn>;
    linearRampToValueAtTime: ReturnType<typeof vi.fn>;
  };
  connect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  startTime?: number;
  stopTime?: number;
}

interface MockGainNode {
  gain: {
    setValueAtTime: ReturnType<typeof vi.fn>;
    linearRampToValueAtTime: ReturnType<typeof vi.fn>;
    calls: Array<{ value: number; time: number }>;
  };
  connect: ReturnType<typeof vi.fn>;
}

let mockOscillators: MockOscillator[];
let mockGainNodes: MockGainNode[];
let mockCurrentTime: number;

function createMockOscillator(): MockOscillator {
  const osc: MockOscillator = {
    type: 'sine' as OscillatorType,
    frequency: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    start: vi.fn().mockImplementation((time?: number) => {
      osc.startTime = time ?? mockCurrentTime;
    }),
    stop: vi.fn().mockImplementation((time?: number) => {
      osc.stopTime = time ?? mockCurrentTime;
    }),
  };
  mockOscillators.push(osc);
  return osc;
}

function createMockGainNode(): MockGainNode {
  const gainNode: MockGainNode = {
    gain: {
      calls: [],
      setValueAtTime: vi.fn().mockImplementation((value: number, time: number) => {
        gainNode.gain.calls.push({ value, time });
      }),
      linearRampToValueAtTime: vi.fn().mockImplementation((value: number, time: number) => {
        gainNode.gain.calls.push({ value, time });
      }),
    },
    connect: vi.fn(),
  };
  mockGainNodes.push(gainNode);
  return gainNode;
}

function createMockAudioContext() {
  return {
    currentTime: mockCurrentTime,
    state: 'running' as AudioContextState,
    destination: {},
    createOscillator: vi.fn().mockImplementation(() => createMockOscillator()),
    createGain: vi.fn().mockImplementation(() => createMockGainNode()),
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };
}

function installAudioContextMock() {
  const MockAudioContextClass = vi.fn().mockImplementation(() => createMockAudioContext());
  vi.stubGlobal('AudioContext', MockAudioContextClass);
}

function installFailingAudioContextMock(failPoint: string) {
  const MockAudioContextClass = vi.fn().mockImplementation(() => {
    const ctx = createMockAudioContext();
    if (failPoint === 'constructor') {
      throw new Error('AudioContext constructor failed');
    }
    if (failPoint === 'createOscillator') {
      ctx.createOscillator = vi.fn().mockImplementation(() => {
        throw new Error('createOscillator failed');
      });
    }
    if (failPoint === 'createGain') {
      ctx.createGain = vi.fn().mockImplementation(() => {
        throw new Error('createGain failed');
      });
    }
    if (failPoint === 'connect') {
      ctx.createOscillator = vi.fn().mockImplementation(() => {
        const osc = createMockOscillator();
        osc.connect = vi.fn().mockImplementation(() => {
          throw new Error('connect failed');
        });
        return osc;
      });
    }
    if (failPoint === 'start') {
      ctx.createOscillator = vi.fn().mockImplementation(() => {
        const osc = createMockOscillator();
        osc.start = vi.fn().mockImplementation(() => {
          throw new Error('start failed');
        });
        return osc;
      });
    }
    return ctx;
  });
  vi.stubGlobal('AudioContext', MockAudioContextClass);
}


describe('Property-based tests: button click sound', () => {
  beforeEach(() => {
    mockOscillators = [];
    mockGainNodes = [];
    mockCurrentTime = 0;
    installAudioContextMock();
  });

  afterEach(() => {
    cleanupButtonClickSound();
    vi.unstubAllGlobals();
  });

  // Helper to reset mock tracking arrays between fc iterations.
  // cleanupButtonClickSound() resets the module's audioContext to null
  // and removes the listener, so a fresh iteration starts clean.
  function resetIteration() {
    cleanupButtonClickSound();
    mockOscillators = [];
    mockGainNodes = [];
    installAudioContextMock();
  }

  // ============================================================
  // Sub-task 3.2 — Property 1: Clique em botão dispara som
  // Feature: button-interaction-sound, Property 1: Clique em botão dispara som
  // **Validates: Requirements 1.1**
  // ============================================================
  it('Property 1: clicking N buttons triggers N playClickSound calls (N oscillators created)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        (n) => {
          resetIteration();
          initButtonClickSound();

          const buttons: HTMLButtonElement[] = [];
          for (let i = 0; i < n; i++) {
            const btn = document.createElement('button');
            btn.textContent = `Button ${i}`;
            document.body.appendChild(btn);
            buttons.push(btn);
          }

          for (const btn of buttons) {
            btn.click();
          }

          expect(mockOscillators.length).toBe(n);

          for (const btn of buttons) {
            document.body.removeChild(btn);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // ============================================================
  // Sub-task 3.3 — Property 2: Duração ≤ 200ms
  // Feature: button-interaction-sound, Property 2: Duração do som não excede 200ms
  // **Validates: Requirements 1.2**
  // ============================================================
  it('Property 2: each oscillator stop - start ≤ 0.2s', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        (n) => {
          resetIteration();

          for (let i = 0; i < n; i++) {
            playClickSound();
          }

          expect(mockOscillators.length).toBe(n);
          for (const osc of mockOscillators) {
            expect(osc.startTime).toBeDefined();
            expect(osc.stopTime).toBeDefined();
            const duration = osc.stopTime! - osc.startTime!;
            expect(duration).toBeLessThanOrEqual(0.2);
            expect(duration).toBeGreaterThanOrEqual(0);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // ============================================================
  // Sub-task 3.4 — Property 3: Volume ≤ 0.15
  // Feature: button-interaction-sound, Property 3: Volume do clique não excede o volume da música de fundo
  // **Validates: Requirements 2.2**
  // ============================================================
  it('Property 3: max gain value ≤ 0.15 for every invocation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        (n) => {
          resetIteration();

          for (let i = 0; i < n; i++) {
            playClickSound();
          }

          expect(mockGainNodes.length).toBe(n);
          for (const gainNode of mockGainNodes) {
            for (const call of gainNode.gain.calls) {
              expect(call.value).toBeLessThanOrEqual(0.15);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // ============================================================
  // Sub-task 3.5 — Property 4: Cliques rápidos criam instâncias independentes
  // Feature: button-interaction-sound, Property 4: Cliques rápidos criam instâncias de som independentes
  // **Validates: Requirements 3.1, 3.2**
  // ============================================================
  it('Property 4: N rapid clicks create N independent oscillators', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 30 }),
        (n) => {
          resetIteration();
          initButtonClickSound();

          const btn = document.createElement('button');
          btn.textContent = 'Rapid';
          document.body.appendChild(btn);

          for (let i = 0; i < n; i++) {
            btn.click();
          }

          expect(mockOscillators.length).toBe(n);

          for (const osc of mockOscillators) {
            expect(osc.start).toHaveBeenCalledTimes(1);
            expect(osc.stop).toHaveBeenCalledTimes(1);
          }

          document.body.removeChild(btn);
        },
      ),
      { numRuns: 100 },
    );
  });

  // ============================================================
  // Sub-task 3.6 — Property 5: Botões dinâmicos disparam som
  // Feature: button-interaction-sound, Property 5: Botões dinâmicos também disparam som
  // **Validates: Requirements 5.2**
  // ============================================================
  it('Property 5: dynamically added buttons trigger sound', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 15 }),
        (n) => {
          resetIteration();
          initButtonClickSound();

          const buttons: HTMLButtonElement[] = [];
          for (let i = 0; i < n; i++) {
            const btn = document.createElement('button');
            btn.textContent = `Dynamic ${i}`;
            document.body.appendChild(btn);
            buttons.push(btn);
          }

          for (const btn of buttons) {
            btn.click();
          }

          expect(mockOscillators.length).toBe(n);

          for (const btn of buttons) {
            document.body.removeChild(btn);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // ============================================================
  // Sub-task 3.7 — Property 6: Erros não propagam exceções
  // Feature: button-interaction-sound, Property 6: Erros na reprodução não propagam exceções
  // **Validates: Requirements 6.1, 6.2**
  // ============================================================
  it('Property 6: playClickSound never throws regardless of failure point', () => {
    const failPoints = ['constructor', 'createOscillator', 'createGain', 'connect', 'start'] as const;

    fc.assert(
      fc.property(
        fc.constantFrom(...failPoints),
        fc.integer({ min: 1, max: 10 }),
        (failPoint, n) => {
          cleanupButtonClickSound();
          mockOscillators = [];
          mockGainNodes = [];
          vi.unstubAllGlobals();
          installFailingAudioContextMock(failPoint);

          for (let i = 0; i < n; i++) {
            expect(() => playClickSound()).not.toThrow();
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
