import { ActiveBattle } from '@/src/shared/lib/api/internal';
import { GameBoard } from '../../game-board';
import { ControlPanel } from '../../control-panel';
import { EventLog } from '../../event-log';
import { ArenaLegend } from '../../arena-legend';
import { FieldGrid, StateSnapshot } from '@/src/shared/model';
import { GameMode, GameResult } from '@/src/app/model/game-store';
import { ArenaMapType } from '@/src/shared/lib/arena-config';
import { MetaBattleInfo } from '../../meta-info';

type TActiveBattlePageProps = {
  activeBattle: ActiveBattle;
  field: FieldGrid;
  canManageArena: boolean;
  isRunning: boolean;
  currentStep: number;
  histories: StateSnapshot[][];
  mapType: ArenaMapType;
  speedIndex: number;
  result: GameResult;
  mapWidth: number;
  mapHeight: number;
  gameMode: GameMode;
  onToggle: () => void;
  onReset: () => void;
  onStepBackward: () => void;
  onStepForward: () => void;
  onSetStep: (step: number) => void;
  onSpeedChange: (index: number) => void;
  scriptError: string;
  messages: string[];
};

export default function ActiveBattlePage(props: TActiveBattlePageProps) {
  const {
    activeBattle,
    field,
    canManageArena,
    isRunning,
    currentStep,
    histories,
    mapType,
    speedIndex,
    result,
    mapWidth,
    mapHeight,
    gameMode,
    onToggle,
    onReset,
    onStepBackward,
    onStepForward,
    onSetStep,
    onSpeedChange,
    scriptError,
    messages,
  } = props;

  return (
    <>
      <div className='grid w-full gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start'>
        <div className='flex min-w-0 flex-col items-center gap-6'>
          <div className='flex w-full max-w-5xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 px-6 py-5 shadow-sm'>
            <div className='shrink-0'>
              <p className='text-xs text-center uppercase tracking-[0.25em] text-indigo-600'>
                Сейчас соревнуются
              </p>
            </div>

            <div className='flex justify-center'>
              <div className='grid max-w-4xl items-center gap-4 lg:grid-cols-[minmax(280px,1fr)_auto_minmax(280px,1fr)]'>
                <div className='justify-self-center min-w-0 w-full max-w-md rounded-xl border border-rose-100 bg-rose-50/70 px-4 py-3 text-center'>
                  <div className='text-[11px] uppercase tracking-[0.18em] text-rose-500'>
                    🔴 Участник 1
                  </div>
                  <div className='mt-1 flex items-baseline justify-center gap-2'>
                    <span className='truncate text-lg font-semibold text-slate-950'>
                      {activeBattle.left_player_name}
                    </span>
                    <span className='shrink-0 text-sm text-slate-500'>
                      v{activeBattle.left_submission_version}
                    </span>
                  </div>
                </div>

                <p className='px-2 text-center text-3xl font-semibold'>
                  против
                </p>

                <div className='justify-self-center min-w-0 w-full max-w-md rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-center'>
                  <div className='text-[11px] uppercase tracking-[0.18em] text-emerald-600'>
                    🟢 Участник 2
                  </div>
                  <div className='mt-1 flex items-baseline justify-center gap-2'>
                    <span className='truncate text-lg font-semibold text-slate-950'>
                      {activeBattle.right_player_name}
                    </span>
                    <span className='shrink-0 text-sm text-slate-500'>
                      v{activeBattle.right_submission_version}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='flex w-full justify-center'>
            <GameBoard field={field} />
          </div>
        </div>

        <div className='flex w-full flex-col gap-4 xl:sticky xl:top-4 xl:w-[320px]'>
          <ControlPanel
            canManageArena={canManageArena}
            isRunning={isRunning}
            currentStep={currentStep}
            histories={histories}
            mapType={mapType}
            speedIndex={speedIndex}
            result={result}
            mapWidth={mapWidth}
            mapHeight={mapHeight}
            gameMode={gameMode}
            activeBattle={activeBattle}
            onToggle={onToggle}
            onReset={onReset}
            onStepBackward={onStepBackward}
            onStepForward={onStepForward}
            onSetStep={onSetStep}
            onSpeedChange={onSpeedChange}
          />

          {scriptError && (
            <div className='rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 shadow-sm'>
              {scriptError}
            </div>
          )}

          <MetaBattleInfo
            gameMode={gameMode}
            mapType={mapType}
            mapWidth={mapWidth}
            mapHeight={mapHeight}
            canManageArena={canManageArena}
          />
          <EventLog messages={messages} />
          <ArenaLegend />
        </div>
      </div>
    </>
  );
}
