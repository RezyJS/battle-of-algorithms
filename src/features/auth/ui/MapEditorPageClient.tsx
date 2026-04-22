'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eraser,
  PenTool,
} from 'lucide-react';

import {
  useMapEditorStore,
  BRUSH_OPTIONS,
  findPoint,
  sanitizeGrid,
} from '@/src/app/model/map-editor-store';
import { MAP_SIZE_LIMITS } from '@/src/app/model/game-store';
import { ModerationNav } from '@/src/features/moderation/ui/ModerationNav';
import { MapEditorGrid, ToolPalette } from '@/src/widgets/map-editor';
import { applyCustomArenaMapAction } from '@/app/map-editor/actions';
import type { ArenaMapConfig } from '@/src/shared/lib/arena-config';
import type { FieldGrid } from '@/src/shared/model';

const HOTKEY_TOOL_MAP = Object.fromEntries(
  BRUSH_OPTIONS.map((tool) => [tool.hotkey, tool.type]),
);

function parseDimensionInput(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function toEditorGrid(config: ArenaMapConfig): FieldGrid {
  const nextGrid = config.grid.map((row) => [...row]);

  if (nextGrid[config.spawn1.y]?.[config.spawn1.x] !== undefined) {
    nextGrid[config.spawn1.y][config.spawn1.x] = 'spawn1';
  }

  if (nextGrid[config.spawn2.y]?.[config.spawn2.x] !== undefined) {
    nextGrid[config.spawn2.y][config.spawn2.x] = 'spawn2';
  }

  return nextGrid;
}

export function MapEditorPageClient({
  activeBattleId,
  initialConfig,
}: {
  activeBattleId: number | null;
  initialConfig: ArenaMapConfig | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success'>(
    'idle',
  );
  const {
    grid,
    width,
    height,
    activeTool,
    validationError,
    loadGrid,
    paintCell,
    setTool,
    resize,
    clear,
    validate,
  } = useMapEditorStore();
  const [widthInput, setWidthInput] = useState(() => String(width));
  const [heightInput, setHeightInput] = useState(() => String(height));
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (initialConfig?.mapType === 'custom') {
      loadGrid(toEditorGrid(initialConfig));
      return;
    }

    if (initialConfig) {
      useMapEditorStore
        .getState()
        .initGrid(initialConfig.width, initialConfig.height);
    }
  }, [initialConfig, loadGrid]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;

      if (
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const nextTool = HOTKEY_TOOL_MAP[event.key];

      if (nextTool) {
        setTool(nextTool);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setTool]);

  useEffect(() => {
    setWidthInput(String(width));
  }, [width]);

  useEffect(() => {
    setHeightInput(String(height));
  }, [height]);

  const handlePaint = (x: number, y: number) => {
    setValidationStatus('idle');
    setSubmitError(null);
    paintCell(x, y);
  };

  const handleResize = (nextWidth: number, nextHeight: number) => {
    setValidationStatus('idle');
    setSubmitError(null);
    resize(nextWidth, nextHeight);
  };

  const handleClear = () => {
    setValidationStatus('idle');
    setSubmitError(null);
    clear();
  };

  const commitWidth = () => {
    const nextWidth = parseDimensionInput(widthInput, width);

    if (Number.isNaN(Number(widthInput))) {
      setWidthInput(String(width));
      return;
    }

    handleResize(nextWidth, height);
  };

  const commitHeight = () => {
    const nextHeight = parseDimensionInput(heightInput, height);

    if (Number.isNaN(Number(heightInput))) {
      setHeightInput(String(height));
      return;
    }

    handleResize(width, nextHeight);
  };

  const nudgeWidth = (delta: number) => {
    const nextWidth = parseDimensionInput(widthInput, width) + delta;
    setWidthInput(String(nextWidth));
    handleResize(nextWidth, height);
  };

  const nudgeHeight = (delta: number) => {
    const nextHeight = parseDimensionInput(heightInput, height) + delta;
    setHeightInput(String(nextHeight));
    handleResize(width, nextHeight);
  };

  const handleSizeInputKeyDown = (
    event: ReactKeyboardEvent<HTMLInputElement>,
    commit: () => void,
  ) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
      commit();
    }
  };

  const handleValidate = () => {
    setValidationStatus(validate() ? 'success' : 'idle');
  };

  const handleApply = () => {
    if (!activeBattleId) {
      setSubmitError('Сначала назначьте активный бой в модерации.');
      return;
    }

    if (!validate()) {
      return;
    }

    const currentGrid = useMapEditorStore.getState().grid;
    const spawn1 = findPoint(currentGrid, 'spawn1');
    const spawn2 = findPoint(currentGrid, 'spawn2');

    if (!spawn1 || !spawn2) {
      setSubmitError('Не удалось определить точки спавна.');
      return;
    }

    setSubmitError(null);

    startTransition(async () => {
      try {
        await applyCustomArenaMapAction({
          grid: sanitizeGrid(currentGrid),
          spawn1,
          spawn2,
          gameMode: initialConfig?.gameMode ?? 'duel',
        });
        router.push('/');
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : 'Не удалось сохранить карту.',
        );
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-4">
        <ModerationNav />
      </div>

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-indigo-600/80 mb-2">
            <PenTool className="w-3.5 h-3.5" />
            Map Editor
          </div>
          <h1 className="text-2xl font-bold text-slate-950">Конструктор карт</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Рисуйте стены, ключи, выход и спавны на своей сетке. После
            применения карта сохранится в активный бой на сервере и появится у
            всех на арене.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад на арену
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="bg-white/80 rounded-xl border border-slate-200 p-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between shadow-sm">
            <div>
              <h2 className="text-sm font-semibold text-slate-950">Размер сетки</h2>
              <p className="text-xs text-slate-500 mt-1">
                Доступно от {MAP_SIZE_LIMITS.minWidth}×{MAP_SIZE_LIMITS.minHeight}{' '}
                до {MAP_SIZE_LIMITS.maxWidth}×{MAP_SIZE_LIMITS.maxHeight}.
              </p>
            </div>

            <div className="flex items-end gap-3">
              <label className="space-y-1">
                <span className="block text-xs text-slate-500">Ширина</span>
                <div className="relative">
                  <input
                    type="number"
                    min={MAP_SIZE_LIMITS.minWidth}
                    max={MAP_SIZE_LIMITS.maxWidth}
                    step={1}
                    inputMode="numeric"
                    value={widthInput}
                    onChange={(event) => setWidthInput(event.target.value)}
                    onBlur={commitWidth}
                    onKeyDown={(event) => handleSizeInputKeyDown(event, commitWidth)}
                    className="number-input w-24 rounded-lg border border-slate-300 bg-white px-3 py-2 pr-9 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  />
                  <div className="absolute inset-y-1 right-1 flex w-7 flex-col overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => nudgeWidth(1)}
                      className="flex-1 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-950 transition-colors"
                      aria-label="Увеличить ширину"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => nudgeWidth(-1)}
                      className="flex-1 flex items-center justify-center border-t border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-950 transition-colors"
                      aria-label="Уменьшить ширину"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </label>

              <label className="space-y-1">
                <span className="block text-xs text-slate-500">Высота</span>
                <div className="relative">
                  <input
                    type="number"
                    min={MAP_SIZE_LIMITS.minHeight}
                    max={MAP_SIZE_LIMITS.maxHeight}
                    step={1}
                    inputMode="numeric"
                    value={heightInput}
                    onChange={(event) => setHeightInput(event.target.value)}
                    onBlur={commitHeight}
                    onKeyDown={(event) =>
                      handleSizeInputKeyDown(event, commitHeight)
                    }
                    className="number-input w-24 rounded-lg border border-slate-300 bg-white px-3 py-2 pr-9 text-sm text-slate-900 outline-none focus:border-indigo-500"
                  />
                  <div className="absolute inset-y-1 right-1 flex w-7 flex-col overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => nudgeHeight(1)}
                      className="flex-1 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-950 transition-colors"
                      aria-label="Увеличить высоту"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => nudgeHeight(-1)}
                      className="flex-1 flex items-center justify-center border-t border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-950 transition-colors"
                      aria-label="Уменьшить высоту"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <MapEditorGrid
            grid={grid}
            activeTool={activeTool}
            onPaint={handlePaint}
          />
        </div>

        <div className="space-y-4">
          <ToolPalette
            tools={BRUSH_OPTIONS}
            activeTool={activeTool}
            onSelect={setTool}
          />

          <div className="bg-white/80 rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm">
            <button
              type="button"
              onClick={handleValidate}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Проверить карту
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={isPending || !activeBattleId}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {isPending ? 'Сохраняем...' : 'Применить в арену'}
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-100 transition-colors"
            >
              <Eraser className="w-4 h-4" />
              Очистить
            </button>
          </div>

          <div className="bg-white/80 rounded-xl border border-slate-200 p-4 space-y-2 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-950">Статус</h3>

            {submitError ? (
              <p className="text-sm text-rose-700">{submitError}</p>
            ) : validationError ? (
              <p className="text-sm text-rose-700">{validationError}</p>
            ) : validationStatus === 'success' ? (
              <p className="text-sm text-emerald-700">Карта валидна.</p>
            ) : (
              <p className="text-sm text-slate-600">
                Проверьте карту перед применением.
              </p>
            )}

            {!activeBattleId && (
              <p className="text-sm text-amber-700">
                Сейчас нет активного боя. Сначала назначьте пару в модерации.
              </p>
            )}
          </div>

          <div className="bg-white/80 rounded-xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-950">Подсказки</h3>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              <li>Спавны, ключи и выход должны быть доступны по проходам.</li>
              <li>Перед запуском боя лучше проверить карту валидатором.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
