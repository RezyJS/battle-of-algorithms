'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eraser,
  Info,
  PenTool,
  WandSparkles,
} from 'lucide-react';

import { generateMap } from '@/src/entities/field';
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
import {
  normalizeArenaMapConfig,
  type ArenaMapConfig,
} from '@/src/shared/lib/arena-config';
import {
  decodeMapCodeToConfig,
  encodeMapConfigToCode,
} from '@/src/shared/lib/map-share';
import type { FieldGrid } from '@/src/shared/model';
import { ExpandableCard } from '@/src/shared/ui/ExpandableCard';

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
  draftMode,
  returnTo,
  draftStorageKey,
  showModerationNav,
  title,
  description,
}: {
  activeBattleId: number | null;
  initialConfig: ArenaMapConfig | null;
  draftMode: boolean;
  returnTo: string;
  draftStorageKey: string;
  showModerationNav: boolean;
  title: string;
  description?: string;
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
  const [seedInput, setSeedInput] = useState('');
  const [mapCodeInput, setMapCodeInput] = useState('');
  const [mapCodeStatus, setMapCodeStatus] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialConfig && typeof window !== 'undefined') {
      const rawDraft = window.localStorage.getItem(draftStorageKey);

      if (rawDraft) {
        try {
          const draftConfig = JSON.parse(rawDraft) as ArenaMapConfig;
          loadGrid(toEditorGrid(draftConfig));
          return;
        } catch {
          window.localStorage.removeItem(draftStorageKey);
        }
      }
    }

    if (initialConfig?.mapType === 'custom') {
      loadGrid(toEditorGrid(initialConfig));
      return;
    }

    if (initialConfig) {
      useMapEditorStore
        .getState()
        .initGrid(initialConfig.width, initialConfig.height);
    }
  }, [draftStorageKey, initialConfig, loadGrid]);

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
    setMapCodeStatus(null);
    setSubmitError(null);
    paintCell(x, y);
  };

  const handleResize = (nextWidth: number, nextHeight: number) => {
    setValidationStatus('idle');
    setMapCodeStatus(null);
    setSubmitError(null);
    resize(nextWidth, nextHeight);
  };

  const handleClear = () => {
    setValidationStatus('idle');
    setMapCodeStatus(null);
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

  const buildCurrentMapConfig = (): ArenaMapConfig | null => {
    const currentGrid = useMapEditorStore.getState().grid;
    const spawn1 = findPoint(currentGrid, 'spawn1');
    const spawn2 = findPoint(currentGrid, 'spawn2');

    if (!spawn1 || !spawn2) {
      setSubmitError('Не удалось определить точки спавна.');
      return null;
    }

    return {
      gameMode: initialConfig?.gameMode ?? 'duel',
      mapType: 'custom',
      width: currentGrid[0]?.length ?? 0,
      height: currentGrid.length,
      grid: sanitizeGrid(currentGrid),
      spawn1,
      spawn2,
    };
  };

  const handleGenerateBySeed = () => {
    setValidationStatus('idle');
    setMapCodeStatus(null);
    setSubmitError(null);

    const nextWidth = parseDimensionInput(widthInput, width);
    const nextHeight = parseDimensionInput(heightInput, height);
    const generated = generateMap(
      nextWidth,
      nextHeight,
      seedInput.trim() || undefined,
    );
    const generatedGrid = generated.grid.map((row) => [...row]);

    generatedGrid[generated.spawn1.y][generated.spawn1.x] = 'spawn1';
    generatedGrid[generated.spawn2.y][generated.spawn2.x] = 'spawn2';

    loadGrid(generatedGrid);
  };

  const handleCopyMapCode = async () => {
    if (!validate()) {
      return;
    }

    const currentConfig = buildCurrentMapConfig();

    if (!currentConfig) {
      return;
    }

    const nextCode = encodeMapConfigToCode(currentConfig);
    setMapCodeInput(nextCode);
    setMapCodeStatus('Код карты готов.');

    try {
      await navigator.clipboard.writeText(nextCode);
      setMapCodeStatus('Код карты скопирован.');
    } catch {
      setMapCodeStatus('Код карты готов. Скопируйте его из поля ниже.');
    }
  };

  const handleImportMapCode = () => {
    try {
      const decodedConfig = normalizeArenaMapConfig(
        decodeMapCodeToConfig(mapCodeInput),
      );
      loadGrid(toEditorGrid(decodedConfig));
      setMapCodeStatus('Карта загружена из кода.');
      setValidationStatus('idle');
      setSubmitError(null);
    } catch (error) {
      setMapCodeStatus(null);
      setSubmitError(
        error instanceof Error ?
          error.message
        : 'Не удалось импортировать карту.',
      );
    }
  };

  const handleApply = () => {
    setSubmitError(null);

    if (!draftMode && activeBattleId) {
      const isValid = validate();
      setValidationStatus(isValid ? 'success' : 'idle');

      if (!isValid) {
        setSubmitError(
          'Карту нельзя применить в арену, пока она не пройдёт проверку.',
        );
        return;
      }
    }

    const nextConfig = buildCurrentMapConfig();

    if (!nextConfig) {
      return;
    }

    if (draftMode || !activeBattleId) {
      window.localStorage.setItem(draftStorageKey, JSON.stringify(nextConfig));
      router.push(returnTo);
      return;
    }

    startTransition(async () => {
      try {
        await applyCustomArenaMapAction(nextConfig);
        window.localStorage.setItem(
          draftStorageKey,
          JSON.stringify(nextConfig),
        );
        router.push(returnTo);
      } catch (error) {
        setSubmitError(
          error instanceof Error ?
            error.message
          : 'Не удалось сохранить карту.',
        );
      }
    });
  };

  return (
    <div className='max-w-7xl mx-auto px-4 py-6'>
      {showModerationNav && (
        <div className='mb-4'>
          <ModerationNav />
        </div>
      )}

      <div className='mb-6 flex gap-3 md:flex-row md:items-end md:justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-slate-950'>{title}</h1>
        </div>

        <Link
          href={returnTo}
          className='inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-950 transition-colors'
        >
          <ArrowLeft className='w-4 h-4' />
          Назад
        </Link>
      </div>

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]'>
        <div className='space-y-4'>
          <div className='rounded-xl border border-slate-200 bg-white shadow-sm'>
            <div className='flex items-center gap-4 px-5 py-4'>
              <div className='min-w-0 w-full'>
                <div className='flex w-full justify-between items-center gap-x-2 gap-y-1'>
                  <div className='flex flex-col'>
                    <h2 className='text-sm font-semibold text-slate-900'>
                      Размеры карты
                    </h2>
                    <p className='mt-1 text-sm text-slate-500'>
                      Выбирайте размеры вашего поля
                    </p>
                  </div>

                  <div>
                    <div className='flex items-end gap-3'>
                      <label className='space-y-1'>
                        <span className='block text-xs text-slate-500'>
                          Ширина
                        </span>
                        <div className='relative'>
                          <input
                            type='number'
                            min={MAP_SIZE_LIMITS.minWidth}
                            max={MAP_SIZE_LIMITS.maxWidth}
                            step={1}
                            inputMode='numeric'
                            value={widthInput}
                            onChange={(event) =>
                              setWidthInput(event.target.value)
                            }
                            onBlur={commitWidth}
                            onKeyDown={(event) =>
                              handleSizeInputKeyDown(event, commitWidth)
                            }
                            className='number-input w-24 rounded-lg border border-slate-300 bg-white px-3 py-2 pr-9 text-sm text-slate-900 outline-none focus:border-indigo-500'
                          />
                          <div className='absolute inset-y-1 right-1 flex w-7 flex-col overflow-hidden rounded-md border border-slate-200 bg-slate-50'>
                            <button
                              type='button'
                              onClick={() => nudgeWidth(1)}
                              className='flex-1 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-950 transition-colors'
                              aria-label='Увеличить ширину'
                            >
                              <ChevronUp className='w-3.5 h-3.5' />
                            </button>
                            <button
                              type='button'
                              onClick={() => nudgeWidth(-1)}
                              className='flex-1 flex items-center justify-center border-t border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-950 transition-colors'
                              aria-label='Уменьшить ширину'
                            >
                              <ChevronDown className='w-3.5 h-3.5' />
                            </button>
                          </div>
                        </div>
                      </label>

                      <label className='space-y-1'>
                        <span className='block text-xs text-slate-500'>
                          Высота
                        </span>
                        <div className='relative'>
                          <input
                            type='number'
                            min={MAP_SIZE_LIMITS.minHeight}
                            max={MAP_SIZE_LIMITS.maxHeight}
                            step={1}
                            inputMode='numeric'
                            value={heightInput}
                            onChange={(event) =>
                              setHeightInput(event.target.value)
                            }
                            onBlur={commitHeight}
                            onKeyDown={(event) =>
                              handleSizeInputKeyDown(event, commitHeight)
                            }
                            className='number-input w-24 rounded-lg border border-slate-300 bg-white px-3 py-2 pr-9 text-sm text-slate-900 outline-none focus:border-indigo-500'
                          />
                          <div className='absolute inset-y-1 right-1 flex w-7 flex-col overflow-hidden rounded-md border border-slate-200 bg-slate-50'>
                            <button
                              type='button'
                              onClick={() => nudgeHeight(1)}
                              className='flex-1 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-950 transition-colors'
                              aria-label='Увеличить высоту'
                            >
                              <ChevronUp className='w-3.5 h-3.5' />
                            </button>
                            <button
                              type='button'
                              onClick={() => nudgeHeight(-1)}
                              className='flex-1 flex items-center justify-center border-t border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-950 transition-colors'
                              aria-label='Уменьшить высоту'
                            >
                              <ChevronDown className='w-3.5 h-3.5' />
                            </button>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* <ExpandableCard
            title='Размер сетки'
            subtitle={`Доступно от ${MAP_SIZE_LIMITS.minWidth}×${MAP_SIZE_LIMITS.minHeight} до ${MAP_SIZE_LIMITS.maxWidth}×${MAP_SIZE_LIMITS.maxHeight}.`}
            defaultOpen={false}
          ></ExpandableCard> */}

          <ExpandableCard
            title='Seed'
            subtitle='Один и тот же seed создаёт одинаковую карту при одинаковом размере.'
            defaultOpen={false}
          >
            <div className='flex flex-col gap-3 md:flex-row md:items-end'>
              <label className='flex-1 space-y-1'>
                <span className='block text-xs text-slate-500'>Seed</span>
                <input
                  type='text'
                  value={seedInput}
                  onChange={(event) => setSeedInput(event.target.value)}
                  placeholder='Например: alpha-42'
                  className='w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500'
                />
              </label>

              <button
                type='button'
                onClick={handleGenerateBySeed}
                className='inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100'
              >
                <WandSparkles className='h-4 w-4' />
                Сгенерировать по seed
              </button>
            </div>
          </ExpandableCard>

          <ExpandableCard
            title='Код карты'
            subtitle='Скопируйте код текущей карты или вставьте чужой код для импорта.'
            defaultOpen={false}
          >
            <div className='flex flex-col gap-3'>
              <textarea
                value={mapCodeInput}
                onChange={(event) => setMapCodeInput(event.target.value)}
                rows={4}
                placeholder='boa-map:...'
                className='w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500'
              />

              <div className='flex flex-wrap gap-2'>
                <button
                  type='button'
                  onClick={handleCopyMapCode}
                  className='rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500'
                >
                  Скопировать код карты
                </button>
                <button
                  type='button'
                  onClick={handleImportMapCode}
                  className='rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100'
                >
                  Импортировать код
                </button>
              </div>

              {mapCodeStatus && (
                <p className='text-sm text-emerald-700'>{mapCodeStatus}</p>
              )}
            </div>
          </ExpandableCard>

          <MapEditorGrid
            grid={grid}
            activeTool={activeTool}
            onPaint={handlePaint}
          />
        </div>

        <div className='space-y-4'>
          <ToolPalette
            tools={BRUSH_OPTIONS}
            activeTool={activeTool}
            onSelect={setTool}
          />

          <div
            className={`rounded-xl border px-4 py-3 shadow-sm ${
              getMapStatusAppearance({
                submitError,
                validationError,
                validationStatus,
                draftMode,
                activeBattleId,
              }).container
            }`}
          >
            <div className='flex items-start gap-3'>
              <div
                className={`mt-0.5 rounded-lg p-1.5 ${
                  getMapStatusAppearance({
                    submitError,
                    validationError,
                    validationStatus,
                    draftMode,
                    activeBattleId,
                  }).iconWrap
                }`}
              >
                {(
                  getMapStatusAppearance({
                    submitError,
                    validationError,
                    validationStatus,
                    draftMode,
                    activeBattleId,
                  }).kind === 'error'
                ) ?
                  <AlertCircle
                    className={`w-4 h-4 ${
                      getMapStatusAppearance({
                        submitError,
                        validationError,
                        validationStatus,
                        draftMode,
                        activeBattleId,
                      }).icon
                    }`}
                  />
                : (
                  getMapStatusAppearance({
                    submitError,
                    validationError,
                    validationStatus,
                    draftMode,
                    activeBattleId,
                  }).kind === 'success'
                ) ?
                  <CheckCircle2
                    className={`w-4 h-4 ${
                      getMapStatusAppearance({
                        submitError,
                        validationError,
                        validationStatus,
                        draftMode,
                        activeBattleId,
                      }).icon
                    }`}
                  />
                : <Info
                    className={`w-4 h-4 ${
                      getMapStatusAppearance({
                        submitError,
                        validationError,
                        validationStatus,
                        draftMode,
                        activeBattleId,
                      }).icon
                    }`}
                  />
                }
              </div>
              <div>
                <p
                  className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                    getMapStatusAppearance({
                      submitError,
                      validationError,
                      validationStatus,
                      draftMode,
                      activeBattleId,
                    }).eyebrow
                  }`}
                >
                  {
                    getMapStatusAppearance({
                      submitError,
                      validationError,
                      validationStatus,
                      draftMode,
                      activeBattleId,
                    }).label
                  }
                </p>
                <p
                  className={`mt-1 text-sm font-medium ${
                    getMapStatusAppearance({
                      submitError,
                      validationError,
                      validationStatus,
                      draftMode,
                      activeBattleId,
                    }).title
                  }`}
                >
                  {getMapStatusMessage({
                    submitError,
                    validationError,
                    validationStatus,
                    draftMode,
                    activeBattleId,
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white/80 rounded-xl border border-slate-200 p-4 space-y-3 shadow-sm'>
            <button
              type='button'
              onClick={handleValidate}
              className='w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors shadow-sm'
            >
              <CheckCircle2 className='w-4 h-4' />
              Проверить карту
            </button>

            <button
              type='button'
              onClick={handleApply}
              disabled={isPending}
              className='w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors'
            >
              {isPending ?
                'Сохраняем...'
              : draftMode || !activeBattleId ?
                'Сохранить черновик'
              : 'Применить в арену'}
            </button>

            <button
              type='button'
              onClick={handleClear}
              className='w-full inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-100 transition-colors'
            >
              <Eraser className='w-4 h-4' />
              Очистить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getMapStatusAppearance({
  submitError,
  validationError,
  validationStatus,
}: {
  submitError: string | null;
  validationError: string | null;
  validationStatus: 'idle' | 'success';
  draftMode: boolean;
  activeBattleId: number | null;
}) {
  if (submitError || validationError) {
    return {
      kind: 'error' as const,
      label: 'Проверка не пройдена',
      container: 'border-rose-200 bg-rose-50',
      iconWrap: 'bg-rose-100',
      icon: 'text-rose-700',
      eyebrow: 'text-rose-500',
      title: 'text-rose-900',
    };
  }

  if (validationStatus === 'success') {
    return {
      kind: 'success' as const,
      label: 'Карта готова',
      container: 'border-emerald-200 bg-emerald-50',
      iconWrap: 'bg-emerald-100',
      icon: 'text-emerald-700',
      eyebrow: 'text-emerald-600',
      title: 'text-emerald-900',
    };
  }

  return {
    kind: 'info' as const,
    label: 'Статус',
    container: 'border-indigo-200 bg-indigo-50',
    iconWrap: 'bg-indigo-100',
    icon: 'text-indigo-700',
    eyebrow: 'text-indigo-500',
    title: 'text-indigo-900',
  };
}

function getMapStatusMessage({
  submitError,
  validationError,
  validationStatus,
  draftMode,
  activeBattleId,
}: {
  submitError: string | null;
  validationError: string | null;
  validationStatus: 'idle' | 'success';
  draftMode: boolean;
  activeBattleId: number | null;
}) {
  if (submitError) {
    return submitError;
  }

  if (validationError) {
    return validationError;
  }

  if (validationStatus === 'success') {
    return 'Карта прошла проверку и готова к сохранению.';
  }

  if (!activeBattleId && !draftMode) {
    return 'Сейчас нет активного боя. Карта сохранится только как черновик.';
  }

  return 'Проверьте карту перед применением в арену.';
}
