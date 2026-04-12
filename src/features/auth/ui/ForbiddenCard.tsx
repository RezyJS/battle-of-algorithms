import Link from 'next/link';

export function ForbiddenCard({
  title = 'Доступ запрещён',
  description = 'Для этого раздела не хватает прав.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="max-w-md mx-auto rounded-2xl border border-white/10 bg-gray-900/70 p-8 text-center">
      <h1 className="text-2xl font-semibold text-white">{title}</h1>
      <p className="mt-3 text-sm text-gray-400">{description}</p>

      <Link
        href="/"
        className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-white/10 px-5 text-sm font-medium text-gray-200 transition-colors hover:bg-white/5"
      >
        На главную
      </Link>
    </div>
  );
}
