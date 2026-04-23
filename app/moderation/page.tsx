import { AuthRequiredCard } from '@/src/features/auth/ui/AuthRequiredCard';
import { ForbiddenCard } from '@/src/features/auth/ui/ForbiddenCard';
import { ModerationSubmissionCard } from '@/src/features/moderation/ui/ModerationSubmissionCard';
import { ModerationNav } from '@/src/features/moderation/ui/ModerationNav';
import { getModerationSubmissionsPage } from '@/src/shared/lib/api/internal';
import { getCurrentUser } from '@/src/shared/lib/auth/session';
import { PollingRefresh } from '@/src/shared/ui/PollingRefresh';

const STATUS_FILTER_OPTIONS = [
  ['all', 'Все статусы'],
  ['draft', 'Draft'],
  ['submitted', 'Submitted'],
  ['under_review', 'Under review'],
  ['approved', 'Approved'],
  ['rejected', 'Rejected'],
  ['returned', 'Returned'],
] as const;

type ModerationPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ModerationPage({
  searchParams,
}: ModerationPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className='max-w-5xl mx-auto px-4 py-10'>
        <AuthRequiredCard
          returnTo='/moderation'
          title='Нужна авторизация'
          description='Войдите, чтобы открыть панель модерации.'
        />
      </div>
    );
  }

  const hasAccess = user.roles.some(
    (role) => role === 'moderator' || role === 'admin',
  );

  if (!hasAccess) {
    return (
      <div className='max-w-5xl mx-auto px-4 py-10'>
        <ForbiddenCard description='Панель модерации доступна только модераторам и администраторам.' />
      </div>
    );
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const query = firstValue(resolvedSearchParams.query) ?? '';
  const status = firstValue(resolvedSearchParams.status) ?? 'all';
  const page = Math.max(1, Number(firstValue(resolvedSearchParams.page) ?? '1') || 1);
  const submissionsPage = await getModerationSubmissionsPage({
    query,
    status,
    page,
    pageSize: 8,
  });
  const totalPages = Math.max(
    1,
    Math.ceil(submissionsPage.total / submissionsPage.page_size),
  );

  const buildPageHref = (nextPage: number) => {
    const nextSearchParams = new URLSearchParams();

    if (query) {
      nextSearchParams.set('query', query);
    }

    if (status && status !== 'all') {
      nextSearchParams.set('status', status);
    }

    nextSearchParams.set('page', String(nextPage));

    return `/moderation?${nextSearchParams.toString()}`;
  };

  return (
    <div className='max-w-5xl mx-auto px-4 py-6 space-y-4'>
      <PollingRefresh intervalMs={5000} />

      <ModerationNav />

      <div className='rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm'>
        <p className='text-xs uppercase tracking-[0.3em] text-indigo-600'>
          Moderation
        </p>
        <h1 className='mt-2 text-2xl font-semibold text-slate-950'>
          Панель модерации
        </h1>
        <p className='mt-3 text-sm text-slate-600'>
          Здесь будут только отправки кода и действия модерации.
        </p>
      </div>

      <form className='grid gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_220px_auto]'>
        <input
          type='text'
          name='query'
          defaultValue={query}
          placeholder='Поиск по нику, имени или комментарию'
          className='rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500'
        />
        <select
          name='status'
          defaultValue={status}
          className='rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-500'
        >
          {STATUS_FILTER_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type='submit'
          className='rounded-xl bg-slate-900 px-4 py-3 text-sm text-white hover:bg-slate-800'
        >
          Фильтровать
        </button>
      </form>

      <div className='rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600 shadow-sm'>
        Найдено {submissionsPage.total} отправок. Страница {submissionsPage.page} из{' '}
        {totalPages}.
      </div>

      {submissionsPage.items.length === 0 ?
        <div className='rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm'>
          <p className='text-sm text-slate-600'>Отправок пока нет.</p>
        </div>
      : <div className='space-y-4'>
          {submissionsPage.items.map((submission) => (
            <ModerationSubmissionCard
              key={submission.id}
              submission={submission}
            />
          ))}
        </div>
      }

      {totalPages > 1 && (
        <div className='flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm'>
          <a
            href={buildPageHref(Math.max(1, submissionsPage.page - 1))}
            aria-disabled={submissionsPage.page <= 1}
            className='rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 aria-disabled:pointer-events-none aria-disabled:opacity-50'
          >
            Назад
          </a>
          <p className='text-sm text-slate-600'>
            {submissionsPage.page}/{totalPages}
          </p>
          <a
            href={buildPageHref(Math.min(totalPages, submissionsPage.page + 1))}
            aria-disabled={submissionsPage.page >= totalPages}
            className='rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 aria-disabled:pointer-events-none aria-disabled:opacity-50'
          >
            Вперёд
          </a>
        </div>
      )}
    </div>
  );
}
