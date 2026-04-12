import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  playClickSound,
  initButtonClickSound,
  cleanupButtonClickSound,
} from '../buttonClickSound';

// ============================================================
// Web Audio API mock (same pattern as property tests)
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
}

interface MockGainNode {
  gain: {
    setValueAtTime: ReturnType<typeof vi.fn>;
    linearRampToValueAtTime: ReturnType<typeof vi.fn>;
  };
  connect: ReturnType<typeof vi.fn>;
}

let mockOscillators: MockOscillator[];
let mockGainNodes: MockGainNode[];

function createMockOscillator(): MockOscillator {
  const osc: MockOscillator = {
    type: 'sine' as OscillatorType,
    frequency: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  mockOscillators.push(osc);
  return osc;
}

function createMockGainNode(): MockGainNode {
  const gainNode: MockGainNode = {
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  };
  mockGainNodes.push(gainNode);
  return gainNode;
}

function createMockAudioContext() {
  return {
    currentTime: 0,
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

// ============================================================
// Unit tests: button click sound
// ============================================================

describe('Unit tests: button click sound', () => {
  beforeEach(() => {
    mockOscillators = [];
    mockGainNodes = [];
    cleanupButtonClickSound();
    installAudioContextMock();
  });

  afterEach(() => {
    cleanupButtonClickSound();
    vi.unstubAllGlobals();
  });

  // ============================================================
  // 4.1 AudioContext é null antes do primeiro clique e inicializado após
  // **Validates: Requirements 4.1**
  // ============================================================
  describe('4.1 AudioContext lazy initialization', () => {
    it('AudioContext is null before first click and initialized after', () => {
      initButtonClickSound();

      // Before any click, no AudioContext should have been constructed
      expect(mockOscillators.length).toBe(0);
      expect(vi.mocked(globalThis.AudioContext)).not.toHaveBeenCalled();

      // Click a button to trigger lazy init
      const btn = document.createElement('button');
      document.body.appendChild(btn);
      btn.click();

      // After click, AudioContext should have been created and an oscillator produced
      expect(vi.mocked(globalThis.AudioContext)).toHaveBeenCalledTimes(1);
      expect(mockOscillators.length).toBe(1);

      document.body.removeChild(btn);
    });
  });

  // ============================================================
  // 4.2 Clique em elemento não-botão não dispara som
  // ============================================================
  describe('4.2 Click on non-button element does not trigger sound', () => {
    it('clicking a <div> does not create an oscillator', () => {
      initButtonClickSound();

      const div = document.createElement('div');
      document.body.appendChild(div);
      div.click();

      expect(mockOscillators.length).toBe(0);

      document.body.removeChild(div);
    });

    it('clicking a <span> does not create an oscillator', () => {
      initButtonClickSound();

      const span = document.createElement('span');
      document.body.appendChild(span);
      span.click();

      expect(mockOscillators.length).toBe(0);

      document.body.removeChild(span);
    });
  });

  // ============================================================
  // 4.3 Cleanup remove listener e fecha AudioContext
  // ============================================================
  describe('4.3 cleanup removes listener and closes AudioContext', () => {
    it('after cleanup, clicking a button does not trigger sound', () => {
      initButtonClickSound();

      // First click to initialize AudioContext
      const btn = document.createElement('button');
      document.body.appendChild(btn);
      btn.click();
      expect(mockOscillators.length).toBe(1);

      // Cleanup
      cleanupButtonClickSound();

      // Reset tracking to see if new oscillators are created
      mockOscillators = [];

      // Click again — listener should be removed, no new oscillator
      btn.click();
      expect(mockOscillators.length).toBe(0);

      document.body.removeChild(btn);
    });

    it('cleanup calls close() on the AudioContext', () => {
      // Trigger AudioContext creation
      playClickSound();
      expect(vi.mocked(globalThis.AudioContext)).toHaveBeenCalledTimes(1);

      // Grab the mock instance to check close was called
      const ctxInstance = vi.mocked(globalThis.AudioContext).mock.results[0].value;

      cleanupButtonClickSound();
      expect(ctxInstance.close).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================
  // 4.4 App funciona quando Web Audio API não está disponível
  // **Validates: Requirements 6.1**
  // ============================================================
  describe('4.4 app works when Web Audio API is unavailable', () => {
    it('playClickSound does not throw when AudioContext is undefined', () => {
      // Remove AudioContext from global scope
      cleanupButtonClickSound();
      vi.unstubAllGlobals();
      vi.stubGlobal('AudioContext', undefined);

      expect(() => playClickSound()).not.toThrow();
      expect(mockOscillators.length).toBe(0);
    });

    it('handleGlobalClick does not throw when AudioContext is undefined', () => {
      cleanupButtonClickSound();
      vi.unstubAllGlobals();
      vi.stubGlobal('AudioContext', undefined);

      initButtonClickSound();

      const btn = document.createElement('button');
      document.body.appendChild(btn);

      expect(() => btn.click()).not.toThrow();
      expect(mockOscillators.length).toBe(0);

      document.body.removeChild(btn);
    });
  });
});
