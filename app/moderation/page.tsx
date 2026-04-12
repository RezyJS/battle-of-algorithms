import Link from 'next/link';

import { AuthRequiredCard } from '@/src/features/auth/ui/AuthRequiredCard';
import { ForbiddenCard } from '@/src/features/auth/ui/ForbiddenCard';
import { getModerationSubmissions } from '@/src/shared/lib/api/internal';
import { getCurrentUser } from '@/src/shared/lib/auth/session';
import { updateSubmissionStatusAction } from '@/app/moderation/actions';

export default async function ModerationPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <AuthRequiredCard
          returnTo="/moderation"
          title="Нужна авторизация"
          description="Войдите, чтобы открыть панель модерации."
        />
      </div>
    );
  }

  const hasAccess = user.roles.some(
    (role) => role === 'moderator' || role === 'admin',
  );

  if (!hasAccess) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <ForbiddenCard description="Панель модерации доступна только модераторам и администраторам." />
      </div>
    );
  }

  const submissions = await getModerationSubmissions();

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div className="flex gap-2">
        <div className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">
          Отправки
        </div>
        <Link
          href="/moderation/arena"
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
        >
          Состав арены
        </Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">
          Moderation
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">
          Панель модерации
        </h1>
        <p className="mt-3 text-sm text-gray-400">
          Здесь будут только отправки кода и действия модерации.
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-gray-900/40 p-6">
          <p className="text-sm text-gray-400">Отправок пока нет.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="rounded-2xl border border-white/10 bg-gray-900/40 p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">
                    Submission #{submission.id}
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-white">
                    {submission.display_name ?? submission.username}
                  </h2>
                  <p className="mt-1 text-sm text-gray-400">
                    @{submission.username} · {submission.language} · версия {submission.version}
                  </p>
                </div>

                <div className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white">
                  {submission.status}
                </div>
              </div>

              <div className="grid gap-2 text-sm text-gray-400 md:grid-cols-2">
                <p>Создано: {new Date(submission.created_at).toLocaleString('ru-RU')}</p>
                <p>
                  Модератор: {submission.moderator_username ?? 'ещё не назначен'}
                </p>
                {submission.submitted_at && (
                  <p>
                    Отправлено: {new Date(submission.submitted_at).toLocaleString('ru-RU')}
                  </p>
                )}
                {submission.moderation_comment && (
                  <p>Комментарий: {submission.moderation_comment}</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">
                  Код
                </p>
                <pre className="overflow-x-auto rounded-xl border border-white/10 bg-gray-950 p-4 text-xs leading-6 text-green-300">
                  <code>{submission.code}</code>
                </pre>
              </div>

              <form action={updateSubmissionStatusAction} className="space-y-3">
                <input
                  type="hidden"
                  name="submission_id"
                  value={submission.id}
                />

                <textarea
                  name="comment"
                  rows={3}
                  placeholder="Комментарий модератора"
                  defaultValue={submission.moderation_comment ?? ''}
                  className="w-full rounded-xl border border-white/10 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500"
                />

                <div className="flex flex-wrap gap-2">
                  {[
                    ['under_review', 'В работу'],
                    ['approved', 'Одобрить'],
                    ['rejected', 'Отклонить'],
                    ['returned', 'На доработку'],
                  ].map(([status, label]) => (
                    <button
                      key={status}
                      type="submit"
                      name="status"
                      value={status}
                      className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-200 hover:bg-white/5"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
