'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
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

import { useMapEditorStore, BRUSH_OPTIONS } from '@/src/app/model/map-editor-store';
import { MAP_SIZE_LIMITS } from '@/src/app/model/game-store';
import { MapEditorGrid, ToolPalette } from '@/src/widgets/map-editor';

const HOTKEY_TOOL_MAP = Object.fromEntries(
  BRUSH_OPTIONS.map((tool) => [tool.hotkey, tool.type]),
);

function parseDimensionInput(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function MapEditorPageClient() {
  const router = useRouter();
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success'>(
    'idle',
  );
  const {
    grid,
    width,
    height,
    activeTool,
    validationError,
    paintCell,
    setTool,
    resize,
    clear,
    validate,
    applyToGame,
  } = useMapEditorStore();
  const [widthInput, setWidthInput] = useState(() => String(width));
  const [heightInput, setHeightInput] = useState(() => String(height));

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
    paintCell(x, y);
  };

  const handleResize = (nextWidth: number, nextHeight: number) => {
    setValidationStatus('idle');
    resize(nextWidth, nextHeight);
  };

  const handleClear = () => {
    setValidationStatus('idle');
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
    applyToGame();

    if (!useMapEditorStore.getState().validationError) {
      router.push('/');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-indigo-300/80 mb-2">
            <PenTool className="w-3.5 h-3.5" />
            Map Editor
          </div>
          <h1 className="text-2xl font-bold text-white">Конструктор карт</h1>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">
            Рисуйте стены, ключи, выход и спавны на своей сетке. После
            применения карта станет текущей ареной для следующего запуска.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад на арену
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="bg-gray-900/50 rounded-xl border border-white/5 p-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Размер сетки</h2>
              <p className="text-xs text-gray-500 mt-1">
                Доступно от {MAP_SIZE_LIMITS.minWidth}×{MAP_SIZE_LIMITS.minHeight}{' '}
                до {MAP_SIZE_LIMITS.maxWidth}×{MAP_SIZE_LIMITS.maxHeight}. Периметр
                всегда остаётся стеной.
              </p>
            </div>

            <div className="flex items-end gap-3">
              <label className="space-y-1">
                <span className="block text-xs text-gray-500">Ширина</span>
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
                    className="number-input w-24 rounded-lg border border-white/10 bg-gray-950 px-3 py-2 pr-9 text-sm text-white outline-none focus:border-indigo-500"
                  />
                  <div className="absolute inset-y-1 right-1 flex w-7 flex-col overflow-hidden rounded-md border border-white/10 bg-gray-900/90">
                    <button
                      type="button"
                      onClick={() => nudgeWidth(1)}
                      className="flex-1 flex items-center justify-center text-gray-300 hover:bg-white/8 hover:text-white transition-colors"
                      aria-label="Увеличить ширину"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => nudgeWidth(-1)}
                      className="flex-1 flex items-center justify-center border-t border-white/10 text-gray-300 hover:bg-white/8 hover:text-white transition-colors"
                      aria-label="Уменьшить ширину"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </label>

              <label className="space-y-1">
                <span className="block text-xs text-gray-500">Высота</span>
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
                    className="number-input w-24 rounded-lg border border-white/10 bg-gray-950 px-3 py-2 pr-9 text-sm text-white outline-none focus:border-indigo-500"
                  />
                  <div className="absolute inset-y-1 right-1 flex w-7 flex-col overflow-hidden rounded-md border border-white/10 bg-gray-900/90">
                    <button
                      type="button"
                      onClick={() => nudgeHeight(1)}
                      className="flex-1 flex items-center justify-center text-gray-300 hover:bg-white/8 hover:text-white transition-colors"
                      aria-label="Увеличить высоту"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => nudgeHeight(-1)}
                      className="flex-1 flex items-center justify-center border-t border-white/10 text-gray-300 hover:bg-white/8 hover:text-white transition-colors"
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

          <div className="bg-gray-900/50 rounded-xl border border-white/5 p-4 space-y-3">
            <button
              type="button"
              onClick={handleValidate}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Проверить карту
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-200 hover:bg-white/5 transition-colors"
            >
              Применить в арену
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-2.5 text-sm font-medium text-red-200 hover:bg-red-950/40 transition-colors"
            >
              <Eraser className="w-4 h-4" />
              Очистить
            </button>
          </div>

          <div className="bg-gray-900/50 rounded-xl border border-white/5 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-white">Статус</h3>

            {validationError ? (
              <p className="text-sm text-red-300">{validationError}</p>
            ) : validationStatus === 'success' ? (
              <p className="text-sm text-emerald-300">Карта валидна.</p>
            ) : (
              <p className="text-sm text-gray-400">
                Проверьте карту перед применением.
              </p>
            )}
          </div>

          <div className="bg-gray-900/50 rounded-xl border border-white/5 p-4">
            <h3 className="text-sm font-semibold text-white">Подсказки</h3>
            <ul className="mt-2 space-y-2 text-sm text-gray-400">
              <li>Спавны, ключи и выход должны быть доступны по проходам.</li>
              <li>Периметр карты всегда остаётся стеной.</li>
              <li>Перед запуском боя лучше проверить карту валидатором.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
