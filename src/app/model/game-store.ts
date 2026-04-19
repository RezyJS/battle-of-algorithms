import { create } from 'zustand';
import type {
  StateSnapshot,
  FieldGrid,
} from '@/src/shared/model';
import { Operator } from '@/src/entities/operator';
import { mergeFields } from '@/src/entities/field';
import { executeScript } from '@/src/features/battle-runner';
import { algorithmTemplates } from '@/src/features/script-editor';
import {
  buildStaticArenaMapConfig,
  type ArenaMapConfig,
  type ArenaMapType,
} from '@/src/shared/lib/arena-config';

interface PlayerConfig {
  uid: string;
  emoji: string;
  label: string;
}

const PLAYERS: PlayerConfig[] = [
  { uid: '🔴', emoji: '🔴', label: 'Игрок 1' },
  { uid: '🟢', emoji: '🟢', label: 'Игрок 2' },
];

export type GameMode = 'race' | 'duel';

const DEFAULT_ARENA_CONFIG = buildStaticArenaMapConfig();

export type GameResult = {
  winner: number | null; // 0, 1, or null for draw
  reason: string;
  scores: [number, number];
} | null;

const SPEED_OPTIONS = [
  { label: '0.5x', ms: 400 },
  { label: '1x', ms: 200 },
  { label: '2x', ms: 100 },
  { label: '4x', ms: 50 },
  { label: '8x', ms: 25 },
];

const MAP_SIZE_LIMITS = {
  minWidth: 6,
  maxWidth: 20,
  minHeight: 4,
  maxHeight: 14,
} as const;

interface GameState {
  currentStep: number;
  isRunning: boolean;
  messages: string[];
  histories: StateSnapshot[][];
  operators: Operator[];
  scriptError: string;
  scripts: string[];
  field: FieldGrid;
  currentMap: FieldGrid;
  mapType: ArenaMapType;
  speedIndex: number;
  result: GameResult;
  effectiveMaxStep: number;
  mapWidth: number;
  mapHeight: number;
  gameMode: GameMode;

  initialize: () => void;
  applyArenaConfig: (config: ArenaMapConfig) => void;
  runAlgorithms: () => void;
  togglePlayback: () => void;
  reset: () => void;
  stepForward: () => void;
  setScript: (index: number, script: string) => void;
  setScriptsPair: (leftScript: string, rightScript: string) => void;
  setIsRunning: (running: boolean) => void;
  setSpeedIndex: (index: number) => void;
}

/**
 * Determine the effective last step: once both have exited or it's clear
 * the remaining player can't win, we can stop early.
 */
function computeEffectiveMaxStep(histories: StateSnapshot[][]): number {
  if (histories.length < 2) return 0;

  const len = Math.max(...histories.map((h) => h.length));
  let allDone = len - 1;

  for (let step = 1; step < len; step++) {
    const states = histories.map((h) => h[Math.min(step, h.length - 1)]);
    const bothExited = states.every((s) => s.hasExited);
    // If one exited, give the other a few more steps to also exit, then stop
    const oneExited = states.some((s) => s.hasExited);

    if (bothExited) {
      allDone = step;
      break;
    }

    if (oneExited) {
      // Allow 10 more steps for the other to catch up, then cut
      const grace = Math.min(step + 10, len - 1);
      const otherExitedInGrace = (() => {
        for (let g = step; g <= grace; g++) {
          const gs = histories.map((h) => h[Math.min(g, h.length - 1)]);
          if (gs.every((s) => s.hasExited)) return g;
        }
        return null;
      })();
      allDone = otherExitedInGrace ?? grace;
      break;
    }
  }

  return allDone;
}

/**
 * Determine the winner at a given step.
 */
function determineResult(
  histories: StateSnapshot[][],
  step: number,
): GameResult {
  if (histories.length < 2) return null;

  const snap = histories.map((h) => h[Math.min(step, h.length - 1)]);
  const exited = snap.map((s) => s.hasExited);
  const hasKey = snap.map((s) => s.hasKey);

  // Find at which step each player exited
  const exitStep = histories.map((h) => {
    for (let i = 1; i < h.length; i++) {
      if (h[i].hasExited && !h[i - 1].hasExited) return i;
    }
    return null;
  });

  const scores: [number, number] = [0, 0];

  // Key bonus
  if (hasKey[0]) scores[0] += 50;
  if (hasKey[1]) scores[1] += 50;

  // Exit bonus
  if (exited[0]) scores[0] += 100;
  if (exited[1]) scores[1] += 100;

  // Determine winner
  if (exited[0] && exited[1]) {
    // Both exited — earlier exit wins
    if (exitStep[0]! < exitStep[1]!) {
      scores[0] += 25;
      return { winner: 0, reason: `${PLAYERS[0].emoji} вышел первым (шаг ${exitStep[0]})`, scores };
    }
    if (exitStep[1]! < exitStep[0]!) {
      scores[1] += 25;
      return { winner: 1, reason: `${PLAYERS[1].emoji} вышел первым (шаг ${exitStep[1]})`, scores };
    }
    // Same step — tie
    return { winner: null, reason: 'Ничья — оба вышли одновременно', scores };
  }

  if (exited[0]) {
    scores[0] += 25;
    return { winner: 0, reason: `${PLAYERS[0].emoji} единственный выбрался`, scores };
  }
  if (exited[1]) {
    scores[1] += 25;
    return { winner: 1, reason: `${PLAYERS[1].emoji} единственный выбрался`, scores };
  }

  // Nobody exited — whoever has key is better, else draw
  if (hasKey[0] && !hasKey[1]) {
    return { winner: 0, reason: `Таймаут — ${PLAYERS[0].emoji} хотя бы нашёл ключ`, scores };
  }
  if (hasKey[1] && !hasKey[0]) {
    return { winner: 1, reason: `Таймаут — ${PLAYERS[1].emoji} хотя бы нашёл ключ`, scores };
  }

  return { winner: null, reason: 'Таймаут — никто не выбрался', scores };
}

