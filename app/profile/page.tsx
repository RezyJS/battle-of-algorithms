import Link from 'next/link';

import { AuthRequiredCard } from '@/src/features/auth/ui/AuthRequiredCard';
import { getCurrentUser } from '@/src/shared/lib/auth/session';

const roleLabels: Record<string, string> = {
  user: 'Пользователь',
  moderator: 'Модератор',
  admin: 'Администратор',
};

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className='max-w-5xl mx-auto px-4 py-10'>
        <AuthRequiredCard
          returnTo='/profile'
          title='Нужна авторизация'
          description='Войдите, чтобы открыть профиль.'
        />
      </div>
    );
  }

  return (
    <div className='max-w-5xl mx-auto px-4 py-6 space-y-4'>
      <div className='rounded-2xl border border-slate-200 bg-white/80 p-5 space-y-4 shadow-sm'>
        <div>
          <p className='text-xs uppercase tracking-[0.2em] text-indigo-600'>
            Аккаунт
          </p>
          <p className='mt-2 text-xl font-semibold text-slate-950'>
            {user.name ?? user.username}
          </p>
          <p className='mt-1 text-sm text-slate-600'>@{user.username}</p>
        </div>

        <div className='grid gap-3 md:grid-cols-2'>
          <div className='rounded-xl border border-slate-200 bg-slate-50 p-4'>
            <p className='text-xs text-slate-500'>Email</p>
            <p className='mt-2 text-sm text-slate-900'>
              {user.email ?? 'Не указан'}
            </p>
          </div>

          <div className='rounded-xl border border-slate-200 bg-slate-50 p-4'>
            <p className='text-xs text-slate-500'>Роли</p>
            <div className='mt-2 flex flex-wrap gap-2'>
              {user.roles.map((role) => (
                <span
                  key={role}
                  className='rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700'
                >
                  {roleLabels[role] ?? role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
