'use client';

import { Eye, FileCode2, MessageSquareText } from 'lucide-react';

import { updateSubmissionStatusAction } from '@/app/moderation/actions';
import type { ModerationSubmission } from '@/src/shared/lib/api/internal';
import { JavaScriptCodeEditor } from '@/src/shared/ui/JavaScriptCodeEditor';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/src/shared/ui/sheet';

const STATUS_OPTIONS = [
  ['under_review', 'В работу'],
  ['approved', 'Одобрить'],
  ['rejected', 'Отклонить'],
  ['returned', 'На доработку'],
] as const;

const STATUS_BUTTON_STYLES: Record<(typeof STATUS_OPTIONS)[number][0], string> = {
  under_review:
    'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100',
  approved:
    'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  rejected:
    'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
  returned:
    'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString('ru-RU') : null;
}

function getCodeStats(code: string) {
  const lines = code.split('\n').length;
  return {
    lines,
    chars: code.length,
  };
}

export function ModerationSubmissionCard({
  submission,
}: {
  submission: ModerationSubmission;
}) {
  const stats = getCodeStats(submission.code);
  const submittedAt = formatDate(submission.submitted_at);
  const createdAt = formatDate(submission.created_at);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-600">
            Submission #{submission.id}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">
            {submission.display_name ?? submission.username}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            @{submission.username} · {submission.language} · версия {submission.version}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800">
          {submission.status}
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
        <p>Создано: {createdAt}</p>
        <p>Модератор: {submission.moderator_username ?? 'ещё не назначен'}</p>
        {submittedAt && <p>Отправлено: {submittedAt}</p>}
        {submission.moderation_comment && (
          <p>Комментарий: {submission.moderation_comment}</p>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/70 p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm">
            <FileCode2 className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-950">
              Код скрыт в боковой панели
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {stats.lines} строк, {stats.chars} символов
            </p>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 shadow-sm"
              >
                <Eye className="size-4" />
                Посмотреть полностью
              </button>
            </SheetTrigger>

            <SheetContent>
              <SheetHeader>
                <SheetTitle>
                  {submission.display_name ?? submission.username}
                </SheetTitle>
                <SheetDescription>
                  @{submission.username} · {submission.language} · версия {submission.version}
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <div className="flex flex-col gap-5">
                  <div className="text-sm">
                    <p>Статус: {submission.status}</p>
                    <p className="mt-1">{stats.lines} строк, {stats.chars} символов</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Код</p>
                    <div className="mt-2">
                      <JavaScriptCodeEditor
                        value={submission.code}
                        editable={false}
                        height="420px"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <MessageSquareText className="size-4" />
                      <p className="text-sm font-medium">
                        Комментарий модератора
                      </p>
                    </div>

                    <form action={updateSubmissionStatusAction} className="mt-3 flex flex-col gap-3">
                      <input
                        type="hidden"
                        name="submission_id"
                        value={submission.id}
                      />

                      <textarea
                        name="comment"
                        rows={6}
                        placeholder="Комментарий модератора"
                        defaultValue={submission.moderation_comment ?? ''}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      />

                      <SheetFooter>
                        <div className="flex flex-wrap gap-2">
                          {STATUS_OPTIONS.map(([status, label]) => (
                            <button
                              key={status}
                              type="submit"
                              name="status"
                              value={status}
                              className={`rounded-md border px-4 py-2 text-sm transition-colors ${STATUS_BUTTON_STYLES[status]}`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </SheetFooter>
                    </form>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