export const useGameStore = create<GameState>((set, get) => {
  let spawnPositions = [
    DEFAULT_ARENA_CONFIG.spawn1,
    DEFAULT_ARENA_CONFIG.spawn2,
  ];

  return {
    currentStep: 0,
    isRunning: false,
    messages: [],
    histories: [],
    operators: [],
    scriptError: '',
    scripts: [algorithmTemplates.simple.code, algorithmTemplates.wallFollower.code],
    field: DEFAULT_ARENA_CONFIG.grid,
    currentMap: DEFAULT_ARENA_CONFIG.grid,
    mapType: DEFAULT_ARENA_CONFIG.mapType,
    speedIndex: 1, // 1x
    result: null,
    effectiveMaxStep: 0,
    mapWidth: DEFAULT_ARENA_CONFIG.width,
    mapHeight: DEFAULT_ARENA_CONFIG.height,
    gameMode: DEFAULT_ARENA_CONFIG.gameMode,

    applyArenaConfig: (config) => {
      const nextMap = config.grid.map((row) => [...row]);
      spawnPositions = [config.spawn1, config.spawn2];
      set({
        currentMap: nextMap,
        field: nextMap,
        mapType: config.mapType,
        mapWidth: config.width,
        mapHeight: config.height,
        gameMode: config.gameMode,
        isRunning: false,
        result: null,
      });
      get().initialize();
    },

    initialize: () => {
      const { currentMap, gameMode } = get();
      const fieldCopy = currentMap.map((row) => [...row]);
      const ops = PLAYERS.map((p, i) =>
        new Operator(
          p.uid,
          fieldCopy,
          currentMap,
          spawnPositions[i].x,
          spawnPositions[i].y,
        ),
      );

      if (gameMode === 'duel') {
        ops[0].setDuelContext(ops[1]);
        ops[1].setDuelContext(ops[0]);
      }

      const hists = ops.map((op) => op.getHistory());
      const field = mergeFields(currentMap, ops, hists, 0);
      set({
        operators: ops,
        histories: hists,
        currentStep: 0,
        messages: [],
        scriptError: '',
        field,
        result: null,
        effectiveMaxStep: 0,
      });
    },

    runAlgorithms: () => {
      const { operators, scripts, gameMode } = get();
      set({ scriptError: '' });

      for (let i = 0; i < operators.length; i++) {
        const error = executeScript(operators[i], scripts[i], 1000, gameMode);
        if (error) {
          set({ scriptError: error });
          return;
        }
      }

      const histories = operators.map((op) => op.getHistory());
      const effectiveMaxStep = computeEffectiveMaxStep(histories);
      set({ histories, currentStep: 0, messages: [], result: null, effectiveMaxStep });
    },

    togglePlayback: () => {
      const { isRunning, histories, currentStep, effectiveMaxStep } = get();
      if (isRunning) {
        set({ isRunning: false });
        return;
      }

      const needsRun =
        histories.length === 0 ||
        histories[0]?.length <= 1 ||
        currentStep >= effectiveMaxStep;

      if (needsRun) {
        get().initialize();
        get().runAlgorithms();
      }
      set({ isRunning: true });
    },

    reset: () => {
      get().initialize();
      set({ isRunning: false });
    },

    stepForward: () => {
      const { currentStep, histories, operators, currentMap, effectiveMaxStep } = get();

      if (currentStep >= effectiveMaxStep) {
        // Determine result at the effective end
        const result = determineResult(histories, effectiveMaxStep);
        set({ isRunning: false, result });
        return;
      }

      const nextStep = currentStep + 1;
      const newMessages: string[] = [];

      operators.forEach((op, idx) => {
        const history = histories[idx];
        if (nextStep >= history.length) return;
        const prev = history[nextStep - 1];
        const curr = history[nextStep];
        if (curr.hasKey && !prev.hasKey) {
          newMessages.push(`${op.getUID()} 🔑 Ключ подобран!`);
        }
        if (curr.hasExited && !prev.hasExited) {
          newMessages.push(`${op.getUID()} 🚪 Выбрался!`);
        }
      });

      const field = mergeFields(currentMap, operators, histories, nextStep);

      // Check if we just reached the effective max
      let result: GameResult = null;
      if (nextStep >= effectiveMaxStep) {
        result = determineResult(histories, nextStep);
      }

      set((state) => ({
        currentStep: nextStep,
        messages: [...state.messages, ...newMessages],
        field,
        ...(result ? { result, isRunning: false } : {}),
      }));
    },

    setScript: (index, script) => {
      const { currentMap } = get();

      set((state) => {
        const scripts = [...state.scripts];
        scripts[index] = script;
        return {
          scripts,
          currentStep: 0,
          isRunning: false,
          histories: [],
          messages: [],
          scriptError: '',
          result: null,
          field: currentMap,
          effectiveMaxStep: 0,
        };
      });

      get().initialize();
    },

    setScriptsPair: (leftScript, rightScript) => {
      const { currentMap } = get();

      set({
        scripts: [leftScript, rightScript],
        currentStep: 0,
        isRunning: false,
        histories: [],
        messages: [],
        scriptError: '',
        result: null,
        field: currentMap,
        effectiveMaxStep: 0,
      });

      get().initialize();
    },

    setIsRunning: (running) => set({ isRunning: running }),

    setSpeedIndex: (index) => set({ speedIndex: index }),
  };
});

export { PLAYERS, SPEED_OPTIONS, MAP_SIZE_LIMITS };
export type { PlayerConfig };
