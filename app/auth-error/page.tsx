import Link from 'next/link';

const ERROR_MESSAGES: Record<string, string> = {
  oauth: 'Не удалось выполнить вход.',
  callback: 'Ответ от сервиса авторизации некорректен.',
  state: 'Сессия входа истекла. Попробуйте ещё раз.',
  exchange: 'Не удалось завершить вход.',
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawCode = params.code;
  const code = Array.isArray(rawCode) ? rawCode[0] : rawCode;
  const message =
    (code && ERROR_MESSAGES[code]) ?? 'Произошла ошибка авторизации.';

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900/70 p-8 text-center">
        <h1 className="text-2xl font-semibold text-white">{message}</h1>
        <Link
          href="/api/auth/login"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          Попробовать снова
        </Link>
      </div>
    </div>
  );
}
