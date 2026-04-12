import Link from 'next/link';

export function AuthRequiredCard({
  title = 'Нужна авторизация',
  description = 'Чтобы открыть этот раздел, войдите или создайте аккаунт.',
  returnTo = '/',
}: {
  title?: string;
  description?: string;
  returnTo?: string;
}) {
  const loginHref = `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
  const registerHref = `/api/auth/register?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <div className="max-w-md mx-auto rounded-2xl border border-white/10 bg-gray-900/70 p-8 text-center">
      <h1 className="text-2xl font-semibold text-white">{title}</h1>
      <p className="mt-3 text-sm text-gray-400">{description}</p>

      <div className="mt-6 flex flex-col gap-3">
        <Link
          href={loginHref}
          className="flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          Войти
        </Link>
        <Link
          href={registerHref}
          className="flex h-11 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-medium text-gray-200 transition-colors hover:bg-white/5"
        >
          Регистрация
        </Link>
      </div>
    </div>
  );
}
