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
      <div className="max-w-5xl mx-auto px-4 py-10">
        <AuthRequiredCard
          returnTo="/profile"
          title="Нужна авторизация"
          description="Войдите, чтобы открыть профиль."
        />
      </div>
    );
  }

  const hasModerationAccess = user.roles.some(
    (role) => role === 'moderator' || role === 'admin',
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">
          Profile
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Профиль</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-white/10 bg-gray-900/40 p-5 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">
              Аккаунт
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              {user.name ?? user.username}
            </p>
            <p className="mt-1 text-sm text-gray-400">@{user.username}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-gray-500">Email</p>
              <p className="mt-2 text-sm text-white">
                {user.email ?? 'Не указан'}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-gray-500">Роли</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {user.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs text-white"
                  >
                    {roleLabels[role] ?? role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gray-900/40 p-5 space-y-3">
          <h2 className="text-lg font-semibold text-white">Разделы</h2>

          <Link
            href="/editor"
            className="block rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-200 hover:bg-white/5"
          >
            Мой код
          </Link>

          <Link
            href="/"
            className="block rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-200 hover:bg-white/5"
          >
            Арена
          </Link>

          {hasModerationAccess && (
            <>
              <Link
                href="/moderation"
                className="block rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-200 hover:bg-white/5"
              >
                Модерация
              </Link>
              <Link
                href="/map-editor"
                className="block rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-200 hover:bg-white/5"
              >
                Конструктор
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
