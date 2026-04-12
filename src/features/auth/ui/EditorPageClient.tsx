'use client';

import { startTransition, useEffect, useState } from 'react';
import {
  ArrowRight,
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
import { ScriptEditor } from '@/src/features/script-editor';
import type { UserSubmission } from '@/src/shared/lib/api/internal';

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
    <div className="border-b border-gray-800 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 py-2.5 px-1 text-sm font-medium text-gray-300 hover:text-white transition-colors"
      >
        <Icon className="w-3.5 h-3.5 text-gray-500 shrink-0" />
        <span className="flex-1 text-left">{title}</span>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
        )}
      </button>
      {open && <div className="pb-3 space-y-1">{children}</div>}
    </div>
  );
}

function MethodItem({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="px-2 py-1.5 rounded-md hover:bg-gray-800/50 transition-colors">
      <code className="text-xs text-indigo-300 font-mono">{name}</code>
      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
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
      { name: 'operator.scan(radius)', desc: '2D-массив клеток вокруг оператора' },
    ],
  },
  {
    title: 'Навигация',
    icon: Compass,
    methods: [
      { name: 'operator.getDistanceTo("key")', desc: 'Расстояние до ближайшего ключа' },
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
      { name: 'operator.isMarked(dx, dy)', desc: 'Проверить метку со смещением' },
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

const TIPS = [
  {
    title: 'Ограничивайте циклы',
    code: 'for (let i = 0; i < 800; i++) {\n  if (operator.hasExited()) break;\n  // ...\n}',
  },
  {
    title: 'Метки против зацикливания',
    code: 'operator.markCell();\nif (!operator.isMarked(1, 0)) {\n  operator.moveRight();\n}',
  },
  {
    title: 'Смена стратегии после ключа',
    code: 'const target = operator.hasKey()\n  ? "exit" : "key";\nconst d = operator.getDistanceTo(target);',
  },
];

export function EditorPageClient({
  currentUserName,
  initialSubmission,
}: {
  currentUserName: string;
  initialSubmission: UserSubmission | null;
}) {
  const { scripts, setScript, isRunning } = useGameStore();
  const [submission, setSubmission] = useState<UserSubmission | null>(
    initialSubmission,
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
    setErrorMessage(null);
    setStatusMessage(null);
    setIsSaving(true);

    startTransition(async () => {
      try {
        const nextSubmission = await saveEditorDraftAction(scripts[0]);
        setSubmission(nextSubmission);
        setStatusMessage('Черновик сохранён');
      } catch {
        setErrorMessage('Не удалось сохранить черновик');
      } finally {
        setIsSaving(false);
      }
    });
  };

  const handleSubmit = () => {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsSubmitting(true);

    startTransition(async () => {
      try {
        const nextSubmission = await submitEditorCodeAction(scripts[0]);
        setSubmission(nextSubmission);
        setStatusMessage('Код отправлен');
      } catch {
        setErrorMessage('Не удалось отправить код');
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Мой код</h1>
        <p className="text-gray-400 text-sm mt-1">
          Здесь редактируется только ваш алгоритм.
        </p>
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <div className="mb-4 rounded-xl border border-white/10 bg-gray-900/50 px-4 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">
                  Участник
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  {currentUserName}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-medium text-gray-200">
                  {getStatusLabel(currentStatus)}
                </span>
                <span className="text-xs text-gray-500">
                  Версия {submission?.version ?? 1}
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saveDisabled}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Отправка...' : 'Отправить на модерацию'}
              </button>
            </div>

            {(statusMessage || errorMessage || submission?.moderation_comment) && (
              <div className="mt-4 space-y-2 text-sm">
                {statusMessage && (
                  <p className="text-emerald-300">{statusMessage}</p>
                )}
                {errorMessage && <p className="text-red-300">{errorMessage}</p>}
                {submission?.moderation_comment && (
                  <p className="text-amber-300">
                    Комментарий: {submission.moderation_comment}
                  </p>
                )}
              </div>
            )}
          </div>

          <ScriptEditor
            playerLabel="Мой алгоритм"
            playerEmoji="⚙️"
            script={scripts[0]}
            onScriptChange={(script) => setScript(0, script)}
            disabled={isRunning}
          />
        </div>

        <div className="w-72 space-y-4">
          <div className="bg-gray-900/50 rounded-xl border border-white/5 p-4">
            <h3 className="font-semibold text-sm text-gray-200 mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
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

          <div className="bg-gray-900/50 rounded-xl border border-white/5 p-4">
            <h3 className="font-semibold text-sm text-gray-200 mb-3">
              Советы
            </h3>
            <div className="space-y-3">
              {TIPS.map((tip) => (
                <div key={tip.title}>
                  <h4 className="text-xs font-semibold text-gray-300 mb-1">
                    {tip.title}
                  </h4>
                  <pre className="text-xs bg-gray-950 rounded-md p-2 text-green-400 font-mono overflow-x-auto">
                    {tip.code}
                  </pre>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-950/30 border border-amber-800/30 rounded-xl p-3">
            <p className="text-xs text-amber-300">
              Максимум 1000 шагов. Всегда ставьте ограничение циклов и условие
              выхода.
            </p>
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
