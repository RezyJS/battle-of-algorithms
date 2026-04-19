import Link from 'next/link';

import { AuthRequiredCard } from '@/src/features/auth/ui/AuthRequiredCard';
import { ForbiddenCard } from '@/src/features/auth/ui/ForbiddenCard';
import { ModerationSubmissionCard } from '@/src/features/moderation/ui/ModerationSubmissionCard';
import { getModerationSubmissions } from '@/src/shared/lib/api/internal';
import { getCurrentUser } from '@/src/shared/lib/auth/session';

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
        <div className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white shadow-sm">
          Отправки
        </div>
        <Link
          href="/moderation/arena"
          className="rounded-lg border border-slate-200 bg-white/70 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Состав арены
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-600">
          Moderation
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          Панель модерации
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Здесь будут только отправки кода и действия модерации.
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <p className="text-sm text-slate-600">Отправок пока нет.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <ModerationSubmissionCard
              key={submission.id}
              submission={submission}
            />
          ))}
        </div>
      )}
    </div>
  );
}
