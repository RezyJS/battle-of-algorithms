'use client';

import { startTransition, useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Compass,
  Eye,
  Lightbulb,
  MapPin,
  Save,
  Send,
  Timer,
} from 'lucide-react';

import {
  saveEditorDraftAction,
  submitEditorCodeAction,
} from '@/app/editor/actions';
import { useGameStore } from '@/src/app/model/game-store';
import {
  ScriptEditor,
  ScriptTemplateSelect,
} from '@/src/features/script-editor';
import type { UserSubmission } from '@/src/shared/lib/api/internal';
import { ExpandableCard } from '@/src/shared/ui/ExpandableCard';
import { EditorArenaPreview } from '@/src/widgets/editor-arena-preview';

function Collapsible({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className='border-b border-slate-200 last:border-b-0'>
      <button
        onClick={() => setOpen(!open)}
        className='w-full flex items-center gap-2 py-2.5 px-1 text-sm font-medium text-slate-700 hover:text-slate-950 transition-colors'
      >
        <Icon className='w-3.5 h-3.5 text-slate-500 shrink-0' />
        <span className='flex-1 text-left'>{title}</span>
        {open ?
          <ChevronDown className='w-3.5 h-3.5 text-slate-500' />
        : <ChevronRight className='w-3.5 h-3.5 text-slate-500' />}
      </button>
      {open && <div className='pb-3 space-y-1'>{children}</div>}
    </div>
  );
}

function MethodItem({ name, desc }: { name: string; desc: string }) {
  return (
    <div className='px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors'>
      <code className='text-xs text-indigo-600 font-mono'>{name}</code>
      <p className='text-xs text-slate-500 mt-0.5'>{desc}</p>
    </div>
  );
}

const API_SECTIONS = [
  {
    title: 'Движение',
    icon: ArrowRight,
    methods: [
      { name: 'operator.moveRight()', desc: 'Двигаться вправо' },
      { name: 'operator.moveLeft()', desc: 'Двигаться влево' },
      { name: 'operator.moveUp()', desc: 'Двигаться вверх' },
      { name: 'operator.moveDown()', desc: 'Двигаться вниз' },
      { name: 'operator.wait()', desc: 'Пропустить ход (стоит 1 шаг)' },
    ],
  },
  {
    title: 'Обзор',
    icon: Eye,
    methods: [
      { name: 'operator.lookRight()', desc: 'Можно ли идти вправо?' },
      { name: 'operator.lookLeft()', desc: 'Можно ли идти влево?' },
      { name: 'operator.lookUp()', desc: 'Можно ли идти вверх?' },
      { name: 'operator.lookDown()', desc: 'Можно ли идти вниз?' },
      {
        name: 'operator.scan(radius)',
        desc: '2D-массив клеток вокруг оператора',
      },
    ],
  },
  {
    title: 'Навигация',
    icon: Compass,
    methods: [
      {
        name: 'operator.getDistanceTo("key")',
        desc: 'Расстояние до ближайшего ключа',
      },
      { name: 'operator.getDistanceTo("exit")', desc: 'Расстояние до выхода' },
      { name: 'operator.getPosition()', desc: 'Текущая позиция (Point)' },
      {
        name: 'operator.getOpponentPosition()',
        desc: 'Позиция соперника {x, y} (только Дуэль)',
      },
    ],
  },
  {
    title: 'Метки',
    icon: MapPin,
    methods: [
      { name: 'operator.markCell()', desc: 'Оставить метку на текущей клетке' },
      {
        name: 'operator.isMarked(dx, dy)',
        desc: 'Проверить метку со смещением',
      },
    ],
  },
  {
    title: 'Состояние',
    icon: Timer,
    methods: [
      { name: 'operator.hasKey()', desc: 'Ключ подобран?' },
      { name: 'operator.hasExited()', desc: 'Оператор вышел?' },
      { name: 'operator.getStepCount()', desc: 'Количество сделанных шагов' },
    ],
  },
];

