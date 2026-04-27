import { AuthRequiredCard } from '@/src/features/auth/ui/AuthRequiredCard';
import { ForbiddenCard } from '@/src/features/auth/ui/ForbiddenCard';
import { ModerationSubmissionCard } from '@/src/features/moderation/ui/ModerationSubmissionCard';
import { getModerationSubmissionsPage } from '@/src/shared/lib/api/internal';
import { getCurrentUser } from '@/src/shared/lib/auth/session';
import { PollingRefresh } from '@/src/shared/ui/PollingRefresh';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';

const STATUS_FILTER_OPTIONS = [
  ['all', 'Все статусы'],
  ['draft', 'Черновики'],
  ['submitted', 'Отправлено'],
  ['under_review', 'На проверке'],
  ['approved', 'Одобрено'],
  ['rejected', 'Отклонено'],
  ['returned', 'На доработке'],
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
    <div className='max-w-7xl mx-auto px-4 py-6'>
      <PollingRefresh intervalMs={5000} />

      <div className='mb-6 flex gap-3 md:flex-row md:items-end md:justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-slate-950'>
            Панель модерации
          </h1>
          <p className='mt-1 text-sm text-slate-600'>
            Проверка отправок кода и смена статусов.
          </p>
        </div>
      </div>

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]'>
        <div className='space-y-4'>
          {submissionsPage.items.length === 0 ?
            <div className='rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
              <p className='text-sm text-slate-600'>Отправок пока нет.</p>
            </div>
          : submissionsPage.items.map((submission) => (
              <ModerationSubmissionCard
                key={submission.id}
                submission={submission}
              />
            ))
          }
        </div>

        <aside className='space-y-4 xl:sticky xl:top-20 xl:self-start'>
          <form className='rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
            <h2 className='text-sm font-semibold text-slate-900'>Фильтры</h2>
            <div className='mt-4 flex flex-col gap-3'>
              <input
                type='text'
                name='query'
                defaultValue={query}
                placeholder='Ник, имя или комментарий'
                className='rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500'
              />
              <Select
                name='status'
                defaultValue={status}
              >
                <SelectTrigger className='w-full bg-white'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {STATUS_FILTER_OPTIONS.map(([value, label]) => (
                      <SelectItem
                        key={value}
                        value={value}
                      >
                        {label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <button
                type='submit'
                className='rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white shadow-sm hover:bg-indigo-500'
              >
                Фильтровать
              </button>
            </div>
          </form>

          <div className='rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm'>
            <h2 className='text-sm font-semibold text-slate-900'>Сводка</h2>
            <p className='mt-3'>Найдено {submissionsPage.total} отправок.</p>
            <p className='mt-1'>
              Страница {submissionsPage.page} из {totalPages}.
            </p>
          </div>

          {totalPages > 1 && (
            <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
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
                href={buildPageHref(
                  Math.min(totalPages, submissionsPage.page + 1),
                )}
                aria-disabled={submissionsPage.page >= totalPages}
                className='rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 aria-disabled:pointer-events-none aria-disabled:opacity-50'
              >
                Вперёд
              </a>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
