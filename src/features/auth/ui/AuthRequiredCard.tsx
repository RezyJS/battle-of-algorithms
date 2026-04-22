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
    <div className='max-w-md mx-auto rounded-2xl border border-slate-200 bg-white/85 p-8 text-center shadow-sm'>
      <h1 className='text-2xl font-semibold text-slate-950'>{title}</h1>
      <p className='mt-3 text-sm text-slate-600'>{description}</p>

      <div className='mt-6 flex flex-col gap-3'>
        <button
          onClick={() => {
            window.location.href = loginHref;
          }}
          className='flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-500 shadow-sm'
        >
          Войти
        </button>
        <button
          onClick={() => {
            window.location.href = registerHref;
          }}
          className='flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100'
        >
          Регистрация
        </button>
      </div>
    </div>
  );
}