export function EditorPageClient({
  initialSubmission,
}: {
  initialSubmission: UserSubmission | null;
}) {
  const { scripts, setScript, isRunning } = useGameStore();
  const [submission, setSubmission] = useState<UserSubmission | null>(
    initialSubmission,
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialSubmission?.code) {
      setScript(0, initialSubmission.code);
    }
  }, [initialSubmission?.code, setScript]);

  const currentStatus = submission?.status ?? 'draft';
  const canSubmit = !isRunning && !isSubmitting && scripts[0].trim().length > 0;
  const saveDisabled = isRunning || isSaving || isSubmitting;

  const handleSaveDraft = () => {
    setIsSaving(true);

    startTransition(async () => {
      try {
        const nextSubmission = await saveEditorDraftAction(scripts[0]);
        setSubmission(nextSubmission);
      } catch {
      } finally {
        setIsSaving(false);
      }
    });
  };

  const handleSubmit = () => {
    setIsSubmitting(true);

    startTransition(async () => {
      try {
        const nextSubmission = await submitEditorCodeAction(scripts[0]);
        setSubmission(nextSubmission);
      } catch {
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  return (
    <div className='max-w-7xl mx-auto px-4 py-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold'>Редактор кода</h1>
        <p className='text-slate-600 text-sm mt-1'>
          Здесь вы можете написать и протестировать код для соревнований.
        </p>
      </div>

      <div className='flex flex-col gap-6 xl:flex-row'>
        <div className='flex-1'>
          {submission && (
            <div
              className={`mb-4 rounded-xl border px-4 py-3 shadow-sm ${getStatusAlertAppearance(currentStatus).container}`}
            >
              <div className='flex items-start gap-3'>
                <div
                  className={`mt-0.5 rounded-lg p-1.5 ${getStatusAlertAppearance(currentStatus).iconWrap}`}
                >
                  <CheckCircle2
                    className={`h-4 w-4 ${getStatusAlertAppearance(currentStatus).icon}`}
                  />
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
                    <p
                      className={`text-xs font-semibold uppercase tracking-[0.2em] ${getStatusAlertAppearance(currentStatus).eyebrow}`}
                    >
                      Статус отправки
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusAlertAppearance(currentStatus).iconWrap} ${getStatusAlertAppearance(currentStatus).title}`}
                    >
                      {getStatusLabel(currentStatus)}
                    </span>
                  </div>
                  <p
                    className={`mt-2 font-medium ${getStatusAlertAppearance(currentStatus).title}`}
                  >
                    {getStatusDescription(currentStatus)}
                  </p>

                  {submission.moderation_comment && (
                    <div className='mt-3 rounded-lg border border-white/70 bg-white/70 px-3 py-3'>
                      <p className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-500'>
                        Комментарий модератора
                      </p>
                      <p className='mt-1 text-sm font-medium text-slate-800'>
                        {submission.moderation_comment}
                      </p>
                    </div>
                  )}

                  <p className='mt-3 text-sm text-slate-600'>
                    Последнее обновление:{' '}
                    {formatSubmissionDate(submission.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <ExpandableCard
            title='Мой алгоритм'
            meta={
              <span className='rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500'>
                v{submission?.version ?? 1}
              </span>
            }
            actions={
              <ScriptTemplateSelect
                disabled={isRunning}
                onSelect={(script) => setScript(0, script)}
              />
            }
            defaultOpen
          >
            <ScriptEditor
              playerLabel='Мой алгоритм'
              playerEmoji='⚙️'
              submissionVersion={String(submission?.version ?? 1)}
              script={scripts[0]}
              onScriptChange={(script) => setScript(0, script)}
              disabled={isRunning}
              showHeader={false}
            />

            <div className='mt-3 flex justify-end gap-2'>
              <button
                type='button'
                onClick={handleSaveDraft}
                disabled={saveDisabled}
                className='inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50'
              >
                <Save className='h-4 w-4' />
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                type='button'
                onClick={handleSubmit}
                disabled={!canSubmit}
                className='inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm'
              >
                <Send className='h-4 w-4' />
                {isSubmitting ? 'Отправка...' : 'Отправить на модерацию'}
              </button>
            </div>
          </ExpandableCard>

          <EditorArenaPreview />
        </div>

        <div className='xl:w-72 space-y-4'>
          <div className='bg-white/80 rounded-xl border border-slate-200 p-4 shadow-sm'>
            <h3 className='font-semibold text-sm text-slate-800 mb-2 flex items-center gap-2'>
              <Lightbulb className='w-4 h-4 text-amber-500' />
              API оператора
            </h3>
            <div>
              {API_SECTIONS.map((section) => (
                <Collapsible
                  key={section.title}
                  title={section.title}
                  icon={section.icon}
                  defaultOpen={section.title === 'Движение'}
                >
                  {section.methods.map((method) => (
                    <MethodItem
                      key={method.name}
                      name={method.name}
                      desc={method.desc}
                    />
                  ))}
                </Collapsible>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'submitted':
      return 'Отправлено';
    case 'under_review':
      return 'На проверке';
    case 'approved':
      return 'Одобрено';
    case 'rejected':
      return 'Отклонено';
    case 'returned':
      return 'Нужно исправить';
    case 'draft':
    default:
      return 'Черновик';
  }
}

function getStatusAlertAppearance(status: string) {
  switch (status) {
    case 'approved':
      return {
        container: 'border-emerald-200 bg-emerald-50',
        iconWrap: 'bg-emerald-100',
        icon: 'text-emerald-700',
        eyebrow: 'text-emerald-600',
        title: 'text-emerald-900',
      };
    case 'rejected':
      return {
        container: 'border-rose-200 bg-rose-50',
        iconWrap: 'bg-rose-100',
        icon: 'text-rose-700',
        eyebrow: 'text-rose-500',
        title: 'text-rose-900',
      };
    case 'returned':
      return {
        container: 'border-amber-200 bg-amber-50',
        iconWrap: 'bg-amber-100',
        icon: 'text-amber-700',
        eyebrow: 'text-amber-600',
        title: 'text-amber-900',
      };
    case 'under_review':
      return {
        container: 'border-sky-200 bg-sky-50',
        iconWrap: 'bg-sky-100',
        icon: 'text-sky-700',
        eyebrow: 'text-sky-600',
        title: 'text-sky-900',
      };
    case 'submitted':
      return {
        container: 'border-indigo-200 bg-indigo-50',
        iconWrap: 'bg-indigo-100',
        icon: 'text-indigo-700',
        eyebrow: 'text-indigo-500',
        title: 'text-indigo-900',
      };
    case 'draft':
    default:
      return {
        container: 'border-slate-200 bg-slate-50',
        iconWrap: 'bg-slate-200',
        icon: 'text-slate-700',
        eyebrow: 'text-slate-500',
        title: 'text-slate-900',
      };
  }
}

function getStatusDescription(status: string) {
  switch (status) {
    case 'submitted':
      return 'Код отправлен и ждёт очереди на проверку.';
    case 'under_review':
      return 'Код сейчас находится на модерации.';
    case 'approved':
      return 'Текущая версия одобрена и может использоваться в боях.';
    case 'rejected':
      return 'Текущая версия отклонена.';
    case 'returned':
      return 'Версия возвращена на доработку.';
    case 'draft':
    default:
      return 'Сейчас сохранён черновик, но он ещё не отправлен на модерацию.';
  }
}

function formatSubmissionDate(value: string) {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(value));
  } catch {
    return value;
  }
}
